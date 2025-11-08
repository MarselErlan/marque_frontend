/**
 * Order API Tests
 * Tests for order creation, retrieval, and management
 */

import { ordersApi } from '@/lib/api'

const createJsonResponse = (data: any, status: number = 200, ok: boolean = true) => ({
  ok,
  status,
  json: jest.fn().mockResolvedValue(data),
  headers: {
    get: jest.fn().mockReturnValue('application/json'),
  },
})

// Mock fetch globally
global.fetch = jest.fn()

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock authentication token
    localStorage.setItem('authToken', 'test-jwt-token')
    localStorage.setItem('tokenType', 'Token')
    
    // Default mock implementation
    ;(global.fetch as jest.Mock).mockResolvedValue(createJsonResponse({}) as any)
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('ordersApi.create', () => {
    it('should create order successfully', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'card',
        use_cart: true,
      }

      const mockResponse = {
        id: 1,
        order_number: '#1001',
        status: 'PENDING',
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        subtotal: 2999.0,
        shipping_cost: 150.0,
        total_amount: 3149.0,
        currency: 'KGS',
        order_date: '2025-11-01T10:00:00',
        items: [
          {
            id: 1,
            product_name: 'Test Product',
            sku_code: 'TEST-M-BLACK',
            size: 'M',
            color: 'Black',
            quantity: 1,
            unit_price: 2999.0,
            total_price: 2999.0,
          },
        ],
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockResponse) as any)

      // Act
      const result = await ordersApi.create(mockOrderData)

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toContain('/orders/create')
      expect(options).toMatchObject({
        method: 'POST',
        body: JSON.stringify(mockOrderData),
      })
      expect((options as any).headers).toMatchObject({
        'Content-Type': 'application/json',
        Authorization: 'Token test-jwt-token',
      })
      expect(result).toEqual(mockResponse)
      expect(result.order_number).toBe('#1001')
      expect(result.status).toBe('PENDING')
      expect(result.items).toHaveLength(1)
    })

    it('should create order with free shipping', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'cash',
        use_cart: true,
      }

      const mockResponse = {
        id: 2,
        order_number: '#1002',
        status: 'PENDING',
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        subtotal: 5500.0,
        shipping_cost: 0.0, // Free shipping
        total_amount: 5500.0,
        currency: 'KGS',
        order_date: '2025-11-01T10:00:00',
        items: [],
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockResponse) as any)

      // Act
      const result = await ordersApi.create(mockOrderData)

      // Assert
      expect(result.shipping_cost).toBe(0.0)
      expect(result.subtotal).toBe(5500.0)
      expect(result.total_amount).toBe(5500.0)
    })

    it('should handle empty cart error', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'card',
        use_cart: true,
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          detail: 'Cart is empty',
        }),
      })

      // Act & Assert
      await expect(ordersApi.create(mockOrderData)).rejects.toThrow()
    })

    it('should handle out of stock error', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'card',
        use_cart: true,
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          detail: 'SKU TEST-M-BLACK is out of stock',
        }),
      })

      // Act & Assert
      await expect(ordersApi.create(mockOrderData)).rejects.toThrow()
    })

    it('should require authentication', async () => {
      // Arrange
      localStorage.removeItem('authToken') // Remove token

      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'card',
        use_cart: true,
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          detail: 'Not authenticated',
        }),
      })

      // Act & Assert
      await expect(ordersApi.create(mockOrderData)).rejects.toThrow()
    })

    it('should validate phone number', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '123', // Too short
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'card',
        use_cart: true,
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          detail: 'Invalid phone number',
        }),
      })

      // Act & Assert
      await expect(ordersApi.create(mockOrderData)).rejects.toThrow()
    })

    it('should validate delivery address', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: '123', // Too short
        payment_method: 'card',
        use_cart: true,
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          detail: 'Delivery address too short',
        }),
      })

      // Act & Assert
      await expect(ordersApi.create(mockOrderData)).rejects.toThrow()
    })
  })

  describe('ordersApi.getAll', () => {
    it('should retrieve user orders', async () => {
      // Arrange
      const mockOrders = {
        orders: [
          {
            id: 1,
            order_number: '#1001',
            status: 'PENDING',
            customer_name: 'Test User',
            total_amount: 3149.0,
            currency: 'KGS',
            order_date: '2025-11-01T10:00:00',
          },
          {
            id: 2,
            order_number: '#1002',
            status: 'COMPLETED',
            customer_name: 'Test User',
            total_amount: 5500.0,
            currency: 'KGS',
            order_date: '2025-11-01T11:00:00',
          },
        ],
        total: 2,
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockOrders) as any)

      // Act
      const result = await ordersApi.getAll({ limit: 20, offset: 0 })

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toContain('/orders?limit=20&offset=0')
      expect((options as any).headers.Authorization).toBe('Token test-jwt-token')
      expect((result as any).orders).toHaveLength(2)
      expect((result as any).total).toBe(2)
      expect((result as any).orders[0].order_number).toBe('#1001')
      expect((result as any).orders[1].order_number).toBe('#1002')
    })

    it('should handle pagination', async () => {
      // Arrange
      const mockOrders = {
        orders: [
          {
            id: 21,
            order_number: '#1021',
            status: 'PENDING',
            customer_name: 'Test User',
            total_amount: 3149.0,
            currency: 'KGS',
            order_date: '2025-11-01T10:00:00',
          },
        ],
        total: 25,
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockOrders) as any)

      // Act
      const result = await ordersApi.getAll({ limit: 20, offset: 20 })

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toContain('/orders?limit=20&offset=20')
      expect((options as any).headers.Authorization).toBe('Token test-jwt-token')
      expect((result as any).total).toBe(25)
      expect((result as any).orders).toHaveLength(1)
    })

    it('should return empty list for user with no orders', async () => {
      // Arrange
      const mockOrders = {
        orders: [],
        total: 0,
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockOrders) as any)

      // Act
      const result = await ordersApi.getAll({ limit: 20, offset: 0 })

      // Assert
      expect((result as any).orders).toHaveLength(0)
      expect((result as any).total).toBe(0)
    })
  })

  describe('ordersApi.getDetail', () => {
    it('should retrieve order details', async () => {
      // Arrange
      const mockOrder = {
        id: 1,
        order_number: '#1001',
        status: 'PENDING',
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        customer_email: 'test@example.com',
        delivery_address: 'Юнусалиева, 40',
        delivery_city: 'Бишкек',
        delivery_notes: 'Please call before delivery',
        payment_method: 'card',
        subtotal: 5998.0,
        shipping_cost: 150.0,
        total_amount: 6148.0,
        currency: 'KGS',
        order_date: '2025-11-01T10:00:00',
        items: [
          {
            id: 1,
            product_name: 'Test Product 1',
            sku_code: 'TEST-M-BLACK',
            size: 'M',
            color: 'Black',
            quantity: 1,
            unit_price: 2999.0,
            total_price: 2999.0,
          },
          {
            id: 2,
            product_name: 'Test Product 2',
            sku_code: 'TEST-L-WHITE',
            size: 'L',
            color: 'White',
            quantity: 1,
            unit_price: 2999.0,
            total_price: 2999.0,
          },
        ],
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockOrder) as any)

      // Act
      const result = await ordersApi.getDetail(1)

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toContain('/orders/1')
      expect((options as any).headers.Authorization).toBe('Token test-jwt-token')
      expect(result.order_number).toBe('#1001')
      expect(result.items).toHaveLength(2)
      expect(result.subtotal).toBe(5998.0)
      expect(result.shipping_cost).toBe(150.0)
      expect(result.total_amount).toBe(6148.0)
      expect(result.delivery_notes).toBe('Please call before delivery')
    })

    it('should handle order not found', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ...createJsonResponse({ detail: 'Order not found' }, 404, false),
        statusText: 'Not Found',
      } as any)

      // Act & Assert
      await expect(ordersApi.getDetail(999)).rejects.toThrow()
    })

    it('should handle unauthorized access', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ...createJsonResponse({ detail: 'Not authorized to view this order' }, 403, false),
        statusText: 'Forbidden',
      } as any)

      // Act & Assert
      await expect(ordersApi.getDetail(1)).rejects.toThrow()
    })
  })

  describe('Order validation', () => {
    it('should validate required fields', async () => {
      // Arrange - Missing required fields
      const invalidOrderData = {
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        payment_method: 'card',
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          detail: 'Validation error',
        }),
      })

      // Act & Assert
      await expect(ordersApi.create(invalidOrderData as any)).rejects.toThrow()
    })
  })

  describe('Order number format', () => {
    it('should receive order number in correct format', async () => {
      // Arrange
      const mockOrderData = {
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        payment_method: 'card',
        use_cart: true,
      }

      const mockResponse = {
        id: 1,
        order_number: '#1001',
        status: 'PENDING',
        customer_name: 'Test User',
        customer_phone: '+996505231255',
        delivery_address: 'Юнусалиева, 40',
        subtotal: 2999.0,
        shipping_cost: 150.0,
        total_amount: 3149.0,
        currency: 'KGS',
        order_date: '2025-11-01T10:00:00',
        items: [],
      }

      global.fetch = jest.fn().mockResolvedValue(createJsonResponse(mockResponse) as any)

      // Act
      const result = await ordersApi.create(mockOrderData)

      // Assert
      expect(result.order_number).toMatch(/^#\d+$/)
      expect(result.order_number).toBe('#1001')
    })
  })
})

