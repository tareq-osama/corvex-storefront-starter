"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PriceDisplay } from "@/components/store/price-display"
import { AddressForm, type AddressData, emptyAddress } from "@/components/store/checkout/address-form"
import { useCartContext } from "@/components/store/cart-context"
import { useSession } from "@/lib/hooks/use-auth"
import { cartKeys } from "@/lib/hooks/use-cart"
import { toProxiedImageSrc } from "@/lib/image"
import { cn } from "@/lib/utils"
import { Check, Truck, CreditCard, ShoppingBag } from "lucide-react"
import type { ShippingMethod, ShippingMethodsResponse, CheckoutResponse } from "@/lib/types/account"

// ─── Step indicator ────────────────────────────────────────────────────────────

const DIGITAL_STEPS = ["Review", "Payment", "Done"]
const PHYSICAL_STEPS = ["Address", "Shipping", "Payment", "Done"]

function CheckoutSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((label, idx) => {
        const done = idx < current
        const active = idx === current
        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                done ? "bg-primary border-primary text-primary-foreground"
                  : active ? "border-primary text-primary bg-background"
                  : "border-border text-muted-foreground bg-background"
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span className={cn("text-[10px] font-medium whitespace-nowrap", active ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn("h-px flex-1 mx-2 mb-4 transition-colors", done ? "bg-primary" : "bg-border")} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Order summary panel ───────────────────────────────────────────────────────

function OrderSummary({ discountAmount = 0, shippingAmount = 0, discountCode, onApplyDiscount }: {
  discountAmount?: number
  shippingAmount?: number
  discountCode?: string | null
  onApplyDiscount?: (code: string, amount: number, codeId: number) => void
}) {
  const { cart } = useCartContext()
  const qc = useQueryClient()
  const [codeInput, setCodeInput] = useState("")
  const [codeError, setCodeError] = useState("")
  const [applying, setApplying] = useState(false)
  const items = cart?.items ?? []
  const total = (cart?.subtotal ?? 0) + shippingAmount - discountAmount

  const applyDiscount = async () => {
    if (!codeInput.trim()) return
    setApplying(true)
    setCodeError("")
    try {
      const res = await fetch('/api/bff/cart/discount', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      })
      const data = await res.json()
      if (!res.ok) { setCodeError(data.error || "Invalid code"); return }
      if (data.cart) qc.setQueryData(cartKeys.detail, data.cart)
      onApplyDiscount?.(data.code, data.discountAmount, data.discountCodeId)
      setCodeInput("")
    } catch {
      setCodeError("Failed to apply code")
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden sticky top-24">
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <h3 className="text-sm font-semibold">Order summary</h3>
      </div>
      <div className="divide-y divide-border/40">
        {items.map((item) => {
          const imageUrl = toProxiedImageSrc(item.product?.thumbnail_url)
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.product?.name ?? `Product #${item.product_id}`}</p>
                {item.variant && <p className="text-[10px] text-muted-foreground">{item.variant.title}</p>}
                <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <PriceDisplay price={item.unit_price * item.quantity} currency={item.currency} size="sm" />
            </div>
          )
        })}
      </div>
      <div className="px-4 py-3 space-y-2 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span>
          <span><PriceDisplay price={cart?.subtotal ?? 0} currency={items[0]?.currency ?? "USD"} size="sm" /></span>
        </div>
        {shippingAmount > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Shipping</span>
            <span><PriceDisplay price={shippingAmount} currency={items[0]?.currency ?? "USD"} size="sm" /></span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
            <span>Discount {discountCode && `(${discountCode})`}</span>
            <span>-<PriceDisplay price={discountAmount} currency={items[0]?.currency ?? "USD"} size="sm" /></span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-1 border-t border-border/60">
          <span className="text-sm font-semibold">Total</span>
          <PriceDisplay price={total} currency={items[0]?.currency ?? "USD"} size="md" className="font-semibold" />
        </div>
      </div>
      {/* Discount code */}
      {onApplyDiscount && !discountCode && (
        <div className="px-4 pb-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Discount code</Label>
          <div className="flex gap-2">
            <Input
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError("") }}
              placeholder="PROMO20"
              className="h-8 text-xs flex-1"
            />
            <Button size="sm" variant="outline" onClick={applyDiscount} disabled={applying} className="h-8 text-xs">
              {applying ? "..." : "Apply"}
            </Button>
          </div>
          {codeError && <p className="text-xs text-destructive">{codeError}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Stripe Payment Form ───────────────────────────────────────────────────────

function StripePaymentForm({
  onSuccess,
  onBack,
}: {
  onSuccess: (paymentIntentId: string) => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setError("")
    setProcessing(true)
    try {
      const { error: submitError } = await elements.submit()
      if (submitError) { setError(submitError.message ?? "Payment failed"); setProcessing(false); return }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })

      if (confirmError) {
        setError(confirmError.message ?? "Payment failed")
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack} disabled={processing}>Back</Button>
        <Button onClick={handleSubmit} disabled={processing || !stripe} className="min-w-[140px]">
          {processing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </span>
          ) : "Place order"}
        </Button>
      </div>
    </div>
  )
}

// ─── Main checkout page ────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { cart, isLoading } = useCartContext()
  const { data: session, isLoading: sessionLoading } = useSession()

  const authChecking = sessionLoading || !session?.member

  // Address state
  const [address, setAddress] = useState<AddressData>(emptyAddress)
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})

  // Shipping state
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null)

  // Discount state
  const [discountCodeId, setDiscountCodeId] = useState<number | null>(null)
  const [discountCode, setDiscountCode] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Checkout state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [stripePromise] = useState<Promise<Stripe | null> | null>(() => {
    if (typeof window === "undefined") return null
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    return key ? loadStripe(key) : null
  })
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState("")

  const items = cart?.items ?? []
  const isEmpty = items.length === 0
  const hasPhysical = items.some((i) => Boolean((i.product as { requires_shipping?: boolean } | undefined)?.requires_shipping))
  const steps = hasPhysical ? PHYSICAL_STEPS : DIGITAL_STEPS

  // step index mapping — stepKey always starts at first logical step
  const [stepKey, setStepKey] = useState<"address" | "shipping" | "payment" | "done">("payment")
  const stepMap = hasPhysical
    ? { address: 0, shipping: 1, payment: 2, done: 3 }
    : { payment: 0, done: 1 }
  const currentStepIdx = (stepMap as Record<string, number>)[stepKey] ?? 0

  // When cart loads, initialize the correct starting step
  const [stepInitialized, setStepInitialized] = useState(false)
  if (!isLoading && !stepInitialized) {
    setStepInitialized(true)
    setStepKey(hasPhysical ? "address" : "payment")
  }

  const shippingAmount = useMemo(() => {
    if (!selectedMethodId) return 0
    const method = shippingMethods.find((m) => m.id === selectedMethodId)
    if (!method) return 0
    if (method.free_above !== null && (cart?.subtotal ?? 0) >= method.free_above) return 0
    return method.price
  }, [selectedMethodId, shippingMethods, cart?.subtotal])

  useEffect(() => {
    if (!sessionLoading && !session?.member) {
      router.replace('/login?next=/checkout')
    }
  }, [sessionLoading, session, router])

  useEffect(() => {
    if (hasPhysical) {
      fetch('/api/bff/checkout/shipping-methods')
        .then((r) => r.ok ? r.json() : null)
        .then((d: ShippingMethodsResponse | null) => {
          if (d?.methods?.length) {
            setShippingMethods(d.methods)
            setSelectedMethodId(d.methods[0].id)
          }
        })
        .catch(() => {})
    }
  }, [hasPhysical])

  // ── Validate address ─────────────────────────────────────────────────────────

  const validateAddress = () => {
    const errs: Record<string, string> = {}
    if (!address.address_line1.trim()) errs.address_line1 = "Required"
    if (!address.city.trim()) errs.city = "Required"
    if (!address.postal_code.trim()) errs.postal_code = "Required"
    if (!address.country.trim()) errs.country = "Required"
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Create order + get Stripe client secret ──────────────────────────────────

  const proceedToPayment = useCallback(async () => {
    setSubmitting(true)
    setCheckoutError("")
    try {
      const res = await fetch('/api/bff/checkout', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: hasPhysical ? address : null,
          shippingMethodId: hasPhysical ? selectedMethodId : null,
          discountCodeId,
        }),
      })
      const data: CheckoutResponse & { error?: string } = await res.json()
      if (!res.ok) { setCheckoutError(data.error || "Checkout failed"); return }

      setOrderId(data.orderId)
      setOrderNumber(data.orderNumber)

      if (data.free) {
        // Free order — go straight to done
        setStepKey("done")
        queryClient.invalidateQueries({ queryKey: cartKeys.all })
        return
      }

      setClientSecret(data.clientSecret ?? null)
      setStepKey("payment")
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Checkout failed")
    } finally {
      setSubmitting(false)
    }
  }, [address, hasPhysical, selectedMethodId, discountCodeId, queryClient])

  // ── Render guards ────────────────────────────────────────────────────────────

  if (isLoading || authChecking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isEmpty && stepKey !== "done") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <Button variant="outline" asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    )
  }

  const stripeOptions: StripeElementsOptions = {
    clientSecret: clientSecret ?? undefined,
    appearance: { theme: "stripe", variables: { colorPrimary: "hsl(var(--primary))" } },
  }

  // ── Step content ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-foreground">Cart</Link>
        <span>/</span>
        <span className="text-foreground">Checkout</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left: Steps */}
        <div>
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <CheckoutSteps steps={steps} current={currentStepIdx} />

          {/* Address step */}
          {stepKey === "address" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Shipping address
              </h2>
              <AddressForm data={address} onChange={(d) => setAddress((prev) => ({ ...prev, ...d }))} errors={addressErrors} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="save-addr" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-primary" />
                <label htmlFor="save-addr" className="text-sm text-muted-foreground cursor-pointer">Save address for future orders</label>
              </div>
              {checkoutError && <p className="text-sm text-destructive">{checkoutError}</p>}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => router.push('/cart')}>Back to cart</Button>
                <Button onClick={() => { if (validateAddress()) setStepKey("shipping") }}>Continue to shipping</Button>
              </div>
            </div>
          )}

          {/* Shipping step */}
          {stepKey === "shipping" && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Shipping method
              </h2>
              {shippingMethods.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No shipping methods available.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Contact the store for shipping options.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shippingMethods.map((method) => {
                    const isFree = method.free_above !== null && (cart?.subtotal ?? 0) >= method.free_above
                    const price = isFree ? 0 : method.price
                    return (
                      <label
                        key={method.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors",
                          selectedMethodId === method.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <input type="radio" checked={selectedMethodId === method.id} onChange={() => setSelectedMethodId(method.id)} className="accent-primary h-4 w-4" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{method.name}</p>
                          {method.description && <p className="text-xs text-muted-foreground">{method.description}</p>}
                          {(method.min_delivery_days || method.max_delivery_days) && (
                            <p className="text-xs text-muted-foreground">
                              {method.min_delivery_days}–{method.max_delivery_days} business days
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold">
                          {isFree ? <span className="text-green-600 dark:text-green-400">Free</span> : `$${price.toFixed(2)}`}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStepKey("address")}>Back</Button>
                <Button onClick={proceedToPayment} disabled={submitting || !selectedMethodId}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating order...
                    </span>
                  ) : "Continue to payment"}
                </Button>
              </div>
            </div>
          )}

          {/* Payment step — digital-only shortcut */}
          {stepKey === "payment" && !clientSecret && !hasPhysical && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment
              </h2>
              {checkoutError && <p className="text-sm text-destructive">{checkoutError}</p>}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => router.push('/cart')}>Back to cart</Button>
                <Button onClick={proceedToPayment} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating order...
                    </span>
                  ) : "Review & Pay"}
                </Button>
              </div>
            </div>
          )}

          {/* Stripe Elements payment */}
          {stepKey === "payment" && clientSecret && stripePromise && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment
              </h2>
              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripePaymentForm
                  onSuccess={() => {
                    setStepKey("done")
                    queryClient.invalidateQueries({ queryKey: cartKeys.all })
                  }}
                  onBack={() => {
                    if (hasPhysical) {
                      setStepKey("shipping")
                    } else {
                      setClientSecret(null)
                      setStepKey("payment")
                    }
                  }}
                />
              </Elements>
            </div>
          )}

          {/* Done / confirmation */}
          {stepKey === "done" && (
            <div className="text-center space-y-6 py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Order confirmed!</h2>
                {orderNumber && (
                  <p className="text-muted-foreground text-sm">
                    Order <span className="font-semibold text-foreground">{orderNumber}</span> has been placed.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">You&apos;ll receive a confirmation soon.</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {orderId && (
                  <Button variant="outline" asChild>
                    <Link href={`/account/orders/${orderId}`}>View order</Link>
                  </Button>
                )}
                <Button asChild>
                  <Link href="/products">Continue shopping</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order summary */}
        {stepKey !== "done" && (
          <div>
            <OrderSummary
              discountAmount={discountAmount}
              shippingAmount={shippingAmount}
              discountCode={discountCode}
              onApplyDiscount={stepKey !== "payment" || !clientSecret ? (code, amount, codeId) => {
                setDiscountCode(code)
                setDiscountAmount(amount)
                setDiscountCodeId(codeId)
              } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}
