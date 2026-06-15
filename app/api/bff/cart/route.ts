import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readCartTokens, persistCartToken } from '@/lib/corvex/cart-proxy'
import type { Cart } from '@/lib/types/store'

/**
 * GET /api/bff/cart
 *
 * Returns the current cart for this browser, creating one if needed.
 * Member identity and anonymous cart token are read from first-party
 * httpOnly cookies and forwarded to Corvex as Bearer / X-Cart-Session.
 */
export async function GET(request: NextRequest) {
  const { memberToken, cartToken } = readCartTokens(request)

  try {
    const data = await corvexFetch<{ cart: Cart }>(storePath('/cart'), {
      memberToken,
      cartToken,
    })

    const response = NextResponse.json(data)
    persistCartToken(response, data.cart, memberToken)
    return response
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF cart get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
