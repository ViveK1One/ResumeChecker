import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { rating, message, candidateName, analysisId } = await request.json()
    
    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating is required and must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    // Create review document
    const review = new Review({
      rating,
      message: message || '',
      candidateName: candidateName || 'Anonymous',
      analysisId: analysisId || null,
      submittedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })
    
    await review.save()
    
    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      reviewId: review._id
    })
    
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}



