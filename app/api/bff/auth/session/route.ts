import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, membersPath, CorvexApiError } from '@/lib/corvex/client'
import { MEMBER_TOKEN_COOKIE, clearMemberTokenCookie } from '@/lib/corvex/cookies'
import type { Member } from '@/lib/types/account'

/**
 * GET /api/bff/auth/session
 *
 * Validates the member session token stored in the first-party cookie.
 * Response: { member: null } if not logged in / session expired,
 * otherwise { member }.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(MEMBER_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ member: null })
  }

  try {
    const data = await corvexFetch<{ valid: boolean; member?: Member }>(membersPath('/session'), {
      memberToken: token,
    })

    if (!data.valid || !data.member) {
      const response = NextResponse.json({ member: null })
      clearMemberTokenCookie(response)
      return response
    }

    return NextResponse.json({ member: data.member })
  } catch (error) {
    if (error instanceof CorvexApiError && error.status === 401) {
      const response = NextResponse.json({ member: null })
      clearMemberTokenCookie(response)
      return response
    }
    console.error('BFF session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
