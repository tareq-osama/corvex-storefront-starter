"use client"

import { Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid"
import { useProducts } from "@/lib/hooks/use-products"
import { useCategories } from "@/lib/hooks/use-categories"
import type { ProductSortOption } from "@/lib/types/store"

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A-Z" },
  { value: "name_desc", label: "Name: Z-A" },
]

const SELECT_CLASS =
  "h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  )
}

function ProductsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentSort = (searchParams.get("sort") as ProductSortOption) || "newest"
  const currentCategory = searchParams.get("category") || undefined
  const currentPage = parseInt(searchParams.get("page") || "1")
  const featured = searchParams.get("featured") === "true" || undefined

  const { data, isLoading } = useProducts({
    sort: currentSort,
    category: currentCategory,
    page: currentPage,
    limit: 20,
    featured,
  })

  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.categories?.filter(c => c.product_count > 0) ?? []

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset page when changing filters
    if (key !== "page") params.delete("page")
    router.push(`/products?${params.toString()}`)
  }, [searchParams, router])

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {featured ? "Featured Products" : currentCategory ? "Products" : "All Products"}
        </h1>
        {total > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {total} product{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={currentCategory || "all"}
            onChange={e => updateParam("category", e.target.value === "all" ? null : e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug}>
                {cat.name} ({cat.product_count})
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={currentSort}
          onChange={e => updateParam("sort", e.target.value)}
          className={SELECT_CLASS}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {(currentCategory || featured) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => router.push("/products")}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Product grid */}
      {isLoading ? (
        <ProductGridSkeleton count={12} />
      ) : (
        <ProductGrid products={products} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParam("page", String(currentPage - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => updateParam("page", String(currentPage + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
