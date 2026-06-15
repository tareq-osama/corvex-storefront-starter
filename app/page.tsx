"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid"
import { useProducts } from "@/lib/hooks/use-products"
import { useCategories } from "@/lib/hooks/use-categories"

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useProducts({ featured: true, limit: 4 })
  const { data: allData, isLoading: allLoading } = useProducts({ limit: 8 })
  const { data: categoriesData } = useCategories()

  const featuredProducts = featuredData?.products ?? []
  const allProducts = allData?.products ?? []
  const categories = categoriesData?.categories?.filter(c => c.product_count > 0) ?? []

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="bg-muted/30 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Welcome to our store
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Browse our collection of products and find something you love.
          </p>
          <div className="mt-8">
            <Link href="/products">
              <Button size="lg" className="h-11 px-8">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {(featuredLoading || featuredProducts.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Featured</h2>
            <Link
              href="/products?featured=true"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          {featuredLoading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <ProductGrid products={featuredProducts} />
          )}
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-6">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-sm"
              >
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {category.product_count} product{category.product_count !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Products</h2>
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        {allLoading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <ProductGrid products={allProducts} />
        )}
      </section>
    </div>
  )
}
