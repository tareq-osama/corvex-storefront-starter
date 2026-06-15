import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, membersPath, CorvexApiError } from '@/lib/corvex/client'
import {
  setMemberTokenCookie,
  clearCartTokenCookie,
  CART_TOKEN_COOKIE,
} from '@/lib/corvex/cookies'
import type { AuthResponse } from '@/lib/types/account'
import type { Cart } from '@/lib/types/store'

/**
 * POST /api/bff/auth/login
 * Body: { email, password }
 *
 * Proxies to Corvex's public member login endpoint, stores the returned
 * session token in a first-party httpOnly cookie, and — if an anonymous
 * cart exists for this browser — merges it into the member's cart.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const data = await corvexFetch<AuthResponse>(membersPath('/login'), {
      method: 'POST',
      body,
    })

    const response = NextResponse.json({ member: data.member })
    setMemberTokenCookie(response, data.session_token, data.expires_at)

    const cartToken = request.cookies.get(CART_TOKEN_COOKIE)?.value
    if (cartToken) {
      try {
        const merged = await corvexFetch<{ merged: boolean; cart?: Cart }>(storePath('/cart/merge'), {
          method: 'POST',
          memberToken: data.session_token,
          cartToken,
        })
        if (merged.merged) {
          clearCartTokenCookie(response)
        }
      } catch {
        // Non-fatal: login succeeds even if cart merge fails.
      }
    }

    return response
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
