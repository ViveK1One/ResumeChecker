import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
})

const PRICE_IDS: Record<string, string> = {
    pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    lifetime: process.env.STRIPE_LIFETIME_PRICE_ID || '',
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Please sign in to upgrade' }, { status: 401 })
        }

        const { plan } = await request.json()
        const priceId = PRICE_IDS[plan]

        if (!priceId) {
            return NextResponse.json(
                { error: `Invalid plan: ${plan}. Valid plans: pro_monthly, pro_yearly, lifetime` },
                { status: 400 }
            )
        }

        await dbConnect()
        const user = await User.findOne({ email: session.user.email })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            })
            customerId = customer.id
            await User.updateOne({ _id: user._id }, { stripeCustomerId: customerId })
        }

        const isLifetime = plan === 'lifetime'
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: isLifetime ? 'payment' : 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/profile?success=true&plan=${plan}`,
            cancel_url: `${baseUrl}/pricing?canceled=true`,
            metadata: {
                userId: user._id.toString(),
                plan,
            },
            allow_promotion_codes: true,
        })

        return NextResponse.json({ url: checkoutSession.url })
    } catch (error: unknown) {
        console.error('[stripe/checkout] Error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session. Please try again.' },
            { status: 500 }
        )
    }
}
