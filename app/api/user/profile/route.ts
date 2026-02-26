import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const FREE_ANALYSIS_LIMIT = 3

export async function GET(request: NextRequest) {
  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await dbConnect()
    const user = await User.findOne({ email: userEmail }).lean()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const u = user as Record<string, unknown>
    const tier = (u.subscriptionTier as string) || 'free'
    const resumeCount = (u.resumeCount as number) || 0
    const isPro = tier === 'pro' || tier === 'lifetime'

    return NextResponse.json({
      name: u.name,
      email: u.email,
      subscriptionTier: tier,
      resumeCount,
      freeLimit: FREE_ANALYSIS_LIMIT,
      remaining: isPro ? null : Math.max(0, FREE_ANALYSIS_LIMIT - resumeCount),
      createdAt: u.createdAt,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
