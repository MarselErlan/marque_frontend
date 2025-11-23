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
    'Accept': 'application/json',
  }

  const isFormData = fetchOptions.body instanceof FormData

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  // Add market header from localStorage if available
  // Normalize market value: "United States" -> "US", "Kyrgyzstan" -> "KG"
  const market = localStorage.getItem('market') || localStorage.getItem('location')
  if (market) {
    let normalizedMarket = market.toUpperCase()
    // Handle full country names
    if (normalizedMarket === 'UNITED STATES' || normalizedMarket.includes('US')) {
      normalizedMarket = 'US'
    } else if (normalizedMarket === 'KYRGYZSTAN' || normalizedMarket.includes('KG')) {
      normalizedMarket = 'KG'
    }
    headers['X-Market'] = normalizedMarket
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
      location: string
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
      location: string
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
      profile_image: string | null
      is_active: boolean
      is_verified: boolean
      location: string
      market?: string
      language: string
      country: string
      currency: string
      currency_code: string
      last_login: string | null
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
      id: number | string
      phone: string
      formatted_phone: string
      name: string | null
      full_name: string | null
      profile_image: string | null
      is_active: boolean
      is_verified: boolean
      last_login: string | null
      location: string
      market?: string
      language: string
      country: string
      currency: string
      currency_code: string
      created_at: string
    }>(API_CONFIG.ENDPOINTS.USER_PROFILE, { requiresAuth: true }),
  
  updateProfile: (data: { full_name?: string; profile_image?: File | Blob | null }) => {
    const formData = new FormData()
    if (typeof data.full_name === 'string') {
      formData.append('full_name', data.full_name)
    }
    if (data.profile_image !== undefined) {
      if (data.profile_image) {
        formData.append('profile_image', data.profile_image)
      } else {
        formData.append('profile_image', '')
      }
    }

    return apiRequest<{
      success: boolean
      message: string
      user: any
    }>(API_CONFIG.ENDPOINTS.USER_PROFILE, {
      method: 'PUT',
      requiresAuth: true,
      body: formData,
    })
  },
  
  // Addresses
  getAddresses: () =>
    apiRequest<{
      success: boolean
      addresses: Array<{
        id: number
        title: string
        full_address: string
        street: string | null
        state: string | null
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
    state?: string
    building?: string
    apartment?: string
    entrance?: string
    floor?: string
    comment?: string
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
    state?: string
    building?: string
    apartment?: string
    entrance?: string
    floor?: string
    comment?: string
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

  // Phone Numbers
  getPhoneNumbers: () =>
    apiRequest<{
      success: boolean
      phone_numbers: Array<{
        id: number
        label: string | null
        phone: string
        is_primary: boolean
        created_at: string
        updated_at: string
      }>
      total: number
    }>('/profile/phones', { requiresAuth: true }),
  
  createPhoneNumber: (data: {
    label?: string
    phone: string
    is_primary?: boolean
  }) =>
    apiRequest<{
      success: boolean
      message: string
      phone_number: any
    }>('/profile/phones', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  updatePhoneNumber: (id: number, data: {
    label?: string
    phone?: string
    is_primary?: boolean
  }) =>
    apiRequest<{
      success: boolean
      message: string
      phone_number: any
    }>(`/profile/phones/${id}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(data),
    }),
  
  deletePhoneNumber: (id: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`/profile/phones/${id}`, {
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
        requested_delivery_date?: string | null
        delivery_address: string
        items_count: number
        has_review?: boolean
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
        customer_email?: string | null
        additional_phone?: string | null
        delivery_address: string
        delivery_city?: string | null
        delivery_state?: string | null
        delivery_postal_code?: string | null
        delivery_country?: string | null
        delivery_notes?: string | null
        subtotal: number
        shipping_cost: number
        total_amount: number
        currency: string
        order_date: string
        confirmed_date: string | null
        shipped_date: string | null
        delivered_date: string | null
        has_review?: boolean
        items: Array<{
          id?: number
          product_id?: number | null
          product_name: string
          quantity: number
          price: number
          subtotal: number
          image_url: string
          size?: string | null
          color?: string | null
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
    delivery_state?: string
    delivery_postal_code?: string
    delivery_notes?: string
    requested_delivery_date?: string
    shipping_address_id?: number
    payment_method_used_id?: number
    payment_method: string
    use_cart?: boolean
    currency?: string
    currency_code?: string
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
  
  createReview: (data: {
    order_id: number
    product_id: number
    rating: number
    comment: string
    title?: string
    images?: File[]
  }) => {
    const formData = new FormData()
    formData.append('order_id', data.order_id.toString())
    formData.append('product_id', data.product_id.toString())
    formData.append('rating', data.rating.toString())
    formData.append('comment', data.comment)
    if (data.title) {
      formData.append('title', data.title)
    }
    // Append all images with the same field name (if provided)
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image)
      })
    }

    return apiRequest<{
      id: number
      user: number
      product: number
      order: number
      rating: number
      title: string | null
      comment: string
      is_verified_purchase: boolean
      is_approved: boolean
      created_at: string
      updated_at: string
      images: Array<{
        id: number
        image: string
        image_url: string
        created_at: string
      }>
      user_name: string
    }>(`${API_CONFIG.ENDPOINTS.ORDERS_CREATE.replace('/create', '')}/review/create`, {
      method: 'POST',
      requiresAuth: true,
      body: formData,
    })
  },
}

// Store Manager API
export const storeManagerApi = {
  // Check Manager Status
  checkManagerStatus: () =>
    apiRequest<{
      is_manager: boolean
      manager_id: number | null
      role: string | null
      accessible_markets: string[]
      can_manage_kg: boolean
      can_manage_us: boolean
      is_active: boolean
    }>(API_CONFIG.ENDPOINTS.STORE_MANAGER_CHECK_STATUS, {
      requiresAuth: true,
    }),
  
  // Dashboard Stats
  getDashboardStats: (market?: string) =>
    apiRequest<{
      success: boolean
      today_orders_count: number
      all_orders_count: number
      active_orders_count: number
      total_users_count: number
      market: string
    }>(API_CONFIG.ENDPOINTS.STORE_MANAGER_DASHBOARD_STATS, {
      requiresAuth: true,
      params: market ? { market } : undefined,
    }),
  
  // Orders List
  getOrders: (params?: {
    market?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) =>
    apiRequest<{
      success: boolean
      orders: Array<{
        id: number
        order_number: string
        status: string
        status_display: string
        status_color: string
        customer_name: string
        customer_phone: string
        delivery_address: string
        delivery_city: string | null
        total_amount: number
        currency: string
        amount: string
        order_date: string
        date: string
        order_date_formatted: string
        items_count: number
        items: Array<{
          id: number
          product_name: string
          product_brand: string
          size: string
          color: string
          price: number
          quantity: number
          subtotal: number
          image_url: string | null
        }>
      }>
      total: number
      limit: number
      offset: number
      has_more: boolean
    }>(API_CONFIG.ENDPOINTS.STORE_MANAGER_ORDERS, {
      requiresAuth: true,
      params: params as any,
    }),
  
  // Order Detail
  getOrderDetail: (orderId: number, market?: string) =>
    apiRequest<{
      success: boolean
      order: {
        id: number
        order_number: string
        status: string
        status_display: string
        status_color: string
        customer_name: string
        customer_phone: string
        customer_email: string | null
        delivery_address: string
        delivery_city: string | null
        delivery_state: string | null
        delivery_postal_code: string | null
        delivery_country: string
        delivery_notes: string | null
        payment_method: string
        payment_status: string
        card_type: string | null
        card_last_four: string | null
        subtotal: number
        shipping_cost: number
        tax: number
        total_amount: number
        currency: string
        currency_code: string
        amount: string
        order_date: string
        order_date_formatted: string
        confirmed_date: string | null
        shipped_date: string | null
        delivered_date: string | null
        items_count: number
        items: Array<{
          id: number
          product_name: string
          product_brand: string
          size: string
          color: string
          price: number
          quantity: number
          subtotal: number
          image_url: string | null
        }>
      }
    }>(`${API_CONFIG.ENDPOINTS.STORE_MANAGER_ORDER_DETAIL}/${orderId}`, {
      requiresAuth: true,
      params: market ? { market } : undefined,
    }),
  
  // Update Order Status
  updateOrderStatus: (orderId: number, status: string) =>
    apiRequest<{
      success: boolean
      message: string
      order: any
    }>(`${API_CONFIG.ENDPOINTS.STORE_MANAGER_ORDER_STATUS}/${orderId}/status`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({ status }),
    }),
  
  // Cancel Order
  cancelOrder: (orderId: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`${API_CONFIG.ENDPOINTS.STORE_MANAGER_ORDER_CANCEL}/${orderId}/cancel`, {
      method: 'POST',
      requiresAuth: true,
    }),
  
  // Resume Order
  resumeOrder: (orderId: number) =>
    apiRequest<{
      success: boolean
      message: string
    }>(`${API_CONFIG.ENDPOINTS.STORE_MANAGER_ORDER_RESUME}/${orderId}/resume`, {
      method: 'POST',
      requiresAuth: true,
    }),
  
  // Revenue Analytics
  getRevenueAnalytics: (market?: string) =>
    apiRequest<{
      success: boolean
      total_revenue: string
      revenue_change: string
      total_orders: number
      orders_change: string
      average_order: string
      average_change: string
      currency: string
      currency_code: string
      hourly_revenue: Array<{
        time: string
        amount: string
        is_highlighted?: boolean
      }>
      recent_orders: Array<{
        id: string
        order_number: string
        status: string
        status_color: string
        phone: string
        address: string
        amount: string
        created_at: string
        time: string
        date: string
      }>
    }>(API_CONFIG.ENDPOINTS.STORE_MANAGER_REVENUE_ANALYTICS, {
      requiresAuth: true,
      params: market ? { market } : undefined,
    }),
}

// Export for convenience
// Currency API
export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_base: boolean
  market: string
}

export interface CurrencyConvertResponse {
  amount: number
  from_currency: string
  to_currency: string
  converted_amount: number
  exchange_rate: number
}

export const currencyApi = {
  /**
   * Get all active currencies
   */
  getCurrencies: async (): Promise<Currency[]> => {
    return apiRequest<Currency[]>(API_CONFIG.ENDPOINTS.CURRENCIES)
  },

  /**
   * Convert amount from one currency to another
   */
  convertCurrency: async (
    amount: number,
    from: string,
    to: string
  ): Promise<CurrencyConvertResponse> => {
    return apiRequest<CurrencyConvertResponse>(API_CONFIG.ENDPOINTS.CURRENCY_CONVERT, {
      params: {
        amount,
        from,
        to,
      },
    })
  },

  /**
   * Get currency for a market
   */
  getMarketCurrency: async (market: string): Promise<Currency> => {
    return apiRequest<Currency>(API_CONFIG.ENDPOINTS.MARKET_CURRENCY, {
      params: {
        market,
      },
    })
  },
}

export { ApiError }

