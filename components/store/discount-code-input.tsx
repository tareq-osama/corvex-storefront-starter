"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Tag, CheckCircle } from "lucide-react"
import { cartKeys } from "@/lib/hooks/use-cart"
import { cn } from "@/lib/utils"
import type { Cart } from "@/lib/types/store"

interface DiscountCodeInputProps {
  /** Currently applied code (read from cart object) */
  appliedCode?: string | null
  className?: string
}

export function DiscountCodeInput({
  appliedCode,
  className,
}: DiscountCodeInputProps) {
  const qc = useQueryClient()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justApplied, setJustApplied] = useState(false)

  function updateCartCache(cart: Cart) {
    qc.setQueryData(cartKeys.detail, cart)
  }

  function invalidateCart() {
    qc.invalidateQueries({ queryKey: cartKeys.all })
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    const code = input.trim().toUpperCase()
    if (!code) return

    setIsLoading(true)
    setError(null)
    setJustApplied(false)

    try {
      const res = await fetch('/api/bff/cart/discount', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Invalid discount code")
      } else {
        setInput("")
        setJustApplied(true)
        // Immediately update the cart cache with the full returned cart
        if (data.cart) {
          updateCartCache(data.cart)
        } else {
          invalidateCart()
        }
        setTimeout(() => setJustApplied(false), 2000)
      }
    } catch {
      setError("Failed to apply code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemove() {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bff/cart/discount', { method: "DELETE" })
      const data = await res.json()
      if (data.cart) {
        updateCartCache(data.cart)
      } else {
        invalidateCart()
      }
    } catch {
      setError("Failed to remove code.")
    } finally {
      setIsLoading(false)
    }
  }

  if (appliedCode) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md bg-green-500/8 border border-green-500/20 px-2.5 py-2 text-sm", className)}>
        <Tag className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
        <span className="font-medium text-green-700 dark:text-green-400 font-mono">{appliedCode}</span>
        <span className="text-muted-foreground text-xs">applied</span>
        <button
          onClick={handleRemove}
          disabled={isLoading}
          className="ml-auto text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          aria-label="Remove discount code"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className={cn("space-y-1.5", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase())
              if (error) setError(null)
            }}
            placeholder="Discount code"
            className={cn(
              "h-9 text-sm font-mono pr-8",
              error && "border-destructive ring-1 ring-destructive/30",
              justApplied && "border-green-500 ring-1 ring-green-500/30"
            )}
            autoComplete="off"
          />
          {justApplied && (
            <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 min-w-[60px]"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent inline-block" />
          ) : "Apply"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </form>
  )
}
