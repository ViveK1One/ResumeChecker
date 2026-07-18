import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import ResumeDraft from '@/models/ResumeDraft'
import { emptyResumeDraftContent } from '@/lib/resumeDraft/defaults'

export async function GET(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  try {
    await dbConnect()
    const drafts = await ResumeDraft.find({ userEmail })
      .select('_id title updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean()
    return NextResponse.json({
      drafts: drafts.map((d) => ({
        id: String(d._id),
        title: d.title,
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to list drafts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'My Resume'
    const duplicateFrom = typeof body.duplicateFrom === 'string' ? body.duplicateFrom : null

    await dbConnect()

    if (duplicateFrom) {
      const src = await ResumeDraft.findOne({ _id: duplicateFrom, userEmail })
      if (!src) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }
      const o = src.toObject()
      delete o._id
      o.userEmail = userEmail
      o.title = `${String(o.title || 'Resume')} (copy)`
      const doc = await ResumeDraft.create(o)
      return NextResponse.json({ id: String(doc._id) })
    }

    const initial = emptyResumeDraftContent()
    initial.email = userEmail
    const doc = await ResumeDraft.create({
      userEmail,
      title,
      ...initial,
    })
    return NextResponse.json({ id: String(doc._id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create draft'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
