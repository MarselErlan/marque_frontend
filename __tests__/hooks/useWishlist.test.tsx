import { renderHook, act, waitFor } from '@testing-library/react'
import { useWishlist } from '@/hooks/useWishlist'
import { wishlistApi } from '@/lib/api'
import { toast } from '@/lib/toast'

// Mock dependencies
jest.mock('@/lib/api')
jest.mock('@/lib/toast')

describe('useWishlist', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('should load wishlist from localStorage for guest users', async () => {
      const mockWishlist = [
        { id: '1', name: 'Product 1', price: 100, brand: 'Brand', image: '/img1.jpg', category: 'cat', salesCount: 0 }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockWishlist))

      const { result } = renderHook(() => useWishlist())

      await waitFor(() => {
        expect(result.current.wishlistItems).toHaveLength(1)
      })
      expect(result.current.wishlistItems[0].name).toBe('Product 1')
    })

    it('should load empty wishlist if nothing in localStorage', async () => {
      localStorage.getItem = jest.fn().mockReturnValue(null)

      const { result } = renderHook(() => useWishlist())

      await waitFor(() => {
        expect(result.current.wishlistItems).toHaveLength(0)
      })
    })
  })

  describe('addToWishlist', () => {
    it('should add product to wishlist for guest users', async () => {
      localStorage.getItem = jest.fn().mockReturnValue(null)
      const { result } = renderHook(() => useWishlist())

      const product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        brand: 'Brand',
        image: '/test.jpg',
        category: 'Test',
        salesCount: 10
      }

      await act(async () => {
        await result.current.addToWishlist(product)
      })

      expect(result.current.wishlistItems).toHaveLength(1)
      expect(result.current.wishlistItems[0].name).toBe('Test Product')
      expect(toast.success).toHaveBeenCalledWith('Товар добавлен в избранное!')
    })

    it('should not add duplicate products', async () => {
      localStorage.getItem = jest.fn().mockReturnValue(null)
      const { result } = renderHook(() => useWishlist())

      const product = {
        id: '1',
        name: 'Test Product',
        price: 100,
        brand: 'Brand',
        image: '/test.jpg',
        category: 'Test',
        salesCount: 10
      }

      await act(async () => {
        await result.current.addToWishlist(product)
        await result.current.addToWishlist(product)
      })

      expect(result.current.wishlistItems).toHaveLength(1)
      expect(toast.info).toHaveBeenCalledWith('Товар уже в избранном')
    })
  })

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist - string ID', async () => {
      const mockWishlist = [
        { id: '1', name: 'Product 1', price: 100, brand: 'Brand', image: '/img1.jpg', category: 'cat', salesCount: 0 }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockWishlist))

      const { result } = renderHook(() => useWishlist())

      await act(async () => {
        await result.current.removeFromWishlist('1')
      })

      expect(result.current.wishlistItems).toHaveLength(0)
      expect(toast.success).toHaveBeenCalledWith('Товар удален из избранного')
    })

    it('should remove product from wishlist - number ID', async () => {
      const mockWishlist = [
        { id: 123, name: 'Product 1', price: 100, brand: 'Brand', image: '/img1.jpg', category: 'cat', salesCount: 0 }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockWishlist))

      const { result } = renderHook(() => useWishlist())

      await act(async () => {
        await result.current.removeFromWishlist(123)
      })

      expect(result.current.wishlistItems).toHaveLength(0)
    })
  })

  describe('isInWishlist', () => {
    it('should return true for products in wishlist - string ID', async () => {
      const mockWishlist = [
        { id: '1', name: 'Product 1', price: 100, brand: 'Brand', image: '/img1.jpg', category: 'cat', salesCount: 0 }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockWishlist))

      const { result } = renderHook(() => useWishlist())

      await waitFor(() => {
        expect(result.current.wishlistItems).toHaveLength(1)
      })

      expect(result.current.isInWishlist('1')).toBe(true)
      expect(result.current.isInWishlist('2')).toBe(false)
    })

    it('should handle mixed ID types (number vs string)', async () => {
      const mockWishlist = [
        { id: 123, name: 'Product 1', price: 100, brand: 'Brand', image: '/img1.jpg', category: 'cat', salesCount: 0 }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockWishlist))

      const { result } = renderHook(() => useWishlist())

      await waitFor(() => {
        expect(result.current.wishlistItems).toHaveLength(1)
      })

      // Should find by number
      expect(result.current.isInWishlist(123)).toBe(true)
      // Should also find by string (after fix)
      expect(result.current.isInWishlist('123')).toBe(true)
    })
  })

  describe('wishlistItemCount', () => {
    it('should return correct count of wishlist items', async () => {
      const mockWishlist = [
        { id: '1', name: 'Product 1', price: 100, brand: 'Brand', image: '/img1.jpg', category: 'cat', salesCount: 0 },
        { id: '2', name: 'Product 2', price: 200, brand: 'Brand', image: '/img2.jpg', category: 'cat', salesCount: 0 }
      ]
      localStorage.getItem = jest.fn().mockReturnValue(JSON.stringify(mockWishlist))

      const { result } = renderHook(() => useWishlist())

      await waitFor(() => {
        expect(result.current.wishlistItemCount).toBe(2)
      })
    })
  })
})

