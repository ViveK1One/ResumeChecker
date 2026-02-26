import { NextRequest, NextResponse } from 'next/server'
import { getEmailForRoute } from '@/lib/authRequest'

/** GET /api/user/me - returns current user email if logged in. Use to verify auth. */
export async function GET(request: NextRequest) {
  const email = await getEmailForRoute(request)
  if (!email) {
    return NextResponse.json({ ok: false, message: 'Not logged in' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, email })
}
