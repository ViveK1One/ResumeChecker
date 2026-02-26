import { NextResponse } from 'next/server'

/** Checkout disabled — Razorpay will be integrated after deployment. */
export async function POST() {
    return NextResponse.json(
        { error: 'Payment integration coming soon (Razorpay). Please check back later.' },
        { status: 503 }
    )
}
