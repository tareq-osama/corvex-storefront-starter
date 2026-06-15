/**
 * Server-only typed fetch wrapper around the Corvex headless backend.
 *
 * This module must only be imported from server-side code (BFF route
 * handlers, server components). It talks to Corvex over HTTP using
 * `CORVEX_API_URL` and never exposes member/cart tokens to the browser —
 * those are held in this app's own first-party httpOnly cookies and
 * attached here as `Authorization: Bearer <token>` / `X-Cart-Session`.
 */

export class CorvexApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    const message =
      (typeof body === 'object' && body !== null && 'error' in body && typeof (body as any).error === 'string')
        ? (body as any).error
        : `Corvex API error (${status})`
    super(message)
    this.name = 'CorvexApiError'
    this.status = status
    this.body = body
  }
}

function getApiUrl(): string {
  const url = process.env.CORVEX_API_URL
  if (!url) throw new Error('CORVEX_API_URL is not configured')
  return url.replace(/\/$/, '')
}

export function getWorkspaceId(): string {
  const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID
  if (!workspaceId) throw new Error('NEXT_PUBLIC_WORKSPACE_ID is not configured')
  return workspaceId
}

/** Build `/api/store/{workspaceId}{path}` */
export function storePath(path: string): string {
  return `/api/store/${getWorkspaceId()}${path}`
}

/** Build `/api/public/members/{workspaceId}{path}` */
export function membersPath(path: string): string {
  return `/api/public/members/${getWorkspaceId()}${path}`
}

export interface CorvexRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Member session token -> sent as `Authorization: Bearer <token>` */
  memberToken?: string | null
  /** Anonymous cart token -> sent as `X-Cart-Session` */
  cartToken?: string | null
  searchParams?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, searchParams?: CorvexRequestOptions['searchParams']): string {
  const url = new URL(`${getApiUrl()}${path}`)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null) continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

/**
 * Call a Corvex API route server-to-server. Throws `CorvexApiError` on
 * non-2xx responses. Returns `null` for 204/empty bodies.
 */
export async function corvexFetch<T = unknown>(path: string, options: CorvexRequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.searchParams)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.memberToken) headers['Authorization'] = `Bearer ${options.memberToken}`
  if (options.cartToken) headers['X-Cart-Session'] = options.cartToken

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw new CorvexApiError(res.status, data)
  }

  return data as T
}
