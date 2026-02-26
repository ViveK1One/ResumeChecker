import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Profile is protected by the profile page (useSession + redirect). No middleware here
// so the session cookie is always read by the client and the page can show correctly.
export function middleware(_request: NextRequest) {
    return NextResponse.next()
}

export const config = {
    matcher: [],
}
