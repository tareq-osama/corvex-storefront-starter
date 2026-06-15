"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid"
import { useProductSearch } from "@/lib/hooks/use-products"

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading } = useProductSearch(debouncedQuery)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Search</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Search Products</h1>

      {/* Search input */}
      <div className="max-w-md mb-8">
        <Input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="h-10"
          autoFocus
        />
      </div>

      {/* Results */}
      {debouncedQuery.length === 0 ? (
        <p className="text-muted-foreground text-sm">Type to search for products.</p>
      ) : isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            {data?.total ?? 0} result{(data?.total ?? 0) !== 1 ? "s" : ""} for &quot;{debouncedQuery}&quot;
          </p>
          <ProductGrid products={data?.products ?? []} />
        </>
      )}
    </div>
  )
}
