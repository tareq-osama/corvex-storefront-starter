import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { ShippingAddress } from '@/lib/types/account'

/**
 * PATCH /api/bff/account/addresses/[id]
 * Body: address fields to update, or { action: 'set_default' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const data = await corvexFetch<{ address: ShippingAddress } | { success: true }>(
      storePath(`/account/addresses/${id}`),
      { method: 'PATCH', memberToken, body }
    )
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account address update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/bff/account/addresses/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await corvexFetch<{ success: true }>(storePath(`/account/addresses/${id}`), {
      method: 'DELETE',
      memberToken,
    })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account address delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
