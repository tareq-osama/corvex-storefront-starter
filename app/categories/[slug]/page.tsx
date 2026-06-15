"use client"

import { Suspense, use } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid"
import { useCategory } from "@/lib/hooks/use-categories"
import type { ProductSortOption } from "@/lib/types/store"

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A-Z" },
]

const SELECT_CLASS =
  "h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  return (
    <Suspense fallback={null}>
      <CategoryPageContent slug={slug} />
    </Suspense>
  )
}

function CategoryPageContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentSort = (searchParams.get("sort") as ProductSortOption) || "newest"
  const currentPage = parseInt(searchParams.get("page") || "1")

  const { data, isLoading, error } = useCategory(slug, {
    sort: currentSort,
    page: currentPage,
  })

  if (error || (!isLoading && !data?.category)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-xl font-semibold">Category not found</h1>
        <Link href="/products">
          <Button variant="outline" className="mt-6">Browse Products</Button>
        </Link>
      </div>
    )
  }

  const category = data?.category
  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / (data?.pageSize ?? 20))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        <span>/</span>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="text-foreground">{category?.name}</span>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{category?.name}</h1>
            {category?.description && (
              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {total} product{total !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={currentSort}
          onChange={e => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("sort", e.target.value)
            params.delete("page")
            router.push(`/categories/${slug}?${params.toString()}`)
          }}
          className={SELECT_CLASS}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : (
        <ProductGrid products={products} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <Button
            variant="outline" size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(currentPage - 1))
              router.push(`/categories/${slug}?${params.toString()}`)
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(currentPage + 1))
              router.push(`/categories/${slug}?${params.toString()}`)
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
