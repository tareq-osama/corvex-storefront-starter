import { useQuery } from '@tanstack/react-query'
import type { CmsCollectionResponse, CmsItemResponse } from '@/lib/types/cms'

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

/**
 * Fetch a paginated CMS collection archive (published items).
 */
export function useCollection(
  slug: string,
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: ['collection', slug, page, limit],
    queryFn: () =>
      fetchJson<CmsCollectionResponse>(
        `/api/bff/collections/${encodeURIComponent(slug)}?page=${page}&limit=${limit}`
      ),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch a single CMS item within a collection.
 */
export function useCollectionItem(slug: string, itemSlug: string) {
  return useQuery({
    queryKey: ['collection-item', slug, itemSlug],
    queryFn: () =>
      fetchJson<CmsItemResponse>(
        `/api/bff/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemSlug)}`
      ),
    enabled: !!slug && !!itemSlug,
    staleTime: 2 * 60 * 1000,
  })
}
