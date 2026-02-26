import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
})

export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await dbConnect()
        const user = await User.findOne({ email: session.user.email })

        if (!user?.stripeCustomerId) {
            return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${baseUrl}/profile`,
        })

        return NextResponse.json({ url: portalSession.url })
    } catch (error: unknown) {
        console.error('[stripe/portal] Error:', error)
        return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
    }
}
