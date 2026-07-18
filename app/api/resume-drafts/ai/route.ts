import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import ResumeDraft from '@/models/ResumeDraft'
import { tryGeminiModels, extractJsonObject } from '@/lib/geminiClient'
import { toResumeDraftContent } from '@/lib/resumeDraft/serialize'
import type { ResumeDraftContent } from '@/lib/resumeDraft/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const rateStore = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, max = 20): boolean {
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

export async function POST(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'AI rate limit. Try again later.' }, { status: 429 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const draftId = body.draftId as string
    const action = body.action as string

    if (!draftId || !mongoose.Types.ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: 'Invalid draft id' }, { status: 400 })
    }

    await dbConnect()
    const doc = await ResumeDraft.findOne({ _id: draftId, userEmail }).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const draft = toResumeDraftContent(doc as Record<string, unknown>)
    const ctx = JSON.stringify(draft).slice(0, 14000)

    if (action === 'rewriteBullet') {
      const bulletText = String(body.bulletText || '')
      const mode = String(body.mode || 'stronger') // stronger | concise | ats
      const prompt = `Rewrite this resume bullet for a software/engineering resume. Mode: ${mode}.
Rules: specific metrics when possible, strong verbs, no buzzword stuffing, ATS-friendly plain text.
Return ONLY JSON: { "text": "..." }

Bullet:
${bulletText}`
      const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
      const out = extractJsonObject(raw) as { text?: string }
      return NextResponse.json({ text: String(out.text || bulletText) })
    }

    if (action === 'improveSkills') {
      const prompt = `Improve this skills section: merge duplicates, sharpen wording, keep ATS-relevant terms.
Return ONLY JSON: { "skillsGroups": [ { "name": "...", "items": ["..."] } ] }

Current:
${ctx}`
      const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
      const out = extractJsonObject(raw) as { skillsGroups?: { name: string; items: string[] }[] }
      return NextResponse.json({ skillsGroups: out.skillsGroups || draft.skillsGroups })
    }

    if (action === 'improveSection') {
      const section = String(body.section || 'summary')
      const prompt = `Improve the "${section}" part of this resume data. Return ONLY JSON with the same structure fields needed to replace that section only.
For "summary" return { "summary": "..." }.
For "experience" return { "experience": [...] } full array with same shape as input (ids preserved).
For "projects" return { "projects": [...] }.

Data:
${ctx}`
      const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
      const out = extractJsonObject(raw) as Record<string, unknown>
      return NextResponse.json(out)
    }

    if (action === 'generateSummary') {
      const targetRole = String(body.targetRole || 'Software Engineer')
      const prompt = `Write a tight professional summary (2-3 sentences) for target role: ${targetRole}.
Use the resume JSON below. No clichés. Return ONLY JSON: { "summary": "..." }

${ctx}`
      const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
      const out = extractJsonObject(raw) as { summary?: string }
      return NextResponse.json({ summary: String(out.summary || '') })
    }

    if (action === 'tailorForRole') {
      const targetRole = String(body.targetRole || '')
      const jobDescription = String(body.jobDescription || '')
      if (!targetRole) {
        return NextResponse.json({ error: 'targetRole required' }, { status: 400 })
      }
      const prompt = `Tailor this resume for "${targetRole}".
Job description (optional): ${jobDescription.slice(0, 4000)}

Return ONLY valid JSON matching this resume builder schema (preserve ids on experience/projects/bullets where present):
${ctx}

Adjust: emphasize relevant skills, rewrite bullets for relevance, set bullet priority high/medium/low for one-page cuts, keep truthfulness — do not invent employers or degrees.
Return the FULL updated resume object with keys:
templateType, fullName, location, phone, email, linkedin, github, leetcode, portfolio, summary, skillsGroups, experience, projects, certifications, education, additionalLinks, layoutOptions (keep existing layoutOptions unless you must toggle summary).`
      const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
      const out = extractJsonObject(raw) as ResumeDraftContent
      return NextResponse.json({ draft: out })
    }

    if (action === 'optimizeOnePage') {
      const prompt = `Compress this resume to ONE page worth of content while preserving impact and ATS keywords.
Rules: drop low-value bullets, shorten wording, merge redundant lines, keep quantified wins, set priorities on bullets, prefer compact skills.
Return ONLY valid JSON full resume object with same schema as input (keep ids).

${ctx}`
      const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
      const out = extractJsonObject(raw) as ResumeDraftContent
      const mergedLayout: ResumeDraftContent['layoutOptions'] = {
        ...draft.layoutOptions,
        ...out.layoutOptions,
        onePageMode: true,
        spacingDensity: 'compact',
        fontScale: Math.min(
          typeof out.layoutOptions?.fontScale === 'number' ? out.layoutOptions.fontScale : 1,
          0.92
        ),
      }
      const full: ResumeDraftContent = {
        ...draft,
        ...out,
        layoutOptions: mergedLayout,
      }
      return NextResponse.json({ draft: full })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
