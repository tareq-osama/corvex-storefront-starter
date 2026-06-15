import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { CmsCollectionResponse } from '@/lib/types/cms'

/**
 * GET /api/bff/collections/[slug]
 *
 * Public — proxies to Corvex's CMS collection archive endpoint
 * (published items in a collection, paginated).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)

  try {
    const data = await corvexFetch<CmsCollectionResponse>(storePath(`/collections/${slug}`), { searchParams })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF collection detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
