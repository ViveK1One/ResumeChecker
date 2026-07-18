import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import ResumeDraft from '@/models/ResumeDraft'
import { tryGeminiModels, extractJsonObject } from '@/lib/geminiClient'
import { emptyResumeDraftContent, defaultSkillGroups } from '@/lib/resumeDraft/defaults'
import { v4 as uuidv4 } from 'uuid'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

function newBullet(text: string) {
  return { id: uuidv4(), text, priority: 'medium' as const, selected: true }
}

export async function POST(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const titleRaw = formData.get('title') as string | null
    const title = titleRaw?.trim() || 'Imported Resume'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Upload a PDF or DOCX file.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let resumeText = ''
    if (file.type === 'application/pdf') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      resumeText = pdfData.text
    } else {
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
    }

    if (!resumeText || resumeText.trim().length < 40) {
      return NextResponse.json(
        { error: 'Could not extract enough text from this file. Try another PDF or paste content after creating a blank draft.' },
        { status: 400 }
      )
    }

    const prompt = `You are an expert resume parser. Map the following resume text into a structured JSON object for a resume builder.

RULES:
- Return ONLY valid JSON. No markdown fences.
- Infer missing fields; use empty string or empty arrays where unknown.
- Split skills into groups: Languages, Frameworks & Libraries, DevOps & Cloud, Core CS, Other — put items in the best group.
- Each experience entry needs bullets as an array of strings (impact lines).
- Each project: name, optional stack, optional link, bullets.
- Dates as short strings e.g. "Jan 2022" or "2020".
- Certifications as array of strings.
- Education: degree, institution, location, dates.

JSON shape:
{
  "fullName": "",
  "location": "",
  "phone": "",
  "email": "",
  "linkedin": "",
  "github": "",
  "leetcode": "",
  "portfolio": "",
  "summary": "",
  "skillsGroups": [ { "name": "Languages", "items": ["Python"] } ],
  "experience": [ { "company": "", "role": "", "location": "", "startDate": "", "endDate": "", "bullets": ["..."] } ],
  "projects": [ { "name": "", "stack": "", "link": "", "bullets": [""] } ],
  "certifications": [""],
  "education": [ { "degree": "", "institution": "", "location": "", "startDate": "", "endDate": "" } ],
  "additionalLinks": [ { "label": "", "url": "" } ]
}

RESUME TEXT:
${resumeText.slice(0, 12000)}`

    const raw = await tryGeminiModels(prompt, GEMINI_API_KEY)
    const parsed = extractJsonObject(raw) as Record<string, unknown>

    const base = emptyResumeDraftContent()
    base.fullName = String(parsed.fullName ?? '')
    base.location = String(parsed.location ?? '')
    base.phone = String(parsed.phone ?? '')
    base.email = String(parsed.email ?? '') || userEmail
    base.linkedin = String(parsed.linkedin ?? '')
    base.github = String(parsed.github ?? '')
    base.leetcode = String(parsed.leetcode ?? '')
    base.portfolio = String(parsed.portfolio ?? '')
    base.summary = String(parsed.summary ?? '')

    if (Array.isArray(parsed.skillsGroups) && parsed.skillsGroups.length) {
      base.skillsGroups = (parsed.skillsGroups as { name?: string; items?: string[] }[]).map((g) => ({
        id: uuidv4(),
        name: String(g.name || 'Skills'),
        items: Array.isArray(g.items) ? g.items.map((x) => String(x)).filter(Boolean) : [],
      }))
    } else {
      base.skillsGroups = defaultSkillGroups()
    }

    base.experience = Array.isArray(parsed.experience)
      ? (parsed.experience as Record<string, unknown>[]).map((e) => ({
          id: uuidv4(),
          company: String(e.company ?? ''),
          role: String(e.role ?? ''),
          location: String(e.location ?? ''),
          startDate: String(e.startDate ?? ''),
          endDate: String(e.endDate ?? ''),
          bullets: Array.isArray(e.bullets)
            ? (e.bullets as string[]).map((t) => newBullet(String(t))).filter((b) => b.text.trim())
            : [],
        }))
      : []

    base.projects = Array.isArray(parsed.projects)
      ? (parsed.projects as Record<string, unknown>[]).map((p) => ({
          id: uuidv4(),
          name: String(p.name ?? ''),
          stack: String(p.stack ?? ''),
          link: String(p.link ?? ''),
          bullets: Array.isArray(p.bullets)
            ? (p.bullets as string[]).map((t) => newBullet(String(t))).filter((b) => b.text.trim())
            : [],
        }))
      : []

    base.certifications = Array.isArray(parsed.certifications)
      ? (parsed.certifications as string[]).map((c) => String(c)).filter(Boolean)
      : []

    base.education = Array.isArray(parsed.education)
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

    for (const exp of base.experience) {
      if (!exp.bullets.length) exp.bullets = [newBullet('')]
    }
    for (const pr of base.projects) {
      if (!pr.bullets.length) pr.bullets = [newBullet('')]
    }

    await dbConnect()
    const doc = await ResumeDraft.create({
      userEmail,
      title,
      ...base,
    })

    return NextResponse.json({ id: String(doc._id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Import failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
