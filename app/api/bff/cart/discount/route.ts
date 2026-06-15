import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readCartTokens, persistCartToken } from '@/lib/corvex/cart-proxy'
import type { Cart } from '@/lib/types/store'

/**
 * POST /api/bff/cart/discount
 * Body: { code: string }
 *
 * Applies a discount code to the current cart.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { memberToken, cartToken } = readCartTokens(request)

  try {
    const data = await corvexFetch<{ cart: Cart; code: string; discountAmount: number; discountCodeId: number }>(
      storePath('/cart/discount'),
      { method: 'POST', memberToken, cartToken, body }
    )

    const response = NextResponse.json(data)
    persistCartToken(response, data.cart, memberToken)
    return response
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF cart apply discount error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/bff/cart/discount
 *
 * Removes the discount code from the current cart.
 */
export async function DELETE(request: NextRequest) {
  const { memberToken, cartToken } = readCartTokens(request)

  try {
    const data = await corvexFetch<{ cart: Cart }>(storePath('/cart/discount'), {
      method: 'DELETE',
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
    console.error('BFF cart remove discount error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
