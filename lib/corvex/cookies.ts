import { NextRequest, NextResponse } from 'next/server'

/** First-party httpOnly cookie holding the Corvex member_session token. */
export const MEMBER_TOKEN_COOKIE = 'corvex_member_token'

/** First-party httpOnly cookie holding the anonymous cart session token. */
export const CART_TOKEN_COOKIE = 'corvex_cart_token'

const THIRTY_DAYS = 60 * 60 * 24 * 30

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export function setMemberTokenCookie(response: NextResponse, token: string, expiresAt?: string) {
  const maxAge = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : THIRTY_DAYS
  response.cookies.set(MEMBER_TOKEN_COOKIE, token, { ...baseCookieOptions, maxAge })
}

export function clearMemberTokenCookie(response: NextResponse) {
  response.cookies.set(MEMBER_TOKEN_COOKIE, '', { ...baseCookieOptions, maxAge: 0 })
}

export function setCartTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(CART_TOKEN_COOKIE, token, { ...baseCookieOptions, maxAge: THIRTY_DAYS })
}

export function clearCartTokenCookie(response: NextResponse) {
  response.cookies.set(CART_TOKEN_COOKIE, '', { ...baseCookieOptions, maxAge: 0 })
}

/** Read the member session token from the first-party cookie, or null if absent. */
export function readMemberToken(request: NextRequest): string | null {
  return request.cookies.get(MEMBER_TOKEN_COOKIE)?.value ?? null
}
