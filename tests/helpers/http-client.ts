/**
 * Minimal cookie-jar fetch client for live integration tests.
 *
 * Talks to this starter's own BFF routes (`/api/bff/**`) over HTTP, persisting
 * `Set-Cookie` responses across requests the same way a browser would — so the
 * httpOnly `corvex_member_token` / `corvex_cart_token` cookies set by the BFF
 * round-trip correctly between requests.
 */
export class TestClient {
  private cookies = new Map<string, string>()

  constructor(private readonly baseUrl: string) {}

  private cookieHeader(): string | undefined {
    if (this.cookies.size === 0) return undefined
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  private captureCookies(response: Response) {
    const setCookieHeaders = response.headers.getSetCookie?.() ?? []
    for (const cookieStr of setCookieHeaders) {
      const [pair] = cookieStr.split(';')
      const eqIndex = pair.indexOf('=')
      if (eqIndex === -1) continue
      const name = pair.slice(0, eqIndex).trim()
      const value = pair.slice(eqIndex + 1).trim()
      if (value === '') {
        this.cookies.delete(name)
      } else {
        this.cookies.set(name, value)
      }
    }
  }

  hasCookie(name: string): boolean {
    return this.cookies.has(name)
  }

  clearCookies() {
    this.cookies.clear()
  }

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers)
    const cookieHeader = this.cookieHeader()
    if (cookieHeader) headers.set('Cookie', cookieHeader)
    if (init.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers })
    this.captureCookies(response)
    return response
  }

  async json<T = unknown>(path: string, init?: RequestInit): Promise<{ status: number; data: T }> {
    const response = await this.request(path, init)
    const text = await response.text()
    const data = (text ? JSON.parse(text) : null) as T
    return { status: response.status, data }
  }

  get<T = unknown>(path: string) {
    return this.json<T>(path, { method: 'GET' })
  }

  post<T = unknown>(path: string, body?: unknown) {
    return this.json<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
  }

  patch<T = unknown>(path: string, body?: unknown) {
    return this.json<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined })
  }

  delete<T = unknown>(path: string, body?: unknown) {
    return this.json<T>(path, { method: 'DELETE', body: body !== undefined ? JSON.stringify(body) : undefined })
  }
}
