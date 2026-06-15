"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StoreHeader } from "./store-header"
import { StoreFooter } from "./store-footer"
import { CartProvider } from "./cart-context"
import { CartDrawer } from "./cart-drawer"
import { Toaster } from "@/components/ui/toaster"

const QUERY_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
}

/** Pages that render their own full-page layout (no header/footer/cart) */
const BARE_PAGE_SEGMENTS = ['/login', '/signup', '/auth/']

function isBareAuthPage(pathname: string) {
  return BARE_PAGE_SEGMENTS.some(seg => pathname === seg || pathname.startsWith(seg))
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [queryClient] = useState(() => new QueryClient(QUERY_OPTIONS))

  if (isBareAuthPage(pathname)) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <StoreHeader />
          <main className="flex-1">{children}</main>
          <StoreFooter />
        </div>
        <CartDrawer />
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  )
}
