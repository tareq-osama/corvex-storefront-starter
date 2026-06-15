import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readCartTokens, persistCartToken } from '@/lib/corvex/cart-proxy'
import type { Cart } from '@/lib/types/store'

/**
 * PATCH /api/bff/cart/items/[itemId]
 * Body: { quantity: number }
 *
 * Updates the quantity of a cart item (removes it if quantity <= 0).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { memberToken, cartToken } = readCartTokens(request)

  try {
    const data = await corvexFetch<{ cart: Cart }>(storePath(`/cart/items/${itemId}`), {
      method: 'PATCH',
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
    console.error('BFF cart update item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/bff/cart/items/[itemId]
 *
 * Removes an item from the cart.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const { memberToken, cartToken } = readCartTokens(request)

  try {
    const data = await corvexFetch<{ cart: Cart }>(storePath(`/cart/items/${itemId}`), {
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
    console.error('BFF cart remove item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
