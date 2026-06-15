import { TestClient } from './http-client'

export const BFF_URL = process.env.BFF_URL || 'http://localhost:3001'

/** Reads a required env var, throwing with a helpful message if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var "${name}" — see .env.test.example`)
  }
  return value
}

/** Reads an optional env var, returning undefined if unset or empty. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export function createClient(): TestClient {
  return new TestClient(BFF_URL)
}

/**
 * Logs in the shared TEST_MEMBER_EMAIL/PASSWORD, registering the member first
 * if it doesn't exist yet. Used by suites (cart, checkout, account) that need
 * a stable, reusable member across runs.
 */
export async function loginTestMember(): Promise<TestClient> {
  const email = requireEnv('TEST_MEMBER_EMAIL')
  const password = requireEnv('TEST_MEMBER_PASSWORD')

  const client = createClient()
  const loginRes = await client.post('/api/bff/auth/login', { email, password })
  if (loginRes.status === 200) return client

  if (loginRes.status === 401) {
    const registerRes = await client.post('/api/bff/auth/register', {
      email,
      password,
      name: 'Storefront Test Member',
    })
    if (registerRes.status === 201) return client

    if (registerRes.status === 409) {
      const retryRes = await client.post('/api/bff/auth/login', { email, password })
      if (retryRes.status === 200) return client
      throw new Error(`Failed to login existing test member: ${JSON.stringify(retryRes.data)}`)
    }

    throw new Error(`Failed to register test member: ${JSON.stringify(registerRes.data)}`)
  }

  throw new Error(`Unexpected login response (${loginRes.status}): ${JSON.stringify(loginRes.data)}`)
}

/** Generates a fresh, never-before-used email for one-off registration tests. */
export function uniqueEmail(prefix = 'storefront-test'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}
