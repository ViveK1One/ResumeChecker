import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import ResumeDraft from '@/models/ResumeDraft'
import { toResumeDraftContent } from '@/lib/resumeDraft/serialize'
import { tryGeminiModels, extractJsonObject } from '@/lib/geminiClient'
import { studentProfileFromDraft, emptyStudentProfile } from '@/lib/applicationPack/profileFromDraft'
import {
  buildMatchAnalysisPrompt,
  buildLatexResumePrompt,
  buildCoverLetterPrompt,
  finalizeLatexDocument,
  finalizeCoverLetterLatex,
} from '@/lib/applicationPack/prompts'
import type {
  ApplicationLanguage,
  JobApplicationInput,
  MatchAnalysis,
  StudentProfileInput,
} from '@/lib/applicationPack/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const rateStore = new Map<string, { count: number; reset: number }>()

/** Free users get this many full Application Pack generations before Pro is required. */
export const FREE_APPLICATION_PACK_LIMIT = 3

function rateLimit(ip: string, max = 8): boolean {
  const now = Date.now()
  const r = rateStore.get(ip)
  if (!r || now >= r.reset) {
    rateStore.set(ip, { count: 1, reset: now + 3600000 })
    return true
  }
  if (r.count >= max) return false
  r.count++
  return true
}

function normalizeAnalysis(raw: Record<string, unknown>): MatchAnalysis {
  return {
    match_score: Math.max(0, Math.min(100, Number(raw.match_score) || 0)),
    top_keywords: Array.isArray(raw.top_keywords) ? raw.top_keywords.map(String).slice(0, 15) : [],
    best_projects: Array.isArray(raw.best_projects) ? raw.best_projects.map(String).slice(0, 6) : [],
    skill_category_order: Array.isArray(raw.skill_category_order)
      ? raw.skill_category_order.map(String).slice(0, 10)
      : [],
    missing_skills: Array.isArray(raw.missing_skills) ? raw.missing_skills.map(String).slice(0, 20) : [],
    profile_summary_focus: String(raw.profile_summary_focus || ''),
  }
}

function parseJob(body: Record<string, unknown>): JobApplicationInput {
  const legacy = body.language === 'English' ? 'English' : body.language === 'German' ? 'German' : null
  const resumeLanguage =
    body.resumeLanguage === 'English' || body.resumeLanguage === 'German'
      ? (body.resumeLanguage as ApplicationLanguage)
      : legacy || 'German'
  const coverLetterLanguage =
    body.coverLetterLanguage === 'English' || body.coverLetterLanguage === 'German'
      ? (body.coverLetterLanguage as ApplicationLanguage)
      : legacy || resumeLanguage
  return {
    jobDescription: String(body.jobDescription || '').trim(),
    companyName: String(body.companyName || '').trim(),
    companyCity: String(body.companyCity || '').trim(),
    language: resumeLanguage,
    resumeLanguage,
    coverLetterLanguage,
    hiringManagerName: String(body.hiringManagerName || '').trim(),
    startDate: String(body.startDate || '').trim(),
    hoursPerWeek: String(body.hoursPerWeek || '').trim(),
    relocationNote: String(body.relocationNote || '').trim(),
  }
}

