import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    
    // Fetch reviews with pagination
    const reviews = await Review.find({})
      .sort({ submittedAt: -1 }) // Most recent first
      .limit(limit)
      .skip((page - 1) * limit)
      .select('rating message candidateName submittedAt')
      .lean()
    
    // Get total count for pagination
    const totalReviews = await Review.countDocuments({})
    
    // Calculate average rating
    const averageRating = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])
    
    const stats = averageRating[0] || { averageRating: 0, totalReviews: 0 }
    
    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasMore: page * limit < totalReviews
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews
      }
    })
    
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
