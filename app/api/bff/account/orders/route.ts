import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { StoreOrder } from '@/lib/types/account'

/**
 * GET /api/bff/account/orders?page=1&limit=20
 *
 * Lists the logged-in member's orders.
 */
export async function GET(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams)

  try {
    const data = await corvexFetch<{ orders: StoreOrder[]; total: number; page: number; limit: number }>(
      storePath('/account/orders'),
      { memberToken, searchParams }
    )
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
