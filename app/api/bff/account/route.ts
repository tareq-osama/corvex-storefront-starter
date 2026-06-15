import { NextRequest, NextResponse } from 'next/server'
import { corvexFetch, storePath, CorvexApiError } from '@/lib/corvex/client'
import { readMemberToken } from '@/lib/corvex/cookies'
import type { Member } from '@/lib/types/account'

/**
 * GET /api/bff/account
 *
 * Returns the logged-in member's profile. Requires the member session
 * cookie set by /api/bff/auth/login.
 */
export async function GET(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await corvexFetch<{ member: Member }>(storePath('/account'), { memberToken })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/bff/account
 * Body: { full_name?: string }
 */
export async function PATCH(request: NextRequest) {
  const memberToken = readMemberToken(request)
  if (!memberToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const data = await corvexFetch<{ member: Member }>(storePath('/account'), {
      method: 'PATCH',
      memberToken,
      body,
    })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof CorvexApiError) {
      return NextResponse.json(error.body, { status: error.status })
    }
    console.error('BFF account update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
