import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { StoreSearchResponse } from '@/lib/types/store'

/**
 * GET /api/bff/search?q=term&limit=20
 *
 * Public — proxies to Corvex's product search endpoint.
 */
export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)

  try {
    const data = await corvexFetch<StoreSearchResponse>(storePath('/search'), { searchParams })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
