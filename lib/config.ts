// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://marquebackend-production.up.railway.app/api/v1',
  ENDPOINTS: {
    // Authentication
    SEND_VERIFICATION: '/auth/send-verification',
    VERIFY_CODE: '/auth/verify-code',
    LOGOUT: '/auth/logout',
    USER_PROFILE: '/auth/profile',
    USER_SESSIONS: '/auth/sessions',
    
    // Products
    PRODUCTS: '/products',
    PRODUCTS_SEARCH: '/products/search',
    PRODUCTS_BEST_SELLERS: '/products/best-sellers',
    PRODUCT_DETAIL: '/products',
    
    // Categories
    CATEGORIES: '/categories',
    CATEGORY_DETAIL: '/categories',
    SUBCATEGORY_PRODUCTS: '/categories',
    
    // Cart
    CART: '/cart',
    CART_ITEMS: '/cart/items',
    
    // Wishlist
    WISHLIST: '/wishlist',
    WISHLIST_ITEMS: '/wishlist/items',
    
    // Banners (no trailing slash to avoid redirects)
    BANNERS: '/banners',
    BANNERS_SALE: '/banners/sale',
    BANNERS_MODEL: '/banners/model',
    BANNERS_ADMIN_ALL: '/banners/admin/all',
    
    // Upload
    UPLOAD_IMAGE: '/upload/image',
  }
} as const

// App Configuration
export const APP_CONFIG = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://marque.website',
  APP_NAME: 'MARQUE',
  APP_DESCRIPTION: 'Fashion E-commerce Platform',
  DEFAULT_CURRENCY: 'сом',
  DEFAULT_LANGUAGE: 'ru',
  PAGINATION_LIMIT: 20,
} as const

// Cart Configuration
export const CART_CONFIG = {
  DELIVERY_COST: 350,
  TAX_RATE: 0.12,
  FREE_DELIVERY_THRESHOLD: 5000,
} as const

// Phone number validation
export const PHONE_CONFIG = {
  COUNTRY_CODES: [
    { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55", length: 9 },
    { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567", length: 10 }
  ]
} as const
