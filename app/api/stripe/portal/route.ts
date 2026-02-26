import { NextResponse } from 'next/server'

/** Billing portal disabled — Razorpay will be integrated after deployment. */
export async function POST() {
    return NextResponse.json(
        { error: 'Billing portal coming soon (Razorpay). Please check back later.' },
        { status: 503 }
    )
}
