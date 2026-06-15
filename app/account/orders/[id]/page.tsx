"use client"

import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/store/order-status-badge"
import { PriceDisplay } from "@/components/store/price-display"
import { useOrder } from "@/lib/hooks/use-orders"
import { toProxiedImageSrc } from "@/lib/image"
import type { ShippingAddressSnapshot } from "@/lib/types/account"

function AddressBlock({ address, label }: { address: ShippingAddressSnapshot | null; label: string }) {
  if (!address) return null
  return (
    <div className="space-y-1 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {(address.first_name || address.last_name) && (
        <p>{[address.first_name, address.last_name].filter(Boolean).join(" ")}</p>
      )}
      <p>{address.address_line1}</p>
      {address.address_line2 && <p>{address.address_line2}</p>}
      <p>{[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}</p>
      <p>{address.country}</p>
      {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
    </div>
  )
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading, isError } = useOrder(Number(id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !data?.order) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/account/orders">Back to orders</Link>
        </Button>
      </div>
    )
  }

  const order = data.order
  const items = order.items ?? []
  const currency = order.currency ?? "USD"

  return (
    <div>
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/account/orders"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Orders
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-lg font-semibold">Order #{order.order_number}</h1>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <OrderStatusBadge status={order.status} />
        <OrderStatusBadge status={order.payment_status} type="payment" />
        <span className="text-xs text-muted-foreground ml-auto">
          Placed {new Date(order.created_at).toLocaleDateString(undefined, {
            year: "numeric", month: "long", day: "numeric",
          })}
        </span>
      </div>

      {/* Items */}
      <div className="border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
        </div>
        <div className="divide-y divide-border">
          {items.map((item) => {
            const imageUrl = toProxiedImageSrc(item.thumbnail_url)
            return (
              <div key={item.id} className="flex items-start gap-4 px-4 py-4">
                {/* Thumbnail */}
                <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.variant_title && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.variant_title}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                </div>

                <div className="text-right shrink-0">
                  <PriceDisplay price={item.total} currency={item.currency ?? currency} size="sm" className="font-medium" />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <PriceDisplay price={item.unit_price} currency={item.currency ?? currency} size="sm" /> each
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals + Addresses */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Totals */}
        <div className="border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <PriceDisplay price={order.subtotal} currency={currency} size="sm" />
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>−<PriceDisplay price={order.discount_amount} currency={currency} size="sm" /></span>
              </div>
            )}
            {Number(order.shipping_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <PriceDisplay price={order.shipping_amount} currency={currency} size="sm" />
              </div>
            )}
            {Number(order.tax_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <PriceDisplay price={order.tax_amount} currency={currency} size="sm" />
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <PriceDisplay price={order.total} currency={currency} size="sm" className="font-semibold" />
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="border border-border rounded-xl p-4 space-y-4">
          {order.shipping_address && (
            <AddressBlock address={order.shipping_address} label="Ship to" />
          )}
          {order.billing_address && (
            <AddressBlock address={order.billing_address} label="Billing" />
          )}
          {!order.shipping_address && !order.billing_address && (
            <p className="text-sm text-muted-foreground">No address on file (digital order).</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  )
}
