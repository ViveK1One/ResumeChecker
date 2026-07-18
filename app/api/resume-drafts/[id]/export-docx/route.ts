import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import ResumeDraft from '@/models/ResumeDraft'
import { toResumeDraftContent } from '@/lib/resumeDraft/serialize'
import { buildResumeDocxBuffer } from '@/lib/resumeDraft/docxExport'

function sanitizeFilePart(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').slice(0, 60) || 'Resume'
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let mode: 'full' | 'onePage' = 'full'
  try {
    const body = await request.json().catch(() => ({}))
    if (body.mode === 'onePage') mode = 'onePage'
  } catch { /* default */ }

  try {
    await dbConnect()
    const doc = await ResumeDraft.findOne({ _id: id, userEmail }).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const content = toResumeDraftContent(doc as Record<string, unknown>)
    const buf = await buildResumeDocxBuffer(content, mode)

    const namePart = sanitizeFilePart(content.fullName.trim() || 'Resume')
    const suffix = mode === 'onePage' ? 'Resume_1Page' : 'Resume'
    const filename = `${namePart}_${suffix}.docx`

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Export failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
