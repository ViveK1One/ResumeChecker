import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import ResumeDraft from '@/models/ResumeDraft'
import { toResumeDraftContent } from '@/lib/resumeDraft/serialize'
import { getPreviewContent } from '@/lib/resumeDraft/previewModel'
import { buildLatexStyleResumeHtml } from '@/lib/resumeDraft/renderLatexResumeHtml'

export const runtime = 'nodejs'
export const maxDuration = 60

function badId() {
  return NextResponse.json({ error: 'Invalid draft id' }, { status: 400 })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) return badId()

  let mode: 'full' | 'onePage' = 'full'
  try {
    const body = await request.json()
    if (body.mode === 'onePage') mode = 'onePage'
  } catch {
    /* default full */
  }

  try {
    await dbConnect()
    const doc = await ResumeDraft.findOne({ _id: id, userEmail }).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const raw = toResumeDraftContent(doc as Record<string, unknown>)
    const content = getPreviewContent(raw, mode)
    const html = buildLatexStyleResumeHtml(content)

    const puppeteer = (await import('puppeteer')).default
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load', timeout: 45_000 })
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.5in', right: '0.6in', bottom: '0.5in', left: '0.6in' },
        preferCSSPageSize: false,
      })
      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Resume.pdf"',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'PDF export failed'
    console.error('[export-pdf]', msg)
    return NextResponse.json(
      { error: 'Could not generate PDF. Ensure Puppeteer/Chromium is available on the server.' },
      { status: 500 }
    )
  }
}
