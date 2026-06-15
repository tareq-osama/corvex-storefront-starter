"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { useCartContext } from "./cart-context"
import { PriceDisplay } from "./price-display"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { X, Minus, Plus, ShoppingBag, Tag } from "lucide-react"
import { toProxiedImageSrc } from "@/lib/image"
import { cn } from "@/lib/utils"

// ─── Quantity Control with local optimistic state ────────────────────────────

function QuantityControl({
  itemId,
  initialQty,
  onUpdate,
  onRemove,
}: {
  itemId: number
  initialQty: number
  onUpdate: (id: number, qty: number) => Promise<void>
  onRemove: (id: number) => Promise<void>
}) {
  const [qty, setQty] = useState(initialQty)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pending, setPending] = useState(false)

  const applyChange = useCallback(
    (newQty: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setPending(true)
        try {
          if (newQty <= 0) await onRemove(itemId)
          else await onUpdate(itemId, newQty)
        } finally {
          setPending(false)
        }
      }, 350)
    },
    [itemId, onUpdate, onRemove]
  )

  const decrement = () => {
    const next = qty - 1
    setQty(next)
    applyChange(next)
  }

  const increment = () => {
    const next = qty + 1
    setQty(next)
    applyChange(next)
  }

  return (
    <div className={cn(
      "flex items-center rounded-md border border-border overflow-hidden h-7",
      pending && "opacity-60"
    )}>
      <button
        className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={decrement}
        disabled={pending}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="px-2 text-xs tabular-nums font-medium min-w-[1.75rem] text-center">
        {qty}
      </span>
      <button
        className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={increment}
        disabled={pending}
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

export function CartDrawer() {
  const {
    cart,
    isLoading,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCartContext()

  const items = cart?.items ?? []
  const isEmpty = items.length === 0
  const appliedCode = cart?.discount_code ?? null
  const discountAmount = cart?.discount_amount ?? 0

  return (
    <Sheet open={isDrawerOpen} onOpenChange={open => !open && closeDrawer()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Cart
              {cart && cart.item_count > 0 && (
                <Badge variant="secondary" className="text-xs font-normal h-5 px-1.5">
                  {cart.item_count}
                </Badge>
              )}
            </SheetTitle>
            <button
              onClick={closeDrawer}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-sm p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Add products to get started</p>
            </div>
            <Button variant="outline" size="sm" onClick={closeDrawer} asChild>
              <Link href="/products">
                Browse products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map(item => {
                const thumbnail = toProxiedImageSrc(item.product?.thumbnail_url)
                return (
                  <div key={item.id} className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-muted overflow-hidden border border-border/50">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={item.product?.name ?? ''}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {item.product?.name ?? `Product #${item.product_id}`}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.variant.title}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <QuantityControl
                          itemId={item.id}
                          initialQty={item.quantity}
                          onUpdate={updateQuantity}
                          onRemove={removeItem}
                        />
                        <button
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="shrink-0 text-right">
                      <PriceDisplay
                        price={item.unit_price * item.quantity}
                        currency={item.currency}
                        size="sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4 space-y-3 flex-shrink-0">
              {/* Applied discount badge */}
              {appliedCode && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-500/8 rounded-md px-2 py-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium font-mono">{appliedCode}</span>
                  <span className="text-muted-foreground ml-0.5">applied</span>
                  {discountAmount > 0 && (
                    <span className="ml-auto font-medium">
                      −<PriceDisplay price={discountAmount} currency={items[0]?.currency ?? 'USD'} size="sm" />
                    </span>
                  )}
                </div>
              )}

              {/* Subtotal + Total */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <PriceDisplay
                    price={cart!.subtotal}
                    currency={items[0]?.currency ?? 'USD'}
                    size="sm"
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>−<PriceDisplay price={discountAmount} currency={items[0]?.currency ?? 'USD'} size="sm" /></span>
                  </div>
                )}
                <div className="flex items-center justify-between font-semibold pt-1 border-t border-border">
                  <span>Total</span>
                  <PriceDisplay
                    price={cart!.total}
                    currency={items[0]?.currency ?? 'USD'}
                    size="sm"
                    className="font-semibold"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={closeDrawer} asChild>
                  <Link href="/cart">View cart</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
