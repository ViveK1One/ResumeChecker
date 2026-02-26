import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User, { IUser } from '@/models/User'

const rateStore = new Map<string, { count: number; reset: number }>()

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const now = Date.now()
    const r = rateStore.get(ip)

    // 5 cover letters per hour
    if (r && now < r.reset && r.count >= 5) {
        return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 })
    }
    if (!r || now >= r.reset) rateStore.set(ip, { count: 1, reset: now + 3600000 })
    else r.count++

    // Check auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Sign in required', requiresAuth: true }, { status: 401 })
    }

    // Verify subscription tier
    try {
        await dbConnect()
        const user = await User.findOne({ email: session.user.email }).lean() as IUser | null
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const tier = (user.subscriptionTier as string) || 'free'
        if (tier === 'free') {
            return NextResponse.json(
                { error: 'Cover Letter Generator is a Pro feature. Please upgrade to access.', requiresUpgrade: true },
                { status: 403 }
            )
        }
    } catch (dbErr) {
        console.error('[generate-cover-letter] DB Error:', dbErr)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    try {
        const { resumeText, jobDescription, userName } = await request.json()

        if (!resumeText || !jobDescription) {
            return NextResponse.json({ error: 'Resume text and job description are required' }, { status: 400 })
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
        }

        const prompt = `You are an expert career coach. Write a compelling, personalized cover letter based on the resume and job description below.

Applicant name: ${userName || 'the applicant'}

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Write a professional 3-paragraph cover letter that:
1. Opens with a strong hook mentioning the specific role and company
2. Highlights 2-3 most relevant achievements from the resume that match the job requirements
3. Closes with a clear call to action

Be specific, avoid clichés, and make it sound authentic. Return only the cover letter text, no extra commentary.`

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
                }),
            }
        )

        const data = await response.json()
        const coverLetter = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!coverLetter) {
            return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
        }

        return NextResponse.json({ coverLetter })
    } catch (error) {
        console.error('[generate-cover-letter] Error:', error)
        return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
    }
}
