import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import Resume from '@/models/Resume'

export async function GET(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await dbConnect()
    const doc = await Resume.findOne({ userEmail })
      .sort({ uploadDate: -1 })
      .lean()

    if (!doc) {
      return NextResponse.json({ analysis: null })
    }

    const d = doc as Record<string, unknown>
    const ar = (d.analysisResult as Record<string, unknown>) || {}
    const analysis = {
      ...ar,
      candidateName: (d.originalName as string) || 'Resume',
      industry: 'general',
      experienceLevel: 'mid',
      apiSource: 'saved',
      _id: d.id,
    }
    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch last analysis' }, { status: 500 })
  }
}
