// ─── CMS Collections & Items (headless storefront content) ──────────────────

export interface CmsFieldDefinition {
  id: string
  name: string
  type: string
  required?: boolean
  order: number
  options?: string[]
  collectionId?: number
  displayField?: string
}

export interface CmsCollectionSummary {
  id: number
  name: string
  slug: string
  thumbnail_url: string | null
  field_schema: CmsFieldDefinition[]
}

export interface CmsItemSummary {
  id: number
  title: string
  slug: string
  description: string | null
  content: { fields?: Record<string, unknown> } | null
  seo_meta: { title?: string; description?: string } | null
  published_at: string | null
  created_at: string
}

export interface CmsItemDetail extends CmsItemSummary {
  collection: CmsCollectionSummary
}

export interface CmsCollectionResponse {
  collection: CmsCollectionSummary
  items: CmsItemSummary[]
  total: number
  page: number
  limit: number
}

export interface CmsItemResponse {
  item: CmsItemDetail
}
