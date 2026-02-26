import { NextResponse } from 'next/server'

/** Stripe webhook disabled — Razorpay will be integrated after deployment. */
export async function POST() {
    return NextResponse.json({ received: true })
}
