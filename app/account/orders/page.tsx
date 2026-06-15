"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/store/order-status-badge"
import { PriceDisplay } from "@/components/store/price-display"
import { useOrders } from "@/lib/hooks/use-orders"

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrders(page)

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const limit = data?.limit ?? 20
  const totalPages = Math.ceil(total / limit)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-xl space-y-3">
          <p>You haven&apos;t placed any orders yet.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Order</span>
              <span className="text-right">Total</span>
              <span className="text-right">Payment</span>
              <span className="text-right">Status</span>
            </div>

            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors items-center"
              >
                <div>
                  <p className="text-sm font-medium">#{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="text-right">
                  <PriceDisplay
                    price={order.total}
                    currency={order.currency}
                    size="sm"
                    className="font-medium"
                  />
                </div>

                <div className="text-right">
                  <OrderStatusBadge status={order.payment_status} type="payment" />
                </div>

                <div className="text-right">
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
