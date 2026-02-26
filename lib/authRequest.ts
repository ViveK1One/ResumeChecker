import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

/**
 * Reliably extract the logged-in user's email from a Route Handler request.
 *
 * Strategy (in order):
 *  1. getToken(req) – reads the JWT directly from the NextRequest cookies.
 *  2. getServerSession(authOptions) – fallback via NextAuth internals.
 *  3. If the JWT has an id but no email (old tokens), look up the user in DB.
 */
export async function getEmailForRoute(request: NextRequest): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null

  let email: string | null = null

  // --- Attempt 1: getToken with the real NextRequest -----------------------
  try {
    const token = await getToken({ req: request, secret })
    if (token) {
      email = (token.email as string) || null

      if (!email && token.sub) {
        try {
          await dbConnect()
          const u = await User.findById(token.sub).select('email').lean()
          email = (u as { email?: string } | null)?.email ?? null
        } catch { /* db lookup failed */ }
      }

      if (!email && token.id) {
        try {
          await dbConnect()
          const u = await User.findById(token.id as string).select('email').lean()
          email = (u as { email?: string } | null)?.email ?? null
        } catch { /* db lookup failed */ }
      }
    }
  } catch { /* getToken failed */ }

  if (email) return email

  // --- Attempt 2: getServerSession ----------------------------------------
  try {
    const session = await getServerSession(authOptions)
    email = (session?.user as { email?: string } | undefined)?.email ?? null
  } catch { /* session failed */ }

  return email
}
