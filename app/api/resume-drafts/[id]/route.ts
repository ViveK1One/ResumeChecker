import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import ResumeDraft from '@/models/ResumeDraft'
import { toResumeDraftContent } from '@/lib/resumeDraft/serialize'
import type { ResumeDraftContent } from '@/lib/resumeDraft/types'

function badId() {
  return NextResponse.json({ error: 'Invalid draft id' }, { status: 400 })
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userEmail = await getEmailForRoute(_request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) return badId()

  try {
    await dbConnect()
    const doc = await ResumeDraft.findOne({ _id: id, userEmail }).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const d = doc as Record<string, unknown>
    const content = toResumeDraftContent(d)
    return NextResponse.json({
      id: String(d._id),
      title: d.title,
      userEmail: d.userEmail,
      ...content,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) return badId()

  try {
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : undefined

    const patch: Record<string, unknown> = {}
    if (title !== undefined) patch.title = title

    const contentKeys: (keyof ResumeDraftContent)[] = [
      'templateType',
      'fullName',
      'location',
      'phone',
      'email',
      'linkedin',
      'github',
      'leetcode',
      'portfolio',
      'summary',
      'skillsGroups',
      'experience',
      'projects',
      'certifications',
      'education',
      'additionalLinks',
      'layoutOptions',
      'generatedLatex',
      'generatedHtml',
    ]

    for (const k of contentKeys) {
      if (k in body && body[k] !== undefined) {
        patch[k] = body[k]
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true })
    }

    await dbConnect()
    const updated = await ResumeDraft.findOneAndUpdate(
      { _id: id, userEmail },
      { $set: patch },
      { new: true }
    )
      .select('updatedAt')
      .lean()

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const u = updated as { updatedAt?: Date }
    return NextResponse.json({ ok: true, updatedAt: u.updatedAt })
  } catch {
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { id } = await context.params
  if (!mongoose.Types.ObjectId.isValid(id)) return badId()

  try {
    await dbConnect()
    const res = await ResumeDraft.deleteOne({ _id: id, userEmail })
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
