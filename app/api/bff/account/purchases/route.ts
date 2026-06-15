import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { Purchase } from '@/lib/types/account'

/**
 * GET /api/bff/account/purchases
 *
 * Lists the logged-in member's active digital purchases with download files.
 */
export async function GET(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await corvexFetch<{ purchases: Purchase[] }>(storePath('/account/purchases'), { memberToken })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account purchases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
