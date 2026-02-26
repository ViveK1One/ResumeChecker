import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import Resume from '@/models/Resume'
import User from '@/models/User'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/user/save-analysis
 * Attach a client-side analysis (e.g. from localStorage) to the logged-in user's account.
 * Only creates a record if the user has no analyses yet (one-time backfill so profile shows the result).
 */
export async function POST(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const analysis = body?.analysis ?? body
    if (!analysis || typeof analysis.score !== 'number') {
      return NextResponse.json({ error: 'Invalid analysis data' }, { status: 400 })
    }

    await dbConnect()

    const existingCount = await Resume.countDocuments({ userEmail })
    if (existingCount > 0) {
      return NextResponse.json({ saved: false, reason: 'already_has_history' })
    }

    const fileId = uuidv4()
    const atsScore = analysis.atsScore ?? { keywords: 50, format: 50, overall: 50 }
    const contentScore = analysis.contentScore ?? { grammar: 50, clarity: 50, actionVerbs: 50 }
    const suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 10) : []
    const keywords = analysis.keywords ?? { found: [], missing: [] }

    const resumeData = new Resume({
      id: fileId,
      fileName: `${fileId}.pdf`,
      originalName: analysis.candidateName ? `${String(analysis.candidateName).replace(/[^a-zA-Z0-9._-]/g, '_')}_resume` : 'Resume',
      fileSize: 0,
      fileType: 'application/pdf',
      uploadDate: new Date(),
      userEmail,
      analysisResult: {
        score: analysis.score,
        atsScore: {
          keywords: Number(atsScore.keywords) || 50,
          format: Number(atsScore.format) || 50,
          overall: Number(atsScore.overall) || 50,
        },
        contentScore: {
          grammar: Number(contentScore.grammar) || 50,
          clarity: Number(contentScore.clarity) || 50,
          actionVerbs: Number(contentScore.actionVerbs) || 50,
        },
        suggestions: suggestions.map((s: { type?: string; title?: string; description?: string; example?: string }) => ({
          type: (s.type === 'critical' || s.type === 'important' || s.type === 'minor') ? s.type : 'minor',
          title: s.title ?? '',
          description: s.description ?? '',
          example: s.example,
        })),
        keywords: {
          found: Array.isArray(keywords.found) ? keywords.found : [],
          missing: Array.isArray(keywords.missing) ? keywords.missing : [],
        },
      },
      resumeText: ' ', // required by schema; actual text not stored when saving from client
    })
    await resumeData.save()

    await User.updateOne(
      { email: userEmail },
      { $inc: { resumeCount: 1 } }
    )

    return NextResponse.json({ saved: true, id: fileId })
  } catch {
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
  }
}
