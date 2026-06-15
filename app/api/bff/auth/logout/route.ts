import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, membersPath } from '@/lib/corvex/client'
import { MEMBER_TOKEN_COOKIE, clearMemberTokenCookie } from '@/lib/corvex/cookies'

/**
 * POST /api/bff/auth/logout
 *
 * Invalidates the member session on Corvex and clears the first-party cookie.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(MEMBER_TOKEN_COOKIE)?.value

  if (token) {
    try {
      await corvexFetch(membersPath('/session'), { method: 'DELETE', memberToken: token })
    } catch {
      // Already gone — proceed to clear the cookie regardless.
    }
  }

  const response = NextResponse.json({ ok: true })
  clearMemberTokenCookie(response)
  return response
}
