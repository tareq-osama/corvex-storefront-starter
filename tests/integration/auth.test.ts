import { describe, it, expect, afterAll } from 'vitest'
import type { Member } from '@/lib/types/account'
import { createClient, uniqueEmail } from '../helpers/seed'

/**
 * Live integration test for the BFF auth proxy
 * (app/api/bff/auth/{register,login,session,logout}).
 *
 * Exercises the full member-auth round trip against the running Corvex
 * backend (CORVEX_API_URL) through this starter's own BFF (BFF_URL) — the
 * same path a browser on the storefront's domain would take. The httpOnly
 * `corvex_member_token` cookie is captured/replayed by TestClient exactly
 * like a browser cookie jar would.
 */
describe('BFF auth', () => {
  const email = uniqueEmail('auth-test')
  const password = 'Test1234!'

  it('rejects registration with an invalid email', async () => {
    const client = createClient()
    const res = await client.post('/api/bff/auth/register', {
      email: 'not-an-email',
      name: 'Invalid Email',
      password,
    })
    expect(res.status).toBe(400)
  })

  it('rejects registration with a too-short password', async () => {
    const client = createClient()
    const res = await client.post('/api/bff/auth/register', {
      email: uniqueEmail('short-pw'),
      name: 'Short Password',
      password: '123',
    })
    expect(res.status).toBe(400)
  })

  it('registers a new member and sets the session cookie', async () => {
    const client = createClient()
    const res = await client.post<{ member: Member }>('/api/bff/auth/register', {
      email,
      name: 'Storefront Auth Test',
      password,
    })

    expect(res.status).toBe(201)
    expect(res.data.member.email).toBe(email)
    expect(client.hasCookie('corvex_member_token')).toBe(true)
  })

  it('rejects a duplicate registration with the same email', async () => {
    const client = createClient()
    const res = await client.post('/api/bff/auth/register', {
      email,
      name: 'Duplicate',
      password,
    })
    expect(res.status).toBe(409)
  })

  it('rejects login with the wrong password', async () => {
    const client = createClient()
    const res = await client.post('/api/bff/auth/login', { email, password: 'WrongPassword1!' })
    expect(res.status).toBe(401)
    expect(client.hasCookie('corvex_member_token')).toBe(false)
  })

  it('logs in with correct credentials and validates the session', async () => {
    const client = createClient()

    const loginRes = await client.post<{ member: Member }>('/api/bff/auth/login', { email, password })
    expect(loginRes.status).toBe(200)
    expect(loginRes.data.member.email).toBe(email)
    expect(client.hasCookie('corvex_member_token')).toBe(true)

    const sessionRes = await client.get<{ member: Member | null }>('/api/bff/auth/session')
    expect(sessionRes.status).toBe(200)
    expect(sessionRes.data.member?.email).toBe(email)
  })

  it('returns member: null for an anonymous session', async () => {
    const client = createClient()
    const res = await client.get<{ member: null }>('/api/bff/auth/session')
    expect(res.status).toBe(200)
    expect(res.data.member).toBeNull()
  })

  it('logs out and invalidates the session', async () => {
    const client = createClient()
    await client.post('/api/bff/auth/login', { email, password })
    expect(client.hasCookie('corvex_member_token')).toBe(true)

    const logoutRes = await client.post<{ ok: true }>('/api/bff/auth/logout')
    expect(logoutRes.status).toBe(200)
    expect(logoutRes.data.ok).toBe(true)
    expect(client.hasCookie('corvex_member_token')).toBe(false)

    const sessionRes = await client.get<{ member: Member | null }>('/api/bff/auth/session')
    expect(sessionRes.data.member).toBeNull()
  })

  afterAll(async () => {
    // Best-effort cleanup: invalidate the session created by this run.
    const client = createClient()
    await client.post('/api/bff/auth/login', { email, password }).catch(() => {})
    await client.post('/api/bff/auth/logout').catch(() => {})
  })
})
