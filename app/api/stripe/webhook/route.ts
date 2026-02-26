import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[stripe/webhook] Signature verification failed:', msg)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    await dbConnect()

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId
                const plan = session.metadata?.plan

                if (!userId) break

                const isLifetime = plan === 'lifetime'
                const isYearly = plan === 'pro_yearly'

                const expiry = isLifetime ? null : new Date(
                    Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000
                )

                await User.updateOne(
                    { _id: userId },
                    {
                        subscriptionTier: isLifetime ? 'lifetime' : 'pro',
                        stripeSubscriptionId: session.subscription as string || undefined,
                        ...(expiry ? { subscriptionExpiry: expiry } : {}),
                    }
                )
                console.log(`[stripe/webhook] Upgraded user ${userId} to ${isLifetime ? 'lifetime' : 'pro'}`)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await User.updateOne(
                    { stripeSubscriptionId: subscription.id },
                    {
                        subscriptionTier: 'free',
                        stripeSubscriptionId: undefined,
                        subscriptionExpiry: undefined,
                    }
                )
                console.log(`[stripe/webhook] Downgraded subscription: ${subscription.id}`)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                console.warn(`[stripe/webhook] Payment failed for customer: ${invoice.customer}`)
                // Could send email notification here
                break
            }

            default:
                console.log(`[stripe/webhook] Unhandled event: ${event.type}`)
        }
    } catch (err) {
        console.error('[stripe/webhook] Handler error:', err)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
