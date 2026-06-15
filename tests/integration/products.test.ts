import { describe, it, expect } from 'vitest'
import type {
  StoreProductListResponse,
  StoreProductDetailResponse,
  StoreCategoryListResponse,
  StoreSearchResponse,
  ProductCategory,
} from '@/lib/types/store'
import { createClient, optionalEnv } from '../helpers/seed'

/**
 * Live integration test for the BFF products/categories/search proxy
 * (app/api/bff/{products,categories,search}). All routes are public —
 * no member token required.
 */
describe('BFF products', () => {
  it('lists products with pagination metadata', async () => {
    const client = createClient()
    const res = await client.get<StoreProductListResponse>('/api/bff/products')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.products)).toBe(true)
    expect(typeof res.data.total).toBe('number')
    expect(typeof res.data.page).toBe('number')
    expect(typeof res.data.pageSize).toBe('number')
  })

  it('forwards filter/sort/pagination query params', async () => {
    const client = createClient()
    const res = await client.get<StoreProductListResponse>(
      '/api/bff/products?sort=price_asc&page=1&limit=5'
    )

    expect(res.status).toBe(200)
    expect(res.data.page).toBe(1)
    expect(res.data.products.length).toBeLessThanOrEqual(5)
  })

  it('returns 404 for an unknown product handle', async () => {
    const client = createClient()
    const res = await client.get('/api/bff/products/this-handle-does-not-exist-xyz')
    expect(res.status).toBe(404)
  })

  const paidHandle = optionalEnv('TEST_PAID_PRODUCT_HANDLE')
  it.runIf(paidHandle)('returns product detail with related products by handle', async () => {
    const client = createClient()
    const res = await client.get<StoreProductDetailResponse>(`/api/bff/products/${paidHandle}`)

    expect(res.status).toBe(200)
    expect(res.data.product.handle).toBe(paidHandle)
    expect(Array.isArray(res.data.product.images)).toBe(true)
    expect(Array.isArray(res.data.relatedProducts)).toBe(true)
  })

  it('lists categories', async () => {
    const client = createClient()
    const res = await client.get<StoreCategoryListResponse>('/api/bff/categories')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.categories)).toBe(true)
  })

  it('returns category detail + its products for the first available category', async () => {
    const client = createClient()
    const categoriesRes = await client.get<StoreCategoryListResponse>('/api/bff/categories')
    const first = categoriesRes.data.categories[0]
    if (!first) {
      console.warn('Skipping category detail check — no categories in test workspace')
      return
    }

    const res = await client.get<{ category: ProductCategory } & StoreProductListResponse>(
      `/api/bff/categories/${first.slug}`
    )
    expect(res.status).toBe(200)
    expect(res.data.category.slug).toBe(first.slug)
    expect(Array.isArray(res.data.products)).toBe(true)
  })

  it('searches products', async () => {
    const client = createClient()
    const res = await client.get<StoreSearchResponse>('/api/bff/search?q=a')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.data.products)).toBe(true)
    expect(typeof res.data.total).toBe('number')
  })
})
