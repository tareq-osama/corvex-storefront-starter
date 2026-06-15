import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { MyDownloadsResponse } from '@/lib/types/account'

/**
 * GET /api/bff/products/[handle]/my-downloads
 *
 * Returns download files for the current member if they have an active
 * purchase of this product. Returns { purchased: false } if not purchased
 * or not authenticated.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ purchased: false })
  }

  try {
    const data = await corvexFetch<MyDownloadsResponse>(storePath(`/products/${handle}/my-downloads`), { memberToken })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF my-downloads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
