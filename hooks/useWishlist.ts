"use client"
import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/lib/products'
import { wishlistApi } from '@/lib/api'

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsClient(true)
    loadWishlist()
  }, [])
  
  const loadWishlist = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        // User is authenticated, fetch from backend
        try {
          const backendWishlist = await wishlistApi.get()
          const items = backendWishlist.items.map((item: any) => {
            const product = item.product
            return {
              id: product.id?.toString() || product.id,
              name: product.title || product.name,
              brand: product.brand?.name || product.brand || 'MARQUE',
              price: product.price_min || product.price,
              originalPrice: product.original_price_min,
              discount: product.discount_percent,
              image: product.image,
              images: product.images?.map((img: any) => img.url) || [],
              category: product.category?.name || product.category,
              subcategory: product.subcategory?.name || product.subcategory,
              sizes: product.available_sizes,
              colors: product.available_colors,
              rating: product.rating_avg,
              reviews: product.rating_count,
              salesCount: product.sold_count || 0,
              inStock: product.in_stock,
              description: product.description,
            }
          })
          setWishlistItems(items)
          setIsAuthenticated(true)
          return
        } catch (error) {
          console.error('Failed to load wishlist from backend:', error)
          // Fall back to localStorage
        }
      }
      
      // Load from localStorage if not authenticated or backend failed
      const storedWishlist = localStorage.getItem('wishlist')
      if (storedWishlist) {
        setWishlistItems(JSON.parse(storedWishlist))
      }
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Failed to load wishlist", error)
    }
  }

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems))
      } catch (error) {
        console.error("Failed to save wishlist to localStorage", error)
      }
    }
  }, [wishlistItems, isClient])

  const addToWishlist = useCallback(async (product: Product) => {
    const token = localStorage.getItem('authToken')
    
    if (token) {
      // Add to backend wishlist
      try {
        const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id
        await wishlistApi.add(productId)
        await loadWishlist() // Reload wishlist from backend
        return
      } catch (error) {
        console.error('Failed to add to backend wishlist:', error)
        // Fall back to localStorage
      }
    }
    
    // Add to localStorage wishlist
    setWishlistItems((prevItems) => {
      if (prevItems.find((item) => item.id === product.id)) {
        return prevItems // Already in wishlist
      }
      return [...prevItems, product]
    })
  }, [])

  const removeFromWishlist = useCallback(async (productId: string) => {
    const token = localStorage.getItem('authToken')
    
    if (token && isAuthenticated) {
      // Remove from backend wishlist
      try {
        const numericId = typeof productId === 'string' ? parseInt(productId) : productId
        await wishlistApi.remove(numericId)
        await loadWishlist() // Reload wishlist from backend
        return
      } catch (error) {
        console.error('Failed to remove from backend wishlist:', error)
        // Fall back to localStorage
      }
    }
    
    // Remove from localStorage wishlist
    setWishlistItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }, [isAuthenticated])

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some((item) => item.id === productId)
  }, [wishlistItems])

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistItemCount: wishlistItems.length,
  }
}
