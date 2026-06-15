"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay } from "./price-display"
import { toProxiedImageSrc } from "@/lib/image"
import type { StoreProduct } from "@/lib/types/store"

interface ProductCardProps {
  product: StoreProduct
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const imageUrl = toProxiedImageSrc(product.thumbnail_url)

  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn(
        "group block rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:border-border hover:shadow-md",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-muted/30 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="h-10 w-10 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {product.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{product.subtitle}</p>
        )}
        <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compare_at_price}
            currency={product.currency}
            isFree={product.is_free}
            size="sm"
          />
          {product.requires_shipping && (
            <Badge variant="outline" className="text-[10px] font-normal">Physical</Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
