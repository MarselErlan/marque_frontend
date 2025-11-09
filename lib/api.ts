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
    headers['Authorization'] = `Token ${token}`
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
      const contentType = typeof response.headers?.get === 'function'
        ? response.headers.get('content-type')
        : undefined
      
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
    const contentType = typeof response.headers?.get === 'function'
      ? response.headers.get('content-type')
      : undefined
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
    apiRequest<{ 
      success: boolean
      message: string
      phone: string
      market: string
      language: string
      expires_in_minutes: number
    }>(
      API_CONFIG.ENDPOINTS.SEND_VERIFICATION,
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    ),
  
  verifyCode: (phone: string, verification_code: string) =>
    apiRequest<{
      access_token: string
      token_type: string
      user: {
        id: string
        name: string
        phone: string
        is_active: boolean
        is_verified: boolean
      }
      market: string
      is_new_user: boolean
    }>(API_CONFIG.ENDPOINTS.VERIFY_CODE, {
      method: 'POST',
      body: JSON.stringify({ phone, verification_code }),
    }),
  
  getProfile: () =>
    apiRequest<{
      id: string
      phone: string
      formatted_phone: string
      name: string
      full_name: string | null
      profile_image_url: string | null
      is_active: boolean
      is_verified: boolean
      market: string
      language: string
      country: string
      currency: string
      currency_code: string
      last_login: string
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
  getAll: (limit?: number) =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.PRODUCTS, {
      params: limit ? { limit } : undefined,
    }),
  
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
  
  getSubcategories: (categorySlug: string) =>
    apiRequest<{ subcategories: any[] }>(`${API_CONFIG.ENDPOINTS.CATEGORIES}/${categorySlug}/subcategories`),
  
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
// Cart API (Stateless - requires user_id as integer)
export const cartApi = {
  get: (userId: number) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
      total_items: number
      total_price: number
    }>(API_CONFIG.ENDPOINTS.CART_GET, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
  
  add: (userId: number, skuId: number, quantity: number = 1) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
      total_items: number
      total_price: number
    }>(API_CONFIG.ENDPOINTS.CART_ADD, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, sku_id: skuId, quantity }),
    }),
  
  updateQuantity: (userId: number, cartItemId: number, quantity: number) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
      total_items: number
      total_price: number
    }>(API_CONFIG.ENDPOINTS.CART_UPDATE, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, cart_item_id: cartItemId, quantity }),
    }),
  
  remove: (userId: number, cartItemId: number) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
      total_items: number
      total_price: number
    }>(API_CONFIG.ENDPOINTS.CART_REMOVE, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, cart_item_id: cartItemId }),
    }),
  
  clear: (userId: number) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
      total_items: number
      total_price: number
    }>(API_CONFIG.ENDPOINTS.CART_CLEAR, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
}

// Wishlist API (Stateless - requires user_id as integer)
export const wishlistApi = {
  get: (userId: number) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
    }>(API_CONFIG.ENDPOINTS.WISHLIST_GET, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
  
  add: (userId: number, productId: number) =>
    apiRequest<{
      id: number
      user_id: string
      items: any[]
    }>(API_CONFIG.ENDPOINTS.WISHLIST_ADD, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, product_id: productId }),
    }),
  
  remove: (userId: number, productId: number) =>
    apiRequest<{
      id: number
      user_id: number
      items: any[]
    }>(API_CONFIG.ENDPOINTS.WISHLIST_REMOVE, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, product_id: productId }),
    }),
  
  clear: (userId: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(API_CONFIG.ENDPOINTS.WISHLIST_CLEAR, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
}

// Banners API
export const bannersApi = {
  // Get active banners (public endpoint) - Backend returns hero_banners, promo_banners, category_banners
  getAll: () =>
    apiRequest<{
      hero_banners: any[]
      promo_banners: any[]
      category_banners: any[]
      total: number
    }>(API_CONFIG.ENDPOINTS.BANNERS),
  
  // Get hero banners specifically
  getHero: () =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.BANNERS + '/hero'),
  
  // Get promo banners
  getPromo: () =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.BANNERS + '/promo'),
  
  // Get category banners
  getCategory: () =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.BANNERS + '/category'),
  
  // Admin endpoints (requires authentication)
  admin: {
    getAll: () =>
      apiRequest<{ banners: any[] }>(API_CONFIG.ENDPOINTS.BANNERS_ADMIN_ALL, {
        requiresAuth: true,
      }),
    
    create: (data: {
      title: string
      image_url: string
      banner_type: 'hero' | 'sale' | 'model'
      is_active?: boolean
      link_url?: string
      subtitle?: string
      button_text?: string
      sort_order?: number
    }) =>
      apiRequest(`${API_CONFIG.ENDPOINTS.BANNERS}/admin/create`, {
        method: 'POST',
        body: JSON.stringify(data),
        requiresAuth: true,
      }),
    
    getById: (bannerId: number) =>
      apiRequest(`${API_CONFIG.ENDPOINTS.BANNERS}/admin/${bannerId}`, {
        requiresAuth: true,
      }),
    
    update: (bannerId: number, data: any) =>
      apiRequest(`${API_CONFIG.ENDPOINTS.BANNERS}/admin/${bannerId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        requiresAuth: true,
      }),
    
    delete: (bannerId: number) =>
      apiRequest(`${API_CONFIG.ENDPOINTS.BANNERS}/admin/${bannerId}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    
    toggle: (bannerId: number) =>
      apiRequest(`${API_CONFIG.ENDPOINTS.BANNERS}/admin/${bannerId}/toggle`, {
        method: 'PATCH',
        requiresAuth: true,
      }),
  }
}

