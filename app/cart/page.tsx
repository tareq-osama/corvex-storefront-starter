"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PriceDisplay } from "@/components/store/price-display"
import { useCartContext } from "@/components/store/cart-context"
import { DiscountCodeInput } from "@/components/store/discount-code-input"
import { toProxiedImageSrc } from "@/lib/image"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Optimistic Quantity Control ─────────────────────────────────────────────

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

  return (
    <div className={cn("flex items-center rounded-md border border-border overflow-hidden h-9", pending && "opacity-60")}>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={() => { const n = qty - 1; setQty(n); applyChange(n) }}
        disabled={pending}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="px-3 py-1 text-sm tabular-nums font-medium min-w-[2.5rem] text-center border-x border-border">
        {qty}
      </span>
      <button
        className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={() => { const n = qty + 1; setQty(n); applyChange(n) }}
        disabled={pending}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function CartPage() {
  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
  } = useCartContext()
  // Read discount from cart (persisted in DB via discount_code_id)
  const appliedCode = cart?.discount_code ?? null
  const discountAmount = cart?.discount_amount ?? 0

  const items = cart?.items ?? []
  const isEmpty = items.length === 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Cart</span>
      </nav>

      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 space-y-4">
          <svg className="h-16 w-16 mx-auto text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button variant="outline" asChild>
            <Link href="/products">
              Continue shopping
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-0 divide-y divide-border">
            {items.map(item => {
              const imageUrl = toProxiedImageSrc(item.product?.thumbnail_url)
              return (
                <div key={item.id} className="flex gap-4 py-6 first:pt-0">
                  {/* Thumbnail */}
                  <Link
                    href={item.product?.handle ? `/products/${item.product.handle}` : '#'}
                    className="h-24 w-24 shrink-0 rounded-lg bg-muted overflow-hidden"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product?.name ?? ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5" />
                        </svg>
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.product?.handle ? `/products/${item.product.handle}` : '#'}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {item.product?.name ?? `Product #${item.product_id}`}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variant.title}
                      </p>
                    )}
                    <div className="mt-1">
                      <PriceDisplay price={item.unit_price} currency={item.currency} size="sm" />
                    </div>

                    <div className="mt-3 flex items-center gap-4">
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

                  {/* Line total */}
                  <div className="shrink-0 text-right">
                    <PriceDisplay
                      price={item.unit_price * item.quantity}
                      currency={item.currency}
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-muted/30 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold">Order summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <PriceDisplay
                    price={cart!.subtotal}
                    currency={items[0]?.currency ?? 'USD'}
                    size="sm"
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>−<PriceDisplay price={discountAmount} currency={items[0]?.currency ?? 'USD'} size="sm" /></span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-xs text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>

              {/* Discount code */}
              <DiscountCodeInput appliedCode={appliedCode} />

              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-semibold">Total</span>
                <PriceDisplay
                  price={cart!.total}
                  currency={items[0]?.currency ?? 'USD'}
                  size="md"
                  className="font-semibold"
                />
              </div>

              <Button className="w-full h-11" asChild>
                <Link href="/checkout">
                  Proceed to checkout
                </Link>
              </Button>

              <Link
                href="/products"
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
