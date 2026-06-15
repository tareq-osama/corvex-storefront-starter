import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { ShippingAddress } from '@/lib/types/account'

/**
 * GET /api/bff/account/addresses
 *
 * Lists the logged-in member's saved shipping addresses.
 */
export async function GET(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await corvexFetch<{ addresses: ShippingAddress[] }>(storePath('/account/addresses'), { memberToken })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account addresses list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/bff/account/addresses
 * Body: address fields (address_line1, city, postal_code, country required)
 */
export async function POST(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const data = await corvexFetch<{ address: ShippingAddress }>(storePath('/account/addresses'), {
      method: 'POST',
      memberToken,
      body,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account address create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
