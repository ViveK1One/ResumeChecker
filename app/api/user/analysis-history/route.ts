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
    const docs = await Resume.find({ userEmail })
      .sort({ uploadDate: -1 })
      .limit(50)
      .select('id uploadDate originalName analysisResult.score analysisResult.atsScore')
      .lean()

    const history = docs.map((d: Record<string, unknown>) => ({
      id: d.id,
      uploadDate: d.uploadDate,
      originalName: d.originalName,
      score: (d.analysisResult as Record<string, unknown>)?.score ?? 0,
      atsScore: (d.analysisResult as Record<string, unknown>)?.atsScore as Record<string, number> | undefined,
    }))
    return NextResponse.json({ history })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
