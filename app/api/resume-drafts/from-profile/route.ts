import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Resume from '@/models/Resume'
import ResumeDraft from '@/models/ResumeDraft'
import { tryGeminiModels, extractJsonObject } from '@/lib/geminiClient'
import { emptyResumeDraftContent, defaultSkillGroups, newExperienceEntry, newProjectEntry } from '@/lib/resumeDraft/defaults'
import { v4 as uuidv4 } from 'uuid'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Profile Resume'

    await dbConnect()
    const user = await User.findOne({ email: userEmail }).lean()
    const last = await Resume.findOne({ userEmail }).sort({ uploadDate: -1 }).lean()

    const u = user as Record<string, unknown> | null
    const name = String(u?.name || '')
    const r = last as Record<string, unknown> | null
    const ar = (r?.analysisResult as Record<string, unknown>) || {}
    const keywords = (ar.keywords as { found?: string[]; missing?: string[] }) || {}
    const found = Array.isArray(keywords.found) ? keywords.found : []
    const missing = Array.isArray(keywords.missing) ? keywords.missing : []
    const suggestions = Array.isArray(ar.suggestions)
      ? (ar.suggestions as { title?: string; description?: string }[])
          .slice(0, 8)
          .map((s) => `${s.title}: ${s.description}`)
      : []

    const prompt = `You are an expert resume writer. The user does NOT have full resume text stored in our system — only profile and ATS analysis metadata. Build a STARTER structured resume JSON they can edit.

Use realistic placeholder content only where necessary; prefer weaving in the provided keywords and suggestions as guidance for skills and example bullets. Keep tone concise and technical. No fluff.

Return ONLY valid JSON with this shape:
{
  "fullName": ${JSON.stringify(name)},
  "location": "",
  "phone": "",
  "email": ${JSON.stringify(userEmail)},
  "linkedin": "",
  "github": "",
  "leetcode": "",
  "portfolio": "",
  "summary": "2-3 sentences, tailored for software/engineering roles",
  "skillsGroups": [ { "name": "Languages", "items": ["..."] } ],
  "experience": [ { "company": "", "role": "", "location": "", "startDate": "", "endDate": "", "bullets": ["quantified bullet", "..."] } ],
  "projects": [ { "name": "", "stack": "", "link": "", "bullets": ["..."] } ],
  "certifications": [],
  "education": [ { "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "" } ],
  "additionalLinks": []
}

CONTEXT:
- Keywords found in past analyses: ${found.slice(0, 40).join(', ') || 'n/a'}
- Keywords to consider adding: ${missing.slice(0, 30).join(', ') || 'n/a'}
- ATS suggestions snippets: ${suggestions.join(' | ') || 'n/a'}

Create 1-2 experience blocks and 1-2 projects with strong bullets (assume mid-level engineer unless keywords suggest otherwise).`

    const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
    const parsed = extractJsonObject(raw) as Record<string, unknown>

    const base = emptyResumeDraftContent()
    base.fullName = String(parsed.fullName || name || '')
    base.location = String(parsed.location ?? '')
    base.phone = String(parsed.phone ?? '')
    base.email = String(parsed.email || userEmail)
    base.linkedin = String(parsed.linkedin ?? '')
    base.github = String(parsed.github ?? '')
    base.leetcode = String(parsed.leetcode ?? '')
    base.portfolio = String(parsed.portfolio ?? '')
    base.summary = String(parsed.summary ?? '')

    if (Array.isArray(parsed.skillsGroups) && parsed.skillsGroups.length) {
      base.skillsGroups = (parsed.skillsGroups as { name?: string; items?: string[] }[]).map((g) => ({
        id: uuidv4(),
        name: String(g.name || 'Skills'),
        items: Array.isArray(g.items) ? g.items.map((x) => String(x)) : [],
      }))
    } else {
      base.skillsGroups = defaultSkillGroups()
      if (found.length) {
        const g = base.skillsGroups[0]
        g.items = Array.from(new Set([...g.items, ...found.map((x) => String(x)).slice(0, 20)]))
      }
    }

    const bullet = (t: string) => ({ id: uuidv4(), text: t, priority: 'high' as const, selected: true })

    base.experience = Array.isArray(parsed.experience) && parsed.experience.length
      ? (parsed.experience as Record<string, unknown>[]).map((e) => ({
          id: uuidv4(),
          company: String(e.company ?? ''),
          role: String(e.role ?? ''),
          location: String(e.location ?? ''),
          startDate: String(e.startDate ?? ''),
          endDate: String(e.endDate ?? ''),
          bullets: Array.isArray(e.bullets)
            ? (e.bullets as string[]).map((t) => bullet(String(t))).filter((b) => b.text.trim())
            : [],
        }))
      : [newExperienceEntry()]

    base.projects = Array.isArray(parsed.projects) && parsed.projects.length
      ? (parsed.projects as Record<string, unknown>[]).map((p) => ({
          id: uuidv4(),
          name: String(p.name ?? ''),
          stack: String(p.stack ?? ''),
          link: String(p.link ?? ''),
          bullets: Array.isArray(p.bullets)
            ? (p.bullets as string[]).map((t) => bullet(String(t))).filter((b) => b.text.trim())
            : [],
        }))
      : [newProjectEntry()]

    base.certifications = Array.isArray(parsed.certifications)
      ? (parsed.certifications as string[]).map((c) => String(c)).filter(Boolean)
      : []

    base.education = Array.isArray(parsed.education) && parsed.education.length
      ? (parsed.education as Record<string, unknown>[]).map((ed) => ({
          id: uuidv4(),
          degree: String(ed.degree ?? ''),
          institution: String(ed.institution ?? ''),
          location: String(ed.location ?? ''),
          startDate: String(ed.startDate ?? ''),
          endDate: String(ed.endDate ?? ''),
        }))
      : []

    base.additionalLinks = Array.isArray(parsed.additionalLinks)
      ? (parsed.additionalLinks as { label?: string; url?: string }[])
          .filter((l) => l && (l.label || l.url))
          .map((l) => ({
            id: uuidv4(),
            label: String(l.label ?? ''),
            url: String(l.url ?? ''),
          }))
      : []

    const doc = await ResumeDraft.create({
      userEmail,
      title,
      ...base,
    })

    return NextResponse.json({ id: String(doc._id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