// Profile API
export const profileApi = {
  // Profile Management
  getProfile: () =>
    apiRequest<{
      id: number
      phone: string
      full_name: string | null
      profile_image_url: string | null
      is_active: boolean
      is_verified: boolean
      last_login: string | null
      market: string
      language: string
      country: string
      created_at: string
    }>(API_CONFIG.ENDPOINTS.USER_PROFILE, { requiresAuth: true }),
  
  updateProfile: (data: { full_name?: string; profile_image_url?: string }) =>
    apiRequest<{
      success: boolean
      message: string
      user: any
    }>(API_CONFIG.ENDPOINTS.USER_PROFILE, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  // Addresses
  getAddresses: () =>
    apiRequest<{
      success: boolean
      addresses: Array<{
        id: number
        title: string
        full_address: string
        street: string | null
        building: string | null
        apartment: string | null
        city: string | null
        postal_code: string | null
        country: string | null
        is_default: boolean
        created_at: string
      }>
      total: number
    }>('/profile/addresses', { requiresAuth: true }),
  
  createAddress: (data: {
    title: string
    full_address: string
    street?: string
    building?: string
    apartment?: string
    city?: string
    postal_code?: string
    country?: string
    is_default?: boolean
  }) =>
    apiRequest<{
      success: boolean
      message: string
      address: any
    }>('/profile/addresses', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  updateAddress: (id: number, data: {
    title?: string
    full_address?: string
    street?: string
    building?: string
    apartment?: string
    city?: string
    postal_code?: string
    country?: string
    is_default?: boolean
  }) =>
    apiRequest<{
      success: boolean
      message: string
      address: any
    }>(`/profile/addresses/${id}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  deleteAddress: (id: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`/profile/addresses/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  
  // Payment Methods
  getPaymentMethods: () =>
    apiRequest<{
      success: boolean
      payment_methods: Array<{
        id: number
        payment_type: string
        card_type: string
        card_number_masked: string
        card_holder_name: string
        is_default: boolean
        created_at: string
      }>
      total: number
    }>('/profile/payment-methods', { requiresAuth: true }),
  
  createPaymentMethod: (data: {
    card_number: string
    card_holder_name: string
    expiry_month: string
    expiry_year: string
    is_default?: boolean
  }) =>
    apiRequest<{
      success: boolean
      message: string
      payment_method: any
    }>('/profile/payment-methods', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  updatePaymentMethod: (id: number, data: { is_default?: boolean }) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`/profile/payment-methods/${id}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  deletePaymentMethod: (id: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`/profile/payment-methods/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  
  // Orders
  getOrders: (params?: { status?: string; limit?: number; offset?: number }) =>
    apiRequest<{
      success: boolean
      orders: Array<{
        id: number
        order_number: string
        status: string
        total_amount: number
        currency: string
        order_date: string
        delivery_date: string | null
        delivery_address: string
        items_count: number
        items: Array<{
          product_name: string
          quantity: number
          price: number
          image_url: string
        }>
      }>
      total: number
      has_more: boolean
    }>('/profile/orders', {
      requiresAuth: true,
      params: params as any,
    }),
  
  getOrderDetail: (orderId: number) =>
    apiRequest<{
      success: boolean
      order: {
        id: number
        order_number: string
        status: string
        customer_name: string
        customer_phone: string
        delivery_address: string
        subtotal: number
        shipping_cost: number
        total_amount: number
        currency: string
        order_date: string
        confirmed_date: string | null
        shipped_date: string | null
        delivered_date: string | null
        items: Array<{
          product_name: string
          quantity: number
          price: number
          subtotal: number
          image_url: string
        }>
      }
    }>(`/profile/orders/${orderId}`, { requiresAuth: true }),
  
  cancelOrder: (orderId: number) =>
    apiRequest<{
      success: boolean
      message: string
      order_id: number
      status: string
    }>(`/profile/orders/${orderId}/cancel`, {
      method: 'POST',
      requiresAuth: true,
    }),
  
  // Notifications
  getNotifications: (params?: { unread_only?: boolean; limit?: number; offset?: number }) =>
    apiRequest<{
      success: boolean
      notifications: Array<{
        id: number
        type: string
        title: string
        message: string
        is_read: boolean
        order_id: number | null
        created_at: string
      }>
      total: number
      unread_count: number
    }>('/profile/notifications', {
      requiresAuth: true,
      params: params as any,
    }),
  
  markNotificationRead: (id: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`/profile/notifications/${id}/read`, {
      method: 'PUT',
      requiresAuth: true,
    }),
  
  markAllNotificationsRead: () =>
    apiRequest<{
      success: boolean
      message: string
      count: number
    }>('/profile/notifications/read-all', {
      method: 'PUT',
      requiresAuth: true,
    }),
}

// Orders API
export const ordersApi = {
  create: (orderData: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    delivery_address: string
    delivery_city?: string
    delivery_notes?: string
    payment_method: string
    use_cart?: boolean
  }) =>
    apiRequest<{
      id: number
      order_number: string
      status: string
      customer_name: string
      customer_phone: string
      delivery_address: string
      subtotal: number
      shipping_cost: number
      total_amount: number
      currency: string
      order_date: string
      items: any[]
    }>(API_CONFIG.ENDPOINTS.ORDERS_CREATE, {
      method: 'POST',
      body: JSON.stringify(orderData),
      requiresAuth: true,
    }),
  
  getAll: (params?: { status_filter?: string; limit?: number; offset?: number }) =>
    apiRequest<any[]>(API_CONFIG.ENDPOINTS.ORDERS, {
      requiresAuth: true,
      params: params as any,
    }),
  
  getDetail: (orderId: number) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.ORDER_DETAIL}/${orderId}`, {
      requiresAuth: true,
    }),
}

// Export for convenience
export { ApiError }

