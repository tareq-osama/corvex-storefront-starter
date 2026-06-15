import { useQuery } from '@tanstack/react-query'
import type {
  StoreProductFilters,
  StoreProductListResponse,
  StoreProductDetailResponse,
  StoreSearchResponse,
} from '@/lib/types/store'

// ─── Query Key Factory ───────────────────────────────────────────────────────

export const productKeys = {
  all: ['products'] as const,
  list: (filters?: StoreProductFilters) => [...productKeys.all, 'list', filters] as const,
  detail: (handle: string) => [...productKeys.all, 'detail', handle] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
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

function buildProductsUrl(filters?: StoreProductFilters): string {
  const params = new URLSearchParams()
  if (filters?.category) params.set('category', filters.category)
  if (filters?.search) params.set('search', filters.search)
  if (filters?.sort) params.set('sort', filters.sort)
  if (filters?.page) params.set('page', String(filters.page))
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.featured) params.set('featured', 'true')
  if (filters?.type) params.set('type', filters.type)
  const qs = params.toString()
  return `/api/bff/products${qs ? `?${qs}` : ''}`
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetch paginated product list with filters.
 */
export function useProducts(filters?: StoreProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchJson<StoreProductListResponse>(buildProductsUrl(filters)),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch single product by handle with images, categories, related products.
 */
export function useProduct(handle: string) {
  return useQuery({
    queryKey: productKeys.detail(handle),
    queryFn: () => fetchJson<StoreProductDetailResponse>(`/api/bff/products/${handle}`),
    enabled: !!handle,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Search products.
 */
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => fetchJson<StoreSearchResponse>(`/api/bff/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
    staleTime: 30 * 1000,
  })
}
