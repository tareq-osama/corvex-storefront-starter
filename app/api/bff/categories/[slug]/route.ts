import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { ProductCategory, StoreProductListResponse } from '@/lib/types/store'

/**
 * GET /api/bff/categories/[slug]
 *
 * Public — proxies to Corvex's category detail endpoint (category + its products).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)

  try {
    const data = await corvexFetch<{ category: ProductCategory } & StoreProductListResponse>(
      storePath(`/categories/${slug}`),
      { searchParams }
    )
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF category detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
