"use client"

import { useQuery } from "@tanstack/react-query"
import type { StoreOrder } from "@/lib/types/account"

export const orderKeys = {
  all: ['orders'] as const,
  list: (page?: number) => [...orderKeys.all, 'list', page] as const,
  detail: (id: number) => [...orderKeys.all, id] as const,
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: async () => {
      const res = await fetch(`/api/bff/account/orders?page=${page}&limit=20`)
      if (!res.ok) throw new Error("Failed to fetch orders")
      return res.json() as Promise<{ orders: StoreOrder[]; total: number; page: number; limit: number }>
    },
    staleTime: 30_000,
  })
}

export function useOrder(orderId: number) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const res = await fetch(`/api/bff/account/orders/${orderId}`)
      if (!res.ok) throw new Error("Order not found")
      return res.json() as Promise<{ order: StoreOrder }>
    },
    staleTime: 30_000,
  })
}
