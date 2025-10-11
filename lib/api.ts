/**
 * API Client for Marque Backend
 * Centralized API request handling with error management
 */

import { API_CONFIG } from './config'

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean
  params?: Record<string, string | number | boolean>
}

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Make an API request with automatic error handling and auth token injection
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, params, ...fetchOptions } = options
  
  // Build URL
  let url = `${API_CONFIG.BASE_URL}${endpoint}`
  
  // Add query parameters
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }
  
  // Set default headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  
  // Add any custom headers from options
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers)
  }
  
  // Add auth token if required
  if (requiresAuth) {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new ApiError(401, 'Authentication required')
    }
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Make request
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      mode: 'cors',
      credentials: 'omit',
    })
    
    // Handle errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        
        // Handle validation errors (422)
        if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map((e: any) => e.msg).join(', ')
          throw new ApiError(response.status, messages, errorData.detail)
        }
        
        // Handle regular errors
        throw new ApiError(
          response.status,
          errorData.detail || errorData.message || 'API Error',
          errorData
        )
      }
      
      // Fallback for non-JSON errors
      throw new ApiError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      )
    }
    
    // Parse response
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return response as any
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network errors
    console.error('API Request Failed:', error)
    throw new ApiError(0, 'Network error. Please check your connection.')
  }
}

/**
 * API Methods organized by feature
 */

// Authentication API
export const authApi = {
  sendVerification: (phone: string) =>
    apiRequest<{ success: boolean; message: string; session_id: string }>(
      API_CONFIG.ENDPOINTS.SEND_VERIFICATION,
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    ),
  
  verifyCode: (phone: string, code: string) =>
    apiRequest<{
      success: boolean
      data: {
        access_token: string
        token_type: string
        session_id: string
        expires_in_minutes: number
        market: string
        user: {
          id: string
          phone: string
          full_name?: string
          email?: string
        }
      }
    }>(API_CONFIG.ENDPOINTS.VERIFY_CODE, {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
  
  getProfile: () =>
    apiRequest<{
      id: string
      phone: string
      full_name?: string
      email?: string
      market: string
      created_at: string
    }>(API_CONFIG.ENDPOINTS.USER_PROFILE, { requiresAuth: true }),
  
  logout: () =>
    apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
      requiresAuth: true,
    }),
}

// Products API
export const productsApi = {
  getBestSellers: (limit?: number) =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.PRODUCTS_BEST_SELLERS, {
      params: limit ? { limit } : undefined,
    }),
  
  search: (query: string, filters?: {
    page?: number
    limit?: number
    sort_by?: string
    price_min?: number
    price_max?: number
    sizes?: string[]
    colors?: string[]
    brands?: string[]
    category?: string
    subcategory?: string
  }) =>
    apiRequest<{
      products: any[]
      total: number
      page: number
      limit: number
      total_pages: number
      has_more: boolean
    }>(API_CONFIG.ENDPOINTS.PRODUCTS_SEARCH, {
      params: {
        query,
        ...filters,
        sizes: filters?.sizes?.join(','),
        colors: filters?.colors?.join(','),
        brands: filters?.brands?.join(','),
      } as any,
    }),
  
  getDetail: (slug: string) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCT_DETAIL}/${slug}`),
}

// Categories API
export const categoriesApi = {
  getAll: () =>
    apiRequest<{ categories: any[] }>(API_CONFIG.ENDPOINTS.CATEGORIES),
  
  getDetail: (slug: string) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.CATEGORY_DETAIL}/${slug}`),
  
  getSubcategoryProducts: (
    categorySlug: string,
    subcategorySlug: string,
    filters?: {
      page?: number
      limit?: number
      sort_by?: string
      price_min?: number
      price_max?: number
      sizes?: string
      colors?: string
      brands?: string
    }
  ) =>
    apiRequest(
      `${API_CONFIG.ENDPOINTS.SUBCATEGORY_PRODUCTS.replace('{category_slug}', categorySlug).replace('{subcategory_slug}', subcategorySlug)}`,
      { params: filters as any }
    ),
}

// Cart API
export const cartApi = {
  get: () =>
    apiRequest<{
      id: number
      user_id: string
      items: any[]
      total_items: number
      total_price: number
    }>(API_CONFIG.ENDPOINTS.CART, { requiresAuth: true }),
  
  add: (skuId: number, quantity: number) =>
    apiRequest(API_CONFIG.ENDPOINTS.CART_ITEMS, {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ sku_id: skuId, quantity }),
    }),
  
  updateQuantity: (itemId: number, quantity: number) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.CART_ITEMS}/${itemId}`, {
      method: 'PUT',
      requiresAuth: true,
      params: { quantity },
    }),
  
  remove: (itemId: number) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.CART_ITEMS}/${itemId}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  
  clear: () =>
    apiRequest(API_CONFIG.ENDPOINTS.CART, {
      method: 'DELETE',
      requiresAuth: true,
    }),
}

// Wishlist API
export const wishlistApi = {
  get: () =>
    apiRequest<{
      id: number
      user_id: string
      items: any[]
    }>(API_CONFIG.ENDPOINTS.WISHLIST, { requiresAuth: true }),
  
  add: (productId: number) =>
    apiRequest(API_CONFIG.ENDPOINTS.WISHLIST_ITEMS, {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({ product_id: productId }),
    }),
  
  remove: (productId: number) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.WISHLIST_ITEMS}/${productId}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  
  clear: () =>
    apiRequest(API_CONFIG.ENDPOINTS.WISHLIST, {
      method: 'DELETE',
      requiresAuth: true,
    }),
}

// Banners API
export const bannersApi = {
  getAll: () =>
    apiRequest<{
      hero_banners: any[]
      promo_banners: any[]
      category_banners: any[]
    }>(API_CONFIG.ENDPOINTS.BANNERS),
  
  getHero: () =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.BANNERS_HERO),
  
  getPromo: () =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.BANNERS_PROMO),
}

// Export for convenience
export { ApiError }

