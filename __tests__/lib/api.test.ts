import { apiRequest, productsApi, categoriesApi, bannersApi } from '@/lib/api'

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
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      })

      const result = await apiRequest('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result).toEqual(mockData)
    })

    it('should handle POST request with body', async () => {
      const mockData = { success: true }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      })

      const body = { name: 'test' }
      await apiRequest('/test', { method: 'POST', body: body as any })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      )
    })

    it('should include auth token if requiresAuth is true', async () => {
      localStorage.getItem = jest.fn().mockReturnValue('test-token')
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      })

      await apiRequest('/test', { requiresAuth: true })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('should handle 401 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ detail: 'Not authenticated' }),
      })

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
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProducts),
      })

      const result = await productsApi.getBestSellers(10)

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockProducts)
    })

    it('should fetch product by slug', async () => {
      const mockProduct = { id: 1, name: 'Test Product', slug: 'test-product' }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProduct),
      })

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
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResults),
      })

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
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockCategories),
      })

      const result = await categoriesApi.getAll()

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockCategories)
    })
  })

  describe('bannersApi', () => {
    it('should fetch all banners', async () => {
      const mockBanners = { banners: [{ id: 1, title: 'Banner 1' }] }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockBanners),
      })

      const result = await bannersApi.getAll()

      expect(global.fetch).toHaveBeenCalled()
      expect(result).toEqual(mockBanners)
    })
  })
})

