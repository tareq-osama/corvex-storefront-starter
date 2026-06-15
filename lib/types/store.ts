// ─── Product Types ───────────────────────────────────────────────────────────

export type ProductType = 'digital' | 'package' | 'gated_content' | 'physical'
export type ProductStatus = 'draft' | 'active' | 'archived'

export interface StoreProduct {
  id: number
  company_id: number
  name: string
  handle: string
  subtitle: string | null
  description: string | null
  type: ProductType
  status: ProductStatus
  thumbnail_url: string | null
  price: number
  compare_at_price: number | null
  currency: string
  is_free: boolean
  is_featured: boolean
  requires_shipping: boolean
  tags: string[]
  sort_order: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Joined
  images?: ProductImage[]
  categories?: ProductCategory[]
  variants?: ProductVariant[]
  option_definitions?: ProductOptionDefinition[]
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  alt: string | null
  sort_order: number
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: number
  company_id: number
  name: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  parent_id: number | null
  sort_order: number
  is_active: boolean
  created_at: string
  // Computed
  product_count?: number
}

// ─── Variants ────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: number
  product_id: number
  company_id: number
  title: string
  sku: string | null
  price: number
  compare_at_price: number | null
  currency: string
  inventory_quantity: number | null // null = unlimited
  options: Record<string, string>   // e.g. { "Size": "L", "Color": "Blue" }
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface ProductOptionDefinition {
  id: number
  product_id: number
  name: string           // e.g. "Size", "Color"
  values: string[]       // e.g. ["S", "M", "L", "XL"]
  sort_order: number
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface Cart {
  id: string  // uuid
  company_id: number
  member_id: number | null
  session_token: string | null
  items: CartItem[]
  subtotal: number
  discount_amount: number
  total: number
  item_count: number
  discount_code_id?: number | null
  discount_code?: string | null
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: number
  cart_id: string
  product_id: number
  variant_id: number | null
  quantity: number
  unit_price: number
  currency: string
  created_at: string
  updated_at: string
  // Joined snapshots for display
  product?: {
    id: number
    name: string
    handle: string
    thumbnail_url: string | null
    type: ProductType
  }
  variant?: {
    id: number
    title: string
    options: Record<string, string>
  } | null
}

// ─── Filters & Pagination ────────────────────────────────────────────────────

export type ProductSortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'

export interface StoreProductFilters {
  category?: string        // category slug
  search?: string
  sort?: ProductSortOption
  page?: number
  limit?: number
  featured?: boolean
  type?: ProductType
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Store API Response Types ────────────────────────────────────────────────

export interface StoreProductListResponse {
  products: StoreProduct[]
  total: number
  page: number
  pageSize: number
}

export interface StoreProductDetailResponse {
  product: StoreProduct & {
    images: ProductImage[]
    categories: ProductCategory[]
  }
  relatedProducts: StoreProduct[]
}

export interface StoreCategoryListResponse {
  categories: (ProductCategory & { product_count: number })[]
}

export interface StoreSearchResponse {
  products: StoreProduct[]
  total: number
}
