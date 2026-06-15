import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import type { CmsItemResponse } from '@/lib/types/cms'

/**
 * GET /api/bff/collections/[slug]/items/[itemSlug]
 *
 * Public — proxies to Corvex's CMS single-item endpoint.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; itemSlug: string }> }
) {
  const { slug, itemSlug } = await params

  try {
    const data = await corvexFetch<CmsItemResponse>(storePath(`/collections/${slug}/items/${itemSlug}`))
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF collection item detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
