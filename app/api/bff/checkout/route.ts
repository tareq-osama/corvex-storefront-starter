import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { CheckoutRequest, CheckoutResponse } from '@/lib/types/account'

/**
 * POST /api/bff/checkout
 * Body: { shippingAddress?, shippingMethodId?, discountCodeId? }
 *
 * Creates a store order from the logged-in member's cart. Returns
 * { orderId, orderNumber, free: true } for free orders, or
 * { orderId, orderNumber, clientSecret, total, currency } when a Stripe
 * PaymentIntent is required — the browser confirms payment with
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY using Stripe.js (no Corvex origin
 * involved in that step).
 */
export async function POST(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body: CheckoutRequest = await request.json().catch(() => ({}))

  try {
    const data = await corvexFetch<CheckoutResponse>(storePath('/checkout'), {
      method: 'POST',
      memberToken,
      body,
    })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
