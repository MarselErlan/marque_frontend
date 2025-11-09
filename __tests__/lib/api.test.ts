import { apiRequest, productsApi, categoriesApi, bannersApi } from '@/lib/api'

const createJsonResponse = (data: any, status: number = 200, ok: boolean = true) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
  headers: {
    get: jest.fn().mockReturnValue('application/json'),
  },
})

describe('API Functions', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('apiRequest', () => {
    it('should make successful GET request', async () => {
      const mockData = { data: 'test' }
      const mockResponse = createJsonResponse(mockData)
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any)

      const result = await apiRequest('/test')

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toContain('/test')
      expect(options).toMatchObject({
        mode: 'cors',
        credentials: 'omit',
      })
      expect((options as any).headers).toMatchObject({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      })
      expect(result).toEqual(mockData)
    })

    it('should handle POST request with body', async () => {
      const mockData = { success: true }
      const mockResponse = createJsonResponse(mockData)
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any)

      const body = { name: 'test' }
      await apiRequest('/test', { method: 'POST', body: JSON.stringify(body) })

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toContain('/test')
      expect(options).toMatchObject({
        method: 'POST',
        body: JSON.stringify(body),
      })
    })

    it('should include auth token if requiresAuth is true', async () => {
      localStorage.setItem('authToken', 'test-token')
      const mockResponse = createJsonResponse({})
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any)

      await apiRequest('/test', { requiresAuth: true })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Token test-token',
          }),
        })
      )
    })

    it('should handle 401 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ...createJsonResponse({ detail: 'Not authenticated' }, 401, false),
        statusText: 'Unauthorized',
      } as any)

      await expect(apiRequest('/test')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network error'))

      await expect(apiRequest('/test')).rejects.toThrow('Network error')
    })
  })

  describe('productsApi', () => {
    it('should fetch best sellers', async () => {
      const mockProducts = [{ id: 1, name: 'Test' }]
      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockProducts) as any)

      const result = await productsApi.getBestSellers(10)

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockProducts)
    })

    it('should fetch product by slug', async () => {
      const mockProduct = { id: 1, name: 'Test Product', slug: 'test-product' }
      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockProduct) as any)

      const result = await productsApi.getDetail('test-product')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/products/test-product'),
        expect.any(Object)
      )
      expect(result).toEqual(mockProduct)
    })

    it('should search products', async () => {
      const mockResults = {
        products: [{ id: 1, name: 'Test' }],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
        has_more: false
      }
      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockResults) as any)

      const result = await productsApi.search('test', { page: 1, limit: 10 })

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockResults)
    })
  })

  describe('categoriesApi', () => {
    it('should fetch all categories', async () => {
      const mockCategories = {
        categories: [
          { id: 1, name: 'Category 1', slug: 'cat1' }
        ]
      }
      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockCategories) as any)

      const result = await categoriesApi.getAll()

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockCategories)
    })
  })

  describe('bannersApi', () => {
    it('should fetch all banners', async () => {
      const mockBanners = { banners: [{ id: 1, title: 'Banner 1' }] }
      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockBanners) as any)

      const result = await bannersApi.getAll()

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockBanners)
    })
  })
})

