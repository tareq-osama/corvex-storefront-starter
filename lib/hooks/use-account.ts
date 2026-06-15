"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Member, Purchase, ShippingAddress, ShippingAddressInput } from "@/lib/types/account"

export const accountKeys = {
  profile: ['account', 'profile'] as const,
  addresses: ['account', 'addresses'] as const,
  purchases: ['account', 'purchases'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: accountKeys.profile,
    queryFn: async () => {
      const res = await fetch('/api/bff/account')
      if (!res.ok) return null
      const { member } = await res.json()
      return member as Member
    },
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (full_name: string) => {
      const res = await fetch('/api/bff/account', {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name }),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.profile }),
  })
}

export function useShippingAddresses() {
  return useQuery({
    queryKey: accountKeys.addresses,
    queryFn: async () => {
      const res = await fetch('/api/bff/account/addresses')
      if (!res.ok) return []
      const { addresses } = await res.json()
      return addresses as ShippingAddress[]
    },
    staleTime: 60_000,
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ShippingAddressInput) => {
      const res = await fetch('/api/bff/account/addresses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create address")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.addresses }),
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ShippingAddressInput> & { id: number; action?: 'set_default' }) => {
      const res = await fetch(`/api/bff/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update address")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.addresses }),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bff/account/addresses/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete address")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.addresses }),
  })
}

export function usePurchases() {
  return useQuery({
    queryKey: accountKeys.purchases,
    queryFn: async () => {
      const res = await fetch('/api/bff/account/purchases')
      if (!res.ok) return []
      const { purchases } = await res.json()
      return purchases as Purchase[]
    },
    staleTime: 60_000,
  })
}
