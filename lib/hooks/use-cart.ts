import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/lib/types/store'

// ─── Query Key Factory ───────────────────────────────────────────────────────

export const cartKeys = {
  all: ['cart'] as const,
  detail: ['cart', 'detail'] as const,
}

// ─── Fetch Helper ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetch the current cart.
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.detail,
    queryFn: () => fetchJson<{ cart: Cart }>('/api/bff/cart').then(r => r.cart),
    staleTime: 30 * 1000,
    retry: 1,
  })
}

/**
 * Add an item to the cart.
 */
export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { productId: number; variantId?: number | null; quantity?: number }) =>
      fetchJson<{ cart: Cart }>('/api/bff/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).then(r => r.cart),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail, cart)
    },
  })
}

/**
 * Update the quantity of a cart item.
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { itemId: number; quantity: number }) =>
      fetchJson<{ cart: Cart }>(`/api/bff/cart/items/${params.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: params.quantity }),
      }).then(r => r.cart),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail, cart)
    },
  })
}

/**
 * Remove an item from the cart.
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: number) =>
      fetchJson<{ cart: Cart }>(`/api/bff/cart/items/${itemId}`, {
        method: 'DELETE',
      }).then(r => r.cart),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail, cart)
    },
  })
}
