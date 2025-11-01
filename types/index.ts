// Global type definitions

export interface User {
  id: string
  name?: string
  full_name?: string
  phone?: string
  email?: string
}

export interface SKU {
  id: number
  sku_code: string
  size: string
  color: string
  price: number
  original_price?: number
  stock: number
  variant_image?: string | null  // NEW: Image for this specific variant
}

export interface CartItem {
  id: string | number
  name: string
  price: number
  originalPrice?: number
  brand: string
  image: string
  quantity: number
  size?: string
  color?: string
  sku_id?: number
}

export interface Product {
  id: string | number
  name: string
  brand: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  images?: string[]
  category: string
  subcategory?: string
  sizes?: string[]
  colors?: string[]
  rating?: number
  reviews?: number
  salesCount: number
  inStock?: boolean
  description?: string
  features?: string[]
  skus?: SKU[]  // NEW: Array of SKU variants
}

export interface Address {
  id: number
  label: string
  address: string
  city?: string
}

export interface PaymentMethod {
  id: number
  type: string
  number: string
  name: string
}

export interface Order {
  id: string
  date: string
  deliveryDate: string
  status: string
  statusColor: string
  total: string
  isActive: boolean
  items: {
    id: number
    name: string
    image: string
    size: string
    color: string
  }[]
  canReview: boolean
}

export interface ReviewPhoto {
  id: number
  file: File
  url: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  access_token?: string
  token?: string
  token_type?: string
  session_id?: string
  expires_in_minutes?: number
  market?: string
  user?: User
  id?: string
  name?: string
  full_name?: string
  phone?: string
  email?: string
}
