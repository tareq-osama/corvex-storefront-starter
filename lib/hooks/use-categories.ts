import { useQuery } from '@tanstack/react-query'
import type {
  ProductCategory,
  StoreCategoryListResponse,
  StoreProductListResponse,
} from '@/lib/types/store'

// ─── Query Key Factory ───────────────────────────────────────────────────────

export const categoryKeys = {
  all: ['categories'] as const,
  detail: (slug: string) => [...categoryKeys.all, slug] as const,
}

// ─── Fetch Helper ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetch all categories with product counts.
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => fetchJson<StoreCategoryListResponse>('/api/bff/categories'),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a single category with its products.
 */
export function useCategory(slug: string, filters?: { sort?: string; page?: number }) {
  const params = new URLSearchParams()
  if (filters?.sort) params.set('sort', filters.sort)
  if (filters?.page) params.set('page', String(filters.page))
  const qs = params.toString()

  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () =>
      fetchJson<{ category: ProductCategory } & StoreProductListResponse>(
        `/api/bff/categories/${slug}${qs ? `?${qs}` : ''}`
      ),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  })
}
