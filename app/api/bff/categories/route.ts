import { NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { StoreCategoryListResponse } from '@/lib/types/store'

/**
 * GET /api/bff/categories
 *
 * Public — proxies to Corvex's category listing endpoint.
 */
export async function GET() {
  try {
    const data = await corvexFetch<StoreCategoryListResponse>(storePath('/categories'))
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF categories list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
