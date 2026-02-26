import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
        }

        await dbConnect()

        const existing = await User.findOne({ email: email.toLowerCase().trim() })
        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            subscriptionTier: 'free',
        })

        await user.save()

        return NextResponse.json(
            { message: 'Account created successfully', userId: user._id.toString() },
            { status: 201 }
        )
    } catch (error: unknown) {
        console.error('[register] Error:', error)
        return NextResponse.json(
            { error: 'Failed to create account. Please try again.' },
            { status: 500 }
        )
    }
}
