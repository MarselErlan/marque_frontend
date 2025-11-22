"use client"
import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/lib/products'
import { wishlistApi } from '@/lib/api'
import { toast } from '@/lib/toast'

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadWishlist = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      const userDataStr = localStorage.getItem('userData')
      
      if (token && userDataStr) {
        // User is authenticated, fetch from backend
        try {
          const userData = JSON.parse(userDataStr)
          const userId = Number(userData.id)
          
          if (!userId) {
            console.error('No user_id found in userData')
            throw new Error('No user_id')
          }
          
          const backendWishlist = await wishlistApi.get(userId)
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
  }, [])

  useEffect(() => {
    setIsClient(true)
    loadWishlist()
  }, [loadWishlist])
  
  // Listen for wishlist update events from other components
  useEffect(() => {
    const handleWishlistUpdate = () => {
      loadWishlist()
    }
    
    window.addEventListener('wishlist:refresh', handleWishlistUpdate)
    return () => {
      window.removeEventListener('wishlist:refresh', handleWishlistUpdate)
    }
  }, [loadWishlist])

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems))
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('wishlist:updated', { 
          detail: { count: wishlistItems.length, items: wishlistItems }
        }))
      } catch (error) {
        console.error("Failed to save wishlist to localStorage", error)
      }
    }
  }, [wishlistItems, isClient])

  const addToWishlist = useCallback(async (product: Product) => {
    const token = localStorage.getItem('authToken')
    const userDataStr = localStorage.getItem('userData')
    
    if (token && userDataStr) {
      // Add to backend wishlist
      try {
        const userData = JSON.parse(userDataStr)
        const userId = Number(userData.id)
        
        if (!userId) {
          throw new Error('No user_id found')
        }
        
        const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id
        await wishlistApi.add(userId, productId)
        await loadWishlist() // Reload wishlist from backend
        // Dispatch event for real-time update
        window.dispatchEvent(new CustomEvent('wishlist:refresh'))
        toast.success('Товар добавлен в избранное!')
        return
      } catch (error) {
        console.error('Failed to add to backend wishlist:', error)
        toast.error('Не удалось добавить в избранное')
        // Fall back to localStorage
      }
    }
    
    // Add to localStorage wishlist
    setWishlistItems((prevItems) => {
      if (prevItems.find((item) => item.id === product.id)) {
        toast.info('Товар уже в избранном')
        return prevItems // Already in wishlist
      }
      toast.success('Товар добавлен в избранное!')
      const newItems = [...prevItems, product]
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent('wishlist:refresh'))
      return newItems
    })
  }, [loadWishlist])

  const removeFromWishlist = useCallback(async (productId: string | number) => {
    const token = localStorage.getItem('authToken')
    const userDataStr = localStorage.getItem('userData')
    
    if (token && userDataStr && isAuthenticated) {
      // Remove from backend wishlist
      try {
        const userData = JSON.parse(userDataStr)
        const userId = Number(userData.id)
        
        if (!userId) {
          throw new Error('No user_id found')
        }
        
        const numericId = typeof productId === 'string' ? parseInt(productId) : productId
        await wishlistApi.remove(userId, numericId)
        await loadWishlist() // Reload wishlist from backend
        // Dispatch event for real-time update
        window.dispatchEvent(new CustomEvent('wishlist:refresh'))
        toast.success('Товар удален из избранного')
        return
      } catch (error) {
        console.error('Failed to remove from backend wishlist:', error)
        toast.error('Не удалось удалить из избранного')
        // Fall back to localStorage
      }
    }
    
    // Remove from localStorage wishlist - handle both string and number IDs
    const idToRemove = String(productId)
    setWishlistItems((prevItems) => {
      const newItems = prevItems.filter((item) => String(item.id) !== idToRemove)
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent('wishlist:refresh'))
      return newItems
    })
    toast.success('Товар удален из избранного')
  }, [isAuthenticated, loadWishlist])

  const isInWishlist = useCallback((productId: string | number) => {
    // Convert both to strings for comparison to handle type inconsistencies
    const idToCheck = String(productId)
    return wishlistItems.some((item) => String(item.id) === idToCheck)
  }, [wishlistItems])

  // Sync local wishlist with backend when user logs in
  const syncWishlistWithBackend = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      const userDataStr = localStorage.getItem('userData')
      
      if (!token || !userDataStr) return
      
      const userData = JSON.parse(userDataStr)
      const userId = Number(userData.id)
      
      if (!userId) {
        console.error('No user_id found for sync')
        return
      }
      
      // Get local wishlist items
      const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]') as Product[]
      
      if (localWishlist.length === 0) {
        // No local items, just load from backend
        await loadWishlist()
        return
      }
      
      // Merge: Add local items to backend
      for (const localItem of localWishlist) {
        try {
          const productId = typeof localItem.id === 'string' ? parseInt(localItem.id) : localItem.id
          await wishlistApi.add(userId, productId)
        } catch (error) {
          console.error('Failed to sync wishlist item:', error)
        }
      }
      
      // Clear local wishlist after sync
      localStorage.removeItem('wishlist')
      
      // Reload wishlist from backend
      await loadWishlist()
      
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent('wishlist:refresh'))
      
      toast.success('Избранное синхронизировано!')
    } catch (error) {
      console.error('Failed to sync wishlist:', error)
    }
  }, [loadWishlist])

  // Watch for authentication changes and sync
  useEffect(() => {
    const handleLogin = async () => {
      console.log('Wishlist: Detected login, syncing with backend...')
      await syncWishlistWithBackend()
    }
    
    const handleLogout = async () => {
      console.log('Wishlist: Detected logout, loading from localStorage...')
      await loadWishlist()
    }
    
    // Listen for auth events
    window.addEventListener('auth:login', handleLogin)
    window.addEventListener('auth:logout', handleLogout)
    
    return () => {
      window.removeEventListener('auth:login', handleLogin)
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [syncWishlistWithBackend])

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistItemCount: wishlistItems.length,
    syncWishlistWithBackend
  }
}