function parseProfile(body: Record<string, unknown>): StudentProfileInput {
  const base = emptyStudentProfile()
  const p = (body.profile as Record<string, unknown>) || body
  for (const key of Object.keys(base) as (keyof StudentProfileInput)[]) {
    if (p[key] !== undefined) base[key] = String(p[key] ?? '')
  }
  return base
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function GET(request: NextRequest) {
  const rawEmail = await getEmailForRoute(request)
  if (!rawEmail) {
    return NextResponse.json({ error: 'Sign in required', requiresAuth: true }, { status: 401 })
  }
  const userEmail = normalizeEmail(rawEmail)

  try {
    await dbConnect()
    const user = await User.findOne({ email: userEmail }).lean()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const u = user as Record<string, unknown>
    const tier = String(u.subscriptionTier || 'free')
    const isPro = tier === 'pro' || tier === 'lifetime'
    const applicationPackCount = Number(u.applicationPackCount) || 0
    const remaining = isPro
      ? null
      : Math.max(0, FREE_APPLICATION_PACK_LIMIT - applicationPackCount)

    const draft = await ResumeDraft.findOne({
      userEmail: { $regex: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    })
      .sort({ updatedAt: -1 })
      .lean()
    let profile = emptyStudentProfile()
    let draftId: string | null = null
    let draftTitle: string | null = null

    if (draft) {
      const d = draft as Record<string, unknown>
      draftId = String(d._id)
      draftTitle = String(d.title || 'Resume')
      const content = toResumeDraftContent(d)
      profile = studentProfileFromDraft(content, {
        accountName: String(u.name || ''),
        accountEmail: userEmail,
      })
    } else {
      profile.name = String(u.name || '')
      profile.email = userEmail
    }

    return NextResponse.json({
      isPro,
      subscriptionTier: tier,
      applicationPackCount,
      freeLimit: FREE_APPLICATION_PACK_LIMIT,
      remaining,
      draftId,
      draftTitle,
      profile,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load profile'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** Persist +1 pack usage. Uses native collection update so HMR/stale schemas cannot strip the field. */
async function incrementApplicationPackCount(userEmail: string): Promise<number> {
  const email = normalizeEmail(userEmail)
  const result = await User.collection.updateOne(
    { email },
    { $inc: { applicationPackCount: 1 } }
  )
  if (result.matchedCount === 0) {
    // Fallback if stored email casing differs from normalized
    await User.collection.updateOne(
      { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      { $inc: { applicationPackCount: 1 } }
    )
  }
  const doc = await User.collection.findOne(
    { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
    { projection: { applicationPackCount: 1 } }
  )
  const count = Number(doc?.applicationPackCount) || 0
  if (count < 1) {
    console.error('[application-pack] failed to persist applicationPackCount for', email, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    })
  }
  return count
}

export async function POST(request: NextRequest) {
  const rawEmail = await getEmailForRoute(request)
  if (!rawEmail) {
    return NextResponse.json({ error: 'Sign in required', requiresAuth: true }, { status: 401 })
  }
  const userEmail = normalizeEmail(rawEmail)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  try {
    await dbConnect()
    const user = await User.findOne({ email: userEmail }).lean()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const u = user as Record<string, unknown>
    const tier = String(u.subscriptionTier || 'free')
    const isPro = tier === 'pro' || tier === 'lifetime'
    const applicationPackCount = Number(u.applicationPackCount) || 0

    const body = await request.json()
    const action = String(body.action || 'generate')
    const profile = parseProfile(body)
    const job = parseJob(body)

    if (!job.jobDescription || job.jobDescription.length < 40) {
      return NextResponse.json({ error: 'Paste a full job description (at least a few sentences).' }, { status: 400 })
    }
    if (!profile.name.trim() || !profile.email.trim()) {
      return NextResponse.json({ error: 'Name and email are required in your profile.' }, { status: 400 })
    }

    // Free: 3 full pack generations. Analyze does not consume a pack.
    const freeExhausted = !isPro && applicationPackCount >= FREE_APPLICATION_PACK_LIMIT
    if (freeExhausted) {
      return NextResponse.json(
        {
          error: `You've used your ${FREE_APPLICATION_PACK_LIMIT} free Application Packs. Upgrade to Pro for unlimited tailored Lebenslauf + Anschreiben.`,
          requiresUpgrade: true,
          applicationPackCount,
          freeLimit: FREE_APPLICATION_PACK_LIMIT,
          remaining: 0,
        },
        { status: 403 }
      )
    }

    if (action === 'analyze') {
      const raw = await tryGeminiModels(buildMatchAnalysisPrompt(profile, job), GEMINI_API_KEY, {
        temperature: 0.3,
        maxOutputTokens: 2048,
      })
      const analysis = normalizeAnalysis(extractJsonObject(raw) as Record<string, unknown>)
      return NextResponse.json({
        analysis,
        applicationPackCount,
        remaining: isPro ? null : Math.max(0, FREE_APPLICATION_PACK_LIMIT - applicationPackCount),
        freeLimit: FREE_APPLICATION_PACK_LIMIT,
      })
    }

    // Full pack: analyze → latex → cover letter
    let analysis: MatchAnalysis
    if (body.analysis && typeof body.analysis === 'object') {
      analysis = normalizeAnalysis(body.analysis as Record<string, unknown>)
    } else {
      const rawA = await tryGeminiModels(buildMatchAnalysisPrompt(profile, job), GEMINI_API_KEY, {
        temperature: 0.3,
        maxOutputTokens: 2048,
      })
      analysis = normalizeAnalysis(extractJsonObject(rawA) as Record<string, unknown>)
    }

    const [latexRaw, coverRaw] = await Promise.all([
      tryGeminiModels(buildLatexResumePrompt(profile, job, analysis), GEMINI_API_KEY, {
        temperature: 0.35,
        maxOutputTokens: 16384,
      }),
      tryGeminiModels(buildCoverLetterPrompt(profile, job), GEMINI_API_KEY, {
        temperature: 0.45,
        maxOutputTokens: 4096,
      }),
    ])

    const babel = job.resumeLanguage === 'German' ? 'ngerman' : 'english'
    const latexSource = finalizeLatexDocument(latexRaw, babel)
    const coverBabel = job.coverLetterLanguage === 'German' ? 'ngerman' : 'english'
    const coverLetter = finalizeCoverLetterLatex(coverRaw, coverBabel)

    if (body.saveToDraft && body.draftId) {
      const patch: Record<string, unknown> = { generatedLatex: latexSource }
      if (job.companyName) {
        patch.title = `${profile.name || 'Resume'} — ${job.companyName}`.slice(0, 120)
      }
      await ResumeDraft.findOneAndUpdate({ _id: body.draftId, userEmail }, { $set: patch })
    }

    // Count only successful full generations (Lebenslauf + Anschreiben)
    let newCount = applicationPackCount
    let remaining: number | null = null
    if (!isPro) {
      newCount = await incrementApplicationPackCount(userEmail)
      // If DB write somehow failed, still charge this response so UI moves
      if (newCount <= applicationPackCount) {
        newCount = applicationPackCount + 1
      }
      remaining = Math.max(0, FREE_APPLICATION_PACK_LIMIT - newCount)
    }

    return NextResponse.json({
      analysis,
      latexSource,
      coverLetter,
      applicationPackCount: newCount,
      freeLimit: FREE_APPLICATION_PACK_LIMIT,
      remaining,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Generation failed'
    console.error('[application-pack]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
