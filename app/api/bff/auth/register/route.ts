import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, membersPath, CorvexApiError } from '@/lib/corvex/client'
import { setMemberTokenCookie } from '@/lib/corvex/cookies'
import type { AuthResponse } from '@/lib/types/account'

/**
 * POST /api/bff/auth/register
 * Body: { email, name, password }
 *
 * Proxies to Corvex's public member registration endpoint and stores the
 * returned session token in a first-party httpOnly cookie. The browser
 * never sees the raw session token.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const data = await corvexFetch<AuthResponse>(membersPath('/register'), {
      method: 'POST',
      body,
    })

    const response = NextResponse.json({ member: data.member }, { status: 201 })
    setMemberTokenCookie(response, data.session_token, data.expires_at)
    return response
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
