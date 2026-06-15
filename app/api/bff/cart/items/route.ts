import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readCartTokens, persistCartToken } from '@/lib/corvex/cart-proxy'
import type { Cart } from '@/lib/types/store'

/**
 * POST /api/bff/cart/items
 * Body: { productId: number, variantId?: number | null, quantity?: number }
 *
 * Adds an item to the current cart.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { memberToken, cartToken } = readCartTokens(request)

  try {
    const data = await corvexFetch<{ cart: Cart }>(storePath('/cart/items'), {
      method: 'POST',
      memberToken,
      cartToken,
      body,
    })

    const response = NextResponse.json(data)
    persistCartToken(response, data.cart, memberToken)
    return response
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF cart add item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
