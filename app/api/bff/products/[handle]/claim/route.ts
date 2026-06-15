import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { ClaimResponse } from '@/lib/types/account'

/**
 * POST /api/bff/products/[handle]/claim
 *
 * Instantly claims a free digital product for the logged-in member.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const data = await corvexFetch<ClaimResponse>(storePath(`/products/${handle}/claim`), {
      method: 'POST',
      memberToken,
    })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF claim product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
