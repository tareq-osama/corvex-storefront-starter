"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageGallery } from "@/components/store/image-gallery"
import { PriceDisplay } from "@/components/store/price-display"
import { ProductGrid } from "@/components/store/product-grid"
import { VariantSelector } from "@/components/store/variant-selector"
import { useProduct } from "@/lib/hooks/use-products"
import { useCartContext } from "@/components/store/cart-context"
import { Download, Unlock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductVariant } from "@/lib/types/store"
import type { DownloadFile, MyDownloadsResponse } from "@/lib/types/account"

const TYPE_LABELS: Record<string, string> = {
  digital: "Digital",
  package: "Package",
  gated_content: "Gated Content",
  physical: "Physical",
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = use(params)
  const router = useRouter()
  const { data, isLoading, error } = useProduct(handle)
  const { addItem, isAdding } = useCartContext()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  // Purchase / download state
  const [purchased, setPurchased] = useState<boolean | null>(null)
  const [downloadFiles, setDownloadFiles] = useState<DownloadFile[]>([])

  // Claim state (for free digital products)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  useEffect(() => {
    if (!handle) return
    fetch(`/api/bff/products/${handle}/my-downloads`)
      .then(r => r.ok ? r.json() : null)
      .then((d: MyDownloadsResponse | null) => {
        if (d?.purchased) {
          setPurchased(true)
          setDownloadFiles(d.files ?? [])
        } else {
          setPurchased(false)
        }
      })
      .catch(() => setPurchased(false))
  }, [handle])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-32 mt-6" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This product doesn&apos;t exist or is no longer available.
        </p>
        <Link href="/products">
          <Button variant="outline" className="mt-6">Browse Products</Button>
        </Link>
      </div>
    )
  }

  const { product, relatedProducts } = data
  const hasVariants = (product.variants?.length ?? 0) > 0
  const optionDefs = product.option_definitions ?? []
  const isFree = product.is_free || product.price === 0
  const isDigital = product.type === "digital" || product.type === "gated_content"

  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const displayCompareAt = selectedVariant ? selectedVariant.compare_at_price : product.compare_at_price
  const displayCurrency = selectedVariant ? selectedVariant.currency : product.currency

  // Collect variant images into the gallery so ImageGallery can find them
  const variantImages = (product.variants ?? [])
    .filter((v) => v.image_url)
    .map((v) => ({ url: v.image_url as string, alt: v.title }))
  const galleryImages = [...(product.images ?? []), ...variantImages]
  const selectedVariantImageUrl = selectedVariant?.image_url ?? null

  const isOutOfStock = selectedVariant
    ? selectedVariant.inventory_quantity !== null && selectedVariant.inventory_quantity <= 0
    : false

  const needsVariantSelection = hasVariants && !selectedVariant

  // For free digital products: claim directly without checkout
  const handleClaim = async () => {
    setClaimError(null)
    setIsClaiming(true)
    try {
      const res = await fetch(`/api/bff/products/${handle}/claim`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.status === 401) {
        // Not logged in — redirect to login
        router.push(`/login?next=${encodeURIComponent(`/products/${handle}`)}`)
        return
      }
      if (!res.ok) {
        setClaimError(data.error ?? "Failed to claim product")
        return
      }
      setPurchased(true)
      setDownloadFiles(data.files ?? [])
    } catch {
      setClaimError("Something went wrong. Please try again.")
    } finally {
      setIsClaiming(false)
    }
  }

  const handleAddToCart = async () => {
    setAddError(null)
    const result = await addItem(product.id, selectedVariant?.id ?? null, 1)
    if (result.error) {
      setAddError(result.error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <span className="text-foreground truncate">{product.name}</span>
      </nav>

      {/* Product */}
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Left: Gallery */}
        <ImageGallery
          images={galleryImages}
          thumbnail={product.thumbnail_url}
          selectedImageUrl={selectedVariantImageUrl}
        />

        {/* Right: Info */}
        <div className="space-y-6">
          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.categories.map((cat) => (
                <Link key={cat.id} href={`/categories/${cat.slug}`}>
                  <Badge variant="secondary" className="text-xs font-normal cursor-pointer hover:bg-secondary/80">
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.name}</h1>
            {product.subtitle && (
              <p className="text-muted-foreground mt-1">{product.subtitle}</p>
            )}
          </div>

          {/* Price */}
          <PriceDisplay
            price={displayPrice}
            compareAtPrice={displayCompareAt}
            currency={displayCurrency}
            isFree={isFree}
            size="lg"
          />

          {/* Type badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {TYPE_LABELS[product.type] ?? product.type}
            </Badge>
            {product.requires_shipping && (
              <Badge variant="outline" className="text-xs font-normal">Shipping required</Badge>
            )}
          </div>

          {/* Variant Selector */}
          {hasVariants && (
            <VariantSelector
              optionDefinitions={optionDefs}
              variants={product.variants!}
              selectedVariant={selectedVariant}
              onSelectVariant={setSelectedVariant}
            />
          )}

          {/* ── Already purchased: show downloads ─────────────────────── */}
          {purchased && isDigital && (
            <div className="rounded-xl border border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  You own this product
                </p>
              </div>
              {downloadFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No downloadable files attached yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {downloadFiles.map((file, i) => (
                    <a
                      key={i}
                      href={file.download_url}
                      download={file.name}
                      className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-700/50 bg-white dark:bg-green-900/30 px-3 py-2.5 hover:bg-green-50 dark:hover:bg-green-800/30 transition-colors group"
                    >
                      <Download className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        {file.file_size && (
                          <p className="text-[10px] text-muted-foreground">{formatBytes(file.file_size)}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-medium shrink-0 group-hover:underline">
                        Download
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CTA: Not yet purchased ─────────────────────────────────── */}
          {!purchased && (
            <div className="space-y-2">
              {/* Free digital: single-click claim */}
              {isFree && isDigital ? (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className={cn(
                    "w-full h-12 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isClaiming ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Claiming…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get for Free
                    </>
                  )}
                </button>
              ) : (
                /* Paid or physical: add to cart */
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock || needsVariantSelection}
                  className={cn(
                    "w-full h-12 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isAdding ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Adding…
                    </>
                  ) : isOutOfStock ? (
                    "Out of stock"
                  ) : needsVariantSelection ? (
                    "Select options"
                  ) : (
                    `Add to cart — ${new Intl.NumberFormat("en-US", { style: "currency", currency: displayCurrency }).format(displayPrice)}`
                  )}
                </button>
              )}

              {(addError || claimError) && (
                <p className="text-xs text-destructive text-center">{addError ?? claimError}</p>
              )}

              <p className="text-[11px] text-center text-muted-foreground">
                {isFree && isDigital
                  ? "Free to download — no credit card required"
                  : "Secure checkout powered by Stripe"}
              </p>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="pt-6 border-t border-border/40">
              <h2 className="text-sm font-semibold mb-3">Description</h2>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-4">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} className="lg:grid-cols-4" />
        </section>
      )}
    </div>
  )
}
