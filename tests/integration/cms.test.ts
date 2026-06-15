import { describe, it, expect } from 'vitest'
import type { CmsCollectionResponse, CmsItemResponse } from '@/lib/types/cms'
import { createClient, optionalEnv } from '../helpers/seed'

/**
 * Live integration test for the BFF CMS read proxy
 * (app/api/bff/collections/[slug] and .../items/[itemSlug]).
 *
 * Confirms the headless CMS surface is reachable with no auth, matching the
 * "Corvex as a headless CMS for storefronts" requirement.
 */
describe('BFF CMS collections', () => {
  it('returns 404 for an unknown collection slug', async () => {
    const client = createClient()
    const res = await client.get('/api/bff/collections/this-collection-does-not-exist-xyz')
    expect(res.status).toBe(404)
  })

  const collectionSlug = optionalEnv('TEST_CMS_COLLECTION_SLUG')
  const itemSlug = optionalEnv('TEST_CMS_ITEM_SLUG')

  it.runIf(collectionSlug)('lists published items in the test collection', async () => {
    const client = createClient()
    const res = await client.get<CmsCollectionResponse>(`/api/bff/collections/${collectionSlug}`)

    expect(res.status).toBe(200)
    expect(res.data.collection.slug).toBe(collectionSlug)
    expect(Array.isArray(res.data.items)).toBe(true)
    expect(typeof res.data.total).toBe('number')
  })

  it.runIf(collectionSlug)('forwards pagination query params', async () => {
    const client = createClient()
    const res = await client.get<CmsCollectionResponse>(
      `/api/bff/collections/${collectionSlug}?page=1&limit=1`
    )

    expect(res.status).toBe(200)
    expect(res.data.page).toBe(1)
    expect(res.data.items.length).toBeLessThanOrEqual(1)
  })

  it.runIf(collectionSlug && itemSlug)('returns a single CMS item with its collection context', async () => {
    const client = createClient()
    const res = await client.get<CmsItemResponse>(`/api/bff/collections/${collectionSlug}/items/${itemSlug}`)

    expect(res.status).toBe(200)
    expect(res.data.item.slug).toBe(itemSlug)
    expect(res.data.item.collection.slug).toBe(collectionSlug)
  })

  it.runIf(collectionSlug)('returns 404 for an unknown item slug in a real collection', async () => {
    const client = createClient()
    const res = await client.get(`/api/bff/collections/${collectionSlug}/items/this-item-does-not-exist-xyz`)
    expect(res.status).toBe(404)
  })
})
