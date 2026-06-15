// ─── Member / Auth ───────────────────────────────────────────────────────────

export interface Member {
  id: number
  email: string
  name?: string
  full_name?: string | null
  status?: string
  created_at?: string
}

export interface AuthResponse {
  member: Member
  session_token: string
  expires_at: string
}

// ─── Shipping Addresses ──────────────────────────────────────────────────────

export interface ShippingAddress {
  id: number
  member_id: number
  company_id: number | null
  label: string | null
  first_name: string | null
  last_name: string | null
  address_line1: string
  address_line2: string | null
  city: string
  state: string | null
  postal_code: string
  country: string
  phone: string | null
  is_default: boolean
  created_at: string
}

export type ShippingAddressInput = Omit<ShippingAddress, 'id' | 'member_id' | 'company_id' | 'created_at'>

export interface ShippingAddressSnapshot {
  first_name?: string
  last_name?: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
  phone?: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface StoreOrderItem {
  id: number
  order_id: number
  product_id: number | null
  variant_id: number | null
  title: string
  variant_title: string | null
  quantity: number
  unit_price: number
  total: number
  currency: string
  thumbnail_url: string | null
}

export interface StoreOrder {
  id: number
  company_id: number
  member_id: number
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  subtotal: number
  discount_amount: number
  shipping_amount: number
  tax_amount: number
  total: number
  currency: string
  discount_code_id: number | null
  shipping_address: ShippingAddressSnapshot | null
  billing_address: ShippingAddressSnapshot | null
  shipping_method: string | null
  items?: StoreOrderItem[]
  created_at: string
  updated_at: string
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutRequest {
  shippingAddress?: ShippingAddressSnapshot | null
  shippingMethodId?: number | null
  discountCodeId?: number | null
}

export interface CheckoutResponse {
  orderId: number
  orderNumber: string
  free?: boolean
  clientSecret?: string
  total?: number
  currency?: string
}

// ─── Shipping Methods ────────────────────────────────────────────────────────

export interface ShippingMethod {
  id: number
  name: string
  description: string | null
  price: number
  currency: string
  min_delivery_days: number | null
  max_delivery_days: number | null
  free_above: number | null
}

export interface ShippingMethodsResponse {
  methods: ShippingMethod[]
}

// ─── Purchases (digital downloads) ──────────────────────────────────────────

export interface Purchase {
  id: number
  product_id: number
  purchased_at: string
  status: string
  access_expires_at: string | null
  product: {
    name: string
    thumbnail_url: string | null
    handle: string
    type: string
  } | null
  files: DownloadFile[]
}

export interface DownloadFile {
  name: string
  download_url: string
  mime_type: string
  file_size: number | null
}

export type MyDownloadsResponse =
  | { purchased: false; expired?: boolean }
  | { purchased: true; files: DownloadFile[] }

export interface ClaimResponse {
  success: true
  files: DownloadFile[]
}
