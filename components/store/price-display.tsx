"use client"

import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  compareAtPrice?: number | null
  currency: string
  isFree?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceDisplay({
  price,
  compareAtPrice,
  currency,
  isFree,
  size = "md",
  className,
}: PriceDisplayProps) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  })

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  }

  if (isFree || price === 0) {
    return (
      <span className={cn(sizeClasses[size], "font-semibold text-green-600 dark:text-green-400", className)}>
        Free
      </span>
    )
  }

  const hasDiscount = compareAtPrice && compareAtPrice > price

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn(sizeClasses[size], "font-semibold")}>
        {formatter.format(price)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatter.format(compareAtPrice)}
        </span>
      )}
    </span>
  )
}
