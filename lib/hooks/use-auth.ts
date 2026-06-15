"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Member } from "@/lib/types/account"
import { cartKeys } from "@/lib/hooks/use-cart"

export const authKeys = {
  session: ['auth', 'session'] as const,
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

/**
 * Resolve the current member session (via the BFF's session cookie).
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: () => fetchJson<{ member: Member | null }>('/api/bff/auth/session'),
    staleTime: 60 * 1000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      fetchJson<{ member: Member }>('/api/bff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.session, { member: data.member })
      // Login may merge the anonymous cart server-side.
      qc.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { email: string; name: string; password: string }) =>
      fetchJson<{ member: Member }>('/api/bff/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      qc.setQueryData(authKeys.session, { member: data.member })
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetchJson<{ ok: true }>('/api/bff/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.setQueryData(authKeys.session, { member: null })
      qc.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
