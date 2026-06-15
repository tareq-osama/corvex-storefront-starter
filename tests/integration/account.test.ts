import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Member, ShippingAddress, StoreOrder, MyDownloadsResponse, ClaimResponse } from '@/lib/types/account'
import { createClient, loginTestMember, optionalEnv } from '../helpers/seed'
import type { TestClient } from '../helpers/http-client'

/**
 * Live integration test for the BFF account proxy
 * (app/api/bff/account/**, .../my-downloads, .../claim).
 *
 * All routes here require the member session cookie set by
 * /api/bff/auth/login — exercised via the shared TEST_MEMBER_EMAIL/PASSWORD.
 */
describe('BFF account', () => {
  it('rejects unauthenticated access to the profile', async () => {
    const client = createClient()
    const res = await client.get('/api/bff/account')
    expect(res.status).toBe(401)
  })

  describe('as a logged-in member', () => {
    let client: TestClient

    beforeAll(async () => {
      client = await loginTestMember()
    })

    afterAll(async () => {
      await client.post('/api/bff/auth/logout')
    })

    it('returns the member profile', async () => {
      const res = await client.get<{ member: Member }>('/api/bff/account')
      expect(res.status).toBe(200)
      expect(res.data.member.email).toBe(process.env.TEST_MEMBER_EMAIL)
    })

    it('updates the member profile', async () => {
      const res = await client.patch<{ member: Member }>('/api/bff/account', { full_name: 'Storefront Test Member' })
      expect(res.status).toBe(200)
      expect(res.data.member.full_name ?? res.data.member.name).toBe('Storefront Test Member')
    })

    it('lists orders with pagination metadata', async () => {
      const res = await client.get<{ orders: StoreOrder[]; total: number; page: number; limit: number }>(
        '/api/bff/account/orders'
      )
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data.orders)).toBe(true)
      expect(typeof res.data.total).toBe('number')
    })

    it('returns 404 for an order that does not belong to this member', async () => {
      const res = await client.get('/api/bff/account/orders/999999999')
      expect(res.status).toBe(404)
    })

    it('lists purchases', async () => {
      const res = await client.get<{ purchases: unknown[] }>('/api/bff/account/purchases')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.data.purchases)).toBe(true)
    })

    describe('shipping addresses', () => {
      let addressId: number

      it('creates a shipping address', async () => {
        const res = await client.post<{ address: ShippingAddress }>('/api/bff/account/addresses', {
          label: 'Storefront Test Address',
          first_name: 'Test',
          last_name: 'Member',
          address_line1: '123 Test St',
          address_line2: null,
          city: 'Testville',
          state: 'TS',
          postal_code: '12345',
          country: 'US',
          phone: '+10000000000',
          is_default: false,
        })

        expect(res.status).toBe(201)
        expect(res.data.address.address_line1).toBe('123 Test St')
        addressId = res.data.address.id
      })

      it('lists the created address', async () => {
        const res = await client.get<{ addresses: ShippingAddress[] }>('/api/bff/account/addresses')
        expect(res.status).toBe(200)
        expect(res.data.addresses.some((a) => a.id === addressId)).toBe(true)
      })

      it('sets the address as default', async () => {
        const res = await client.patch('/api/bff/account/addresses/' + addressId, { action: 'set_default' })
        expect(res.status).toBe(200)
      })

      it('deletes the address', async () => {
        const res = await client.delete<{ success: true }>('/api/bff/account/addresses/' + addressId)
        expect(res.status).toBe(200)
        expect(res.data.success).toBe(true)
      })
    })

    const freeHandle = optionalEnv('TEST_FREE_DIGITAL_PRODUCT_HANDLE')

    it.runIf(freeHandle)('claims a free digital product and lists it in downloads', async () => {
      const claimRes = await client.post<ClaimResponse>(`/api/bff/products/${freeHandle}/claim`)
      expect(claimRes.status).toBe(200)
      expect(claimRes.data.success).toBe(true)

      const downloadsRes = await client.get<MyDownloadsResponse>(`/api/bff/products/${freeHandle}/my-downloads`)
      expect(downloadsRes.status).toBe(200)
      expect(downloadsRes.data.purchased).toBe(true)
    })
  })

  const freeHandle = optionalEnv('TEST_FREE_DIGITAL_PRODUCT_HANDLE')

  it.runIf(freeHandle)('returns purchased: false for my-downloads when not authenticated', async () => {
    const client = createClient()
    const res = await client.get<MyDownloadsResponse>(`/api/bff/products/${freeHandle}/my-downloads`)
    expect(res.status).toBe(200)
    expect(res.data.purchased).toBe(false)
  })

  it.runIf(freeHandle)('rejects claiming a product when not authenticated', async () => {
    const client = createClient()
    const res = await client.post(`/api/bff/products/${freeHandle}/claim`)
    expect(res.status).toBe(401)
  })
})
