import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { StoreProductListResponse } from '@/lib/types/store'

/**
 * GET /api/bff/products
 *
 * Public — proxies to Corvex's product listing endpoint with the same
 * query params (category, search, sort, page, limit, featured, type).
 */
export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)

  try {
    const data = await corvexFetch<StoreProductListResponse>(storePath('/products'), { searchParams })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF products list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
