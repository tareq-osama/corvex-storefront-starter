import { NextRequest, NextResponse } from 'next/server'
import { setCartTokenCookie, MEMBER_TOKEN_COOKIE, CART_TOKEN_COOKIE } from '@/lib/corvex/cookies'
import type { Cart } from '@/lib/types/store'

/** Read the member + cart tokens from this app's first-party cookies. */
export function readCartTokens(request: NextRequest) {
  return {
    memberToken: request.cookies.get(MEMBER_TOKEN_COOKIE)?.value ?? null,
    cartToken: request.cookies.get(CART_TOKEN_COOKIE)?.value ?? null,
  }
}

/**
 * Persist the cart's session_token back into the first-party cart cookie for
 * anonymous (non-member) carts so subsequent requests reuse the same cart.
 */
export function persistCartToken(response: NextResponse, cart: Cart, memberToken: string | null) {
  if (!memberToken && cart.session_token) {
    setCartTokenCookie(response, cart.session_token)
  }
}
