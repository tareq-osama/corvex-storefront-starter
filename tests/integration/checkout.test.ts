import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Stripe from 'stripe'
import type { Cart, StoreProductDetailResponse } from '@/lib/types/store'
import type { CheckoutResponse, StoreOrder, ShippingAddressSnapshot } from '@/lib/types/account'
import { createClient, loginTestMember, optionalEnv } from '../helpers/seed'
import type { TestClient } from '../helpers/http-client'

/**
 * Live integration test for the BFF checkout proxy (app/api/bff/checkout)
 * and the Stripe payment flow behind it.
 *
 * Confirms the PaymentIntent server-side using Stripe's test payment method
 * `pm_card_visa` (no browser/Stripe.js needed), then polls the order via
 * /api/bff/account/orders/[id] until the Stripe webhook marks it paid.
 *
 * NOTE: for the webhook-driven assertion to pass against a local backend,
 * `stripe listen --forward-to <CORVEX_API_URL>/api/webhooks/stripe` must be
 * running so payment_intent.succeeded reaches the backend.
 */
const stripeSecretKey = optionalEnv('STRIPE_TEST_SECRET_KEY')
const paidHandle = optionalEnv('TEST_PAID_PRODUCT_HANDLE')
const freeHandle = optionalEnv('TEST_FREE_DIGITAL_PRODUCT_HANDLE')

async function clearCart(client: TestClient) {
  const { data } = await client.get<{ cart: Cart }>('/api/bff/cart')
  for (const item of data.cart.items) {
    await client.delete(`/api/bff/cart/items/${item.id}`)
  }
}

async function pollOrderUntilPaid(client: TestClient, orderId: number, timeoutMs = 20000): Promise<StoreOrder> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const res = await client.get<{ order: StoreOrder }>(`/api/bff/account/orders/${orderId}`)
    if (res.data.order.payment_status === 'paid') return res.data.order
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(
    `Order ${orderId} was not marked paid within ${timeoutMs}ms. ` +
      'Is `stripe listen --forward-to <CORVEX_API_URL>/api/webhooks/stripe` running?'
  )
}

describe.runIf(stripeSecretKey && paidHandle)('BFF checkout (Stripe test mode)', () => {
  const stripe = new Stripe(stripeSecretKey!)
  let client: TestClient

  beforeAll(async () => {
    client = await loginTestMember()
    await clearCart(client)
  })

  afterAll(async () => {
    await clearCart(client)
    await client.post('/api/bff/auth/logout')
  })

  it('checks out a paid order and confirms payment via Stripe', async () => {
    const productRes = await client.get<StoreProductDetailResponse>(`/api/bff/products/${paidHandle}`)
    const product = productRes.data.product
    await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId: product.id, quantity: 1 })

    const shippingAddress: ShippingAddressSnapshot | undefined = product.requires_shipping
      ? {
          first_name: 'Test',
          last_name: 'Member',
          address_line1: '123 Test St',
          city: 'Testville',
          state: 'TS',
          postal_code: '12345',
          country: 'US',
        }
      : undefined

    const checkoutRes = await client.post<CheckoutResponse>('/api/bff/checkout', { shippingAddress })
    expect(checkoutRes.status).toBe(200)
    expect(checkoutRes.data.free).not.toBe(true)
    expect(checkoutRes.data.clientSecret).toBeTruthy()

    const paymentIntentId = checkoutRes.data.clientSecret!.split('_secret_')[0]
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, { payment_method: 'pm_card_visa' })
    expect(confirmed.status).toBe('succeeded')

    const order = await pollOrderUntilPaid(client, checkoutRes.data.orderId)
    expect(order.status).toBe('confirmed')
    expect(order.payment_status).toBe('paid')
  })

  it.runIf(freeHandle)('checks out a free order without creating a PaymentIntent', async () => {
    const productRes = await client.get<StoreProductDetailResponse>(`/api/bff/products/${freeHandle}`)
    await client.post<{ cart: Cart }>('/api/bff/cart/items', { productId: productRes.data.product.id, quantity: 1 })

    const checkoutRes = await client.post<CheckoutResponse>('/api/bff/checkout', {})
    expect(checkoutRes.status).toBe(200)
    expect(checkoutRes.data.free).toBe(true)
    expect(checkoutRes.data.clientSecret).toBeUndefined()
  })
})
