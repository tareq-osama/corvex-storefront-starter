import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { StoreProductDetailResponse } from '@/lib/types/store'

/**
 * GET /api/bff/products/[handle]
 *
 * Public — proxies to Corvex's product detail endpoint.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params

  try {
    const data = await corvexFetch<StoreProductDetailResponse>(storePath(`/products/${handle}`))
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF product detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
