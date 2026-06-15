import { describe, it, expect, beforeAll } from 'vitest'
import type { Cart, StoreProductDetailResponse } from '@/lib/types/store'
import { createClient, optionalEnv, requireEnv } from '../helpers/seed'

/**
 * Live integration test for the BFF cart proxy (app/api/bff/cart/**).
 *
 * Covers the anonymous cart (X-Cart-Session token persisted via the
 * `corvex_cart_token` httpOnly cookie) and the merge-on-login flow that
 * folds an anonymous cart into the member's cart when `/api/bff/auth/login`
 * is called.
 */
describe('BFF cart', () => {
  it('creates an empty anonymous cart', async () => {
    const client = createClient()
    const res = await client.get<{ cart: Cart }>('/api/bff/cart')

    expect(res.status).toBe(200)
    expect(res.data.cart.member_id).toBeNull()
    expect(res.data.cart.items).toEqual([])
  })

  const productHandle = optionalEnv('TEST_PAID_PRODUCT_HANDLE') ?? optionalEnv('TEST_FREE_DIGITAL_PRODUCT_HANDLE')

  describe.runIf(productHandle)('with a seeded product', () => {
    let productId: number

    beforeAll(async () => {
      const client = createClient()
      const res = await client.get<StoreProductDetailResponse>(`/api/bff/products/${productHandle}`)
      productId = res.data.product.id
    })

    it('adds an item to the anonymous cart and persists a cart token cookie', async () => {
      const client = createClient()
      const res = await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId, quantity: 1 })

      expect(res.status).toBe(200)
      expect(res.data.cart.items.some((i) => i.product_id === productId)).toBe(true)
      expect(client.hasCookie('corvex_cart_token')).toBe(true)
    })

    it('updates an item quantity', async () => {
      const client = createClient()
      const addRes = await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId, quantity: 1 })
      const item = addRes.data.cart.items.find((i) => i.product_id === productId)
      expect(item).toBeDefined()

      const patchRes = await client.patch<{ cart: Cart }>(`/api/bff/cart/items/${item!.id}`, { quantity: 3 })
      expect(patchRes.status).toBe(200)
      const updated = patchRes.data.cart.items.find((i) => i.id === item!.id)
      expect(updated?.quantity).toBe(3)
    })

    it('removes an item from the cart', async () => {
      const client = createClient()
      const addRes = await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId, quantity: 1 })
      const item = addRes.data.cart.items.find((i) => i.product_id === productId)
      expect(item).toBeDefined()

      const delRes = await client.delete<{ cart: Cart }>(`/api/bff/cart/items/${item!.id}`)
      expect(delRes.status).toBe(200)
      expect(delRes.data.cart.items.some((i) => i.id === item!.id)).toBe(false)
    })

    it('merges the anonymous cart into the member cart on login', async () => {
      const client = createClient()
      const email = requireEnv('TEST_MEMBER_EMAIL')
      const password = requireEnv('TEST_MEMBER_PASSWORD')

      // Build an anonymous cart and capture its session-token cookie.
      await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId, quantity: 2 })
      expect(client.hasCookie('corvex_cart_token')).toBe(true)

      // Login (registering the shared test member first if needed).
      let loginRes = await client.post('/api/bff/auth/login', { email, password })
      if (loginRes.status === 401) {
        await client.post('/api/bff/auth/register', { email, password, name: 'Storefront Test Member' })
        loginRes = await client.post('/api/bff/auth/login', { email, password })
      }
      expect(loginRes.status).toBe(200)

      // The merged member cart should now contain the item; anon cart cookie clears.
      const cartRes = await client.get<{ cart: Cart }>('/api/bff/cart')
      expect(cartRes.data.cart.member_id).not.toBeNull()
      expect(cartRes.data.cart.items.some((i) => i.product_id === productId)).toBe(true)

      // Cleanup: remove the merged item and log out so the suite is repeatable.
      const mergedItem = cartRes.data.cart.items.find((i) => i.product_id === productId)
      if (mergedItem) await client.delete(`/api/bff/cart/items/${mergedItem.id}`)
      await client.post('/api/bff/auth/logout')
    })
  })

  const discountCode = optionalEnv('TEST_DISCOUNT_CODE')
  it.runIf(productHandle && discountCode)('applies and removes a cart discount code', async () => {
    const client = createClient()
    const productRes = await client.get<StoreProductDetailResponse>(`/api/bff/products/${productHandle}`)
    await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId: productRes.data.product.id, quantity: 1 })

    const applyRes = await client.post<{ cart: Cart; code: string; discountAmount: number }>(
      '/api/bff/cart/discount',
      { code: discountCode }
    )
    expect(applyRes.status).toBe(200)
    expect(applyRes.data.cart.discount_code).toBe(discountCode)
    expect(applyRes.data.discountAmount).toBeGreaterThan(0)

    const removeRes = await client.delete<{ cart: Cart }>('/api/bff/cart/discount')
    expect(removeRes.status).toBe(200)
    expect(removeRes.data.cart.discount_code).toBeFalsy()
  })
})
