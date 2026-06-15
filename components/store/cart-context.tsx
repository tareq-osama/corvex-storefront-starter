"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { toast } from "sonner"
import { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/hooks/use-cart"
import type { Cart } from "@/lib/types/store"

interface CartContextValue {
  cart: Cart | undefined
  isLoading: boolean
  itemCount: number
  isDrawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (productId: number, variantId?: number | null, quantity?: number) => Promise<{ error?: string }>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  isAdding: boolean
  isUpdating: boolean
  isRemoving: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCartContext must be used within CartProvider")
  return ctx
}

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const { data: cart, isLoading } = useCart()
  const addMutation = useAddToCart()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()

  const openDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  const addItem = useCallback(
    async (productId: number, variantId?: number | null, quantity = 1): Promise<{ error?: string }> => {
      try {
        await addMutation.mutateAsync({ productId, variantId, quantity })
        setIsDrawerOpen(true)
        return {}
      } catch (err: any) {
        const message = err.message ?? "Could not add to cart"
        toast.error(message)
        return { error: message }
      }
    },
    [addMutation]
  )

  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      await updateMutation.mutateAsync({ itemId, quantity })
    },
    [updateMutation]
  )

  const removeItem = useCallback(
    async (itemId: number) => {
      await removeMutation.mutateAsync(itemId)
    },
    [removeMutation]
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount: cart?.item_count ?? 0,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        updateQuantity,
        removeItem,
        isAdding: addMutation.isPending,
        isUpdating: updateMutation.isPending,
        isRemoving: removeMutation.isPending,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
