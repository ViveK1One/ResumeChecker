import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Resume from '@/models/Resume'

export const dynamic = 'force-dynamic'

const ResumeModel = Resume

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = request.nextUrl
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, all
    const limit = parseInt(searchParams.get('limit') || '10')

    // Calculate date range
    let dateFilter = {}
    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      dateFilter = { uploadDate: { $gte: startDate } }
    }

    // Get analytics data
    const [
      totalUploads,
      averageScore,
      recentUploads,
      scoreDistribution,
      topKeywords,
      fileTypeStats
    ] = await Promise.all([
      // Total uploads
      ResumeModel.countDocuments(dateFilter),
      
      // Average score
      ResumeModel.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avgScore: { $avg: '$analysisResult.score' } } }
      ]),
      
      // Recent uploads
      Resume.find(dateFilter)
        .sort({ uploadDate: -1 })
        .limit(limit)
        .select('id originalName uploadDate analysisResult.score'),
      
      // Score distribution
      Resume.aggregate([
        { $match: dateFilter },
        {
          $bucket: {
            groupBy: '$analysisResult.score',
            boundaries: [0, 50, 60, 70, 80, 90, 100],
            default: 'Other',
            output: { count: { $sum: 1 } }
          }
        }
      ]),
      
      // Top keywords found
      Resume.aggregate([
        { $match: dateFilter },
        { $unwind: '$analysisResult.keywords.found' },
        { $group: { _id: '$analysisResult.keywords.found', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // File type statistics
      Resume.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$fileType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ])

    const analytics = {
      totalUploads,
      averageScore: averageScore[0]?.avgScore || 0,
      recentUploads,
      scoreDistribution,
      topKeywords,
      fileTypeStats,
      period
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
