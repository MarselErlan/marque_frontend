import { renderHook, act, waitFor } from '@testing-library/react'
import { useCart } from '@/hooks/useCart'
import { cartApi } from '@/lib/api'
import { toast } from '@/lib/toast'

// Mock dependencies
jest.mock('@/lib/api')
jest.mock('@/lib/toast')

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should load cart from localStorage for guest users', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1)
      })
      expect(result.current.cartItems[0].quantity).toBe(2)
    })
  })

  describe('addToCart', () => {
    it('should add product to cart with size and color', async () => {
      localStorage.getItem = jest.fn().mockReturnValue(null)
      const { result } = renderHook(() => useCart())

      const product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        brand: 'Brand',
        image: '/test.jpg',
        size: 'M',
        color: 'Red'
      }

      await act(async () => {
        await result.current.addToCart(product)
      })

      expect(result.current.cartItems).toHaveLength(1)
      expect(result.current.cartItems[0].size).toBe('M')
      expect(result.current.cartItems[0].color).toBe('Red')
      expect(result.current.cartItems[0].quantity).toBe(1)
      expect(toast.success).toHaveBeenCalled()
    })

    it('should increment quantity if same product with same variant exists', async () => {
      localStorage.getItem = jest.fn().mockReturnValue(null)
      const { result } = renderHook(() => useCart())

      const product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        brand: 'Brand',
        image: '/test.jpg',
        size: 'M',
        color: 'Red'
      }

      await act(async () => {
        await result.current.addToCart(product)
        await result.current.addToCart(product)
      })

      expect(result.current.cartItems).toHaveLength(1)
      expect(result.current.cartItems[0].quantity).toBe(2)
    })

    it('should add as separate item if different variant', async () => {
      localStorage.getItem = jest.fn().mockReturnValue(null)
      const { result } = renderHook(() => useCart())

      const product1 = {
        id: '1',
        name: 'Test Product',
        price: 100,
        brand: 'Brand',
        image: '/test.jpg',
        size: 'M',
        color: 'Red'
      }

      const product2 = {
        id: '1',
        name: 'Test Product',
        price: 100,
        brand: 'Brand',
        image: '/test.jpg',
        size: 'L',
        color: 'Red'
      }

      await act(async () => {
        await result.current.addToCart(product1)
        await result.current.addToCart(product2)
      })

      expect(result.current.cartItems).toHaveLength(2)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1)
      })

      await act(async () => {
        await result.current.updateQuantity('1', 5)
      })

      expect(result.current.cartItems[0].quantity).toBe(5)
    })

    it('should remove item if quantity is 0', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1)
      })

      await act(async () => {
        await result.current.updateQuantity('1', 0)
      })

      expect(result.current.cartItems).toHaveLength(0)
    })
  })

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1)
      })

      await act(async () => {
        await result.current.removeFromCart('1')
      })

      expect(result.current.cartItems).toHaveLength(0)
      expect(toast.success).toHaveBeenCalled()
    })
  })

  describe('cartItemCount', () => {
    it('should return total quantity of all items', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        },
        {
          id: '2',
          name: 'Product 2',
          price: 200,
          brand: 'Brand',
          image: '/img2.jpg',
          size: 'L',
          color: 'Blue',
          quantity: 3
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItemCount).toBe(5) // 2 + 3
      })
    })
  })

  describe('calculateTotals', () => {
    it('should calculate correct total price', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        },
        {
          id: '2',
          name: 'Product 2',
          price: 200,
          brand: 'Brand',
          image: '/img2.jpg',
          size: 'L',
          color: 'Blue',
          quantity: 3
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(2)
      })

      const totals = result.current.calculateTotals()
      expect(totals.subtotal).toBe(800) // (100*2) + (200*3)
      expect(totals.totalQuantity).toBe(5)
    })
  })

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const mockCart = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          brand: 'Brand',
          image: '/img1.jpg',
          size: 'M',
          color: 'Red',
          quantity: 2
        }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockCart))

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.cartItems).toHaveLength(1)
      })

      await act(async () => {
        await result.current.clearCart()
      })

      expect(result.current.cartItems).toHaveLength(0)
    })
  })
})

