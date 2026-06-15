import { NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { ShippingMethodsResponse } from '@/lib/types/account'

/**
 * GET /api/bff/checkout/shipping-methods
 *
 * Public — proxies to Corvex's active shipping methods list. No member or
 * cart token involved.
 */
export async function GET() {
  try {
    const data = await corvexFetch<ShippingMethodsResponse>(storePath('/checkout/shipping-methods'))
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF shipping methods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
