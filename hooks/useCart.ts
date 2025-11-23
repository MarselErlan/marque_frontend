import { useState, useEffect, useCallback } from 'react'
import { cartApi } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useLanguage } from '@/contexts/LanguageContext'

export interface CartItem {
  id: string | number
  name: string
  price: number
  originalPrice?: number
  brand: string
  image: string
  quantity: number
  size?: string
  color?: string
  sku_id?: number
}

export const useCart = () => {
  const { t } = useLanguage()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Get user_id from localStorage as number
  const getUserId = (): number | null => {
    try {
      const userDataStr = localStorage.getItem('userData')
      if (!userDataStr) return null
      const userData = JSON.parse(userDataStr)
      return userData.id ? Number(userData.id) : null
    } catch (error) {
      console.error('Failed to get user_id:', error)
      return null
    }
  }

  // Load cart from backend or localStorage
  const loadCart = useCallback(async () => {
    try {
      const userId = getUserId()
      
      if (userId) {
        // User is authenticated, fetch from backend
        try {
          const backendCart = await cartApi.get(userId)
          const items = backendCart.items.map((item: any) => {
            // Use cart_item_id if available, otherwise use id
            // The backend should return cart_item_id in the id field, but check both
            const cartItemId = item.cart_item_id || item.id
            return {
              id: cartItemId, // This should be cart_item_id from backend for authenticated users
              name: item.name,
              price: item.price,
              originalPrice: item.original_price,
              brand: item.brand || 'MARQUE',
              image: item.image || '/images/product_placeholder_adobe.png',
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              sku_id: item.sku_id
            }
          })
          setCartItems(items)
          setCartItemCount(backendCart.total_items || items.reduce((total: number, item: CartItem) => total + item.quantity, 0))
          setIsAuthenticated(true)
          return
        } catch (error) {
          console.error('Failed to load cart from backend:', error)
          // Fall back to localStorage
        }
      }
      
      // Load from localStorage if not authenticated or backend failed
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(existingCart)
      const totalCount = existingCart.reduce((total: number, item: CartItem) => total + item.quantity, 0)
      setCartItemCount(totalCount)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
      setCartItemCount(0)
    }
  }, [])

  // Save cart to localStorage
  const saveCart = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items))
      const totalCount = items.reduce((total, item) => total + item.quantity, 0)
      setCartItemCount(totalCount)
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('cart:updated', { 
        detail: { count: totalCount, items: items }
      }))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }, [])

  // Add item to cart
  const addToCart = useCallback(async (product: Omit<CartItem, 'quantity'>) => {
    const userId = getUserId()
    
      if (userId && product.sku_id) {
      // Add to backend cart
      try {
        await cartApi.add(userId, product.sku_id, 1)
        await loadCart() // Reload cart from backend
        // Dispatch event for real-time update
        window.dispatchEvent(new CustomEvent('cart:refresh'))
        toast.success(t('cart.addedToCart'))
        return
      } catch (error) {
        console.error('Failed to add to backend cart:', error)
        toast.error(t('cart.addToCartError'))
        // Fall back to localStorage
      }
    }
    
    // Add to localStorage cart
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === product.id && 
        item.size === product.size && 
        item.color === product.color
      )

      let newItems: CartItem[]
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.id === product.id && 
          item.size === product.size && 
          item.color === product.color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        newItems = [...prevItems, { ...product, quantity: 1 }]
      }

      saveCart(newItems)
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent('cart:refresh'))
      toast.success('Товар добавлен в корзину!')
      return newItems
    })
  }, [loadCart, saveCart])

  // Remove item from cart
  const removeFromCart = useCallback(async (productId: string | number, size?: string, color?: string) => {
    const userId = getUserId()
    
    if (userId && isAuthenticated) {
      // Remove from backend cart (productId here is cart_item_id)
      try {
        await cartApi.remove(userId, Number(productId))
        await loadCart() // Reload cart from backend
        // Dispatch event for real-time update
        window.dispatchEvent(new CustomEvent('cart:refresh'))
        toast.success(t('cart.removedFromCart'))
        return
      } catch (error) {
        console.error('Failed to remove from backend cart:', error)
        toast.error(t('cart.removeFromCartError'))
        // Fall back to localStorage
      }
    }
    
    // Remove from localStorage cart
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.id === productId && item.size === size && item.color === color)
      )
      saveCart(newItems)
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent('cart:refresh'))
      toast.success('Товар удален из корзины')
      return newItems
    })
  }, [isAuthenticated, loadCart, saveCart])

  // Update quantity
  const updateQuantity = useCallback(async (productId: string | number, newQuantity: number, size?: string, color?: string) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId, size, color)
      return
    }

    const userId = getUserId()
    
    if (userId && isAuthenticated) {
      // Update backend cart (productId here should be cart_item_id from backend)
      const cartItemId = Number(productId)
      try {
        await cartApi.updateQuantity(userId, cartItemId, newQuantity)
        // Reload cart from backend to sync state (this was the original working behavior)
        await loadCart()
        // Dispatch event for real-time update after successful reload
        window.dispatchEvent(new CustomEvent('cart:refresh'))
        return
      } catch (error: any) {
        console.error('Failed to update backend cart:', error)
        // Show appropriate error message
        if (error?.status === 500) {
          toast.error(t('cart.serverError'))
        } else if (error?.status === 404) {
          toast.error(t('cart.itemNotFound'))
        } else {
          toast.error(t('cart.updateQuantityError'))
        }
        // Reload cart to sync with backend state on error
        await loadCart()
        return
      }
    } else {
      // For non-authenticated users, update localStorage cart
      setCartItems(prevItems => {
        const newItems = prevItems.map(item =>
          item.id === productId && item.size === size && item.color === color
            ? { ...item, quantity: newQuantity }
            : item
        )
        saveCart(newItems)
        return newItems
      })
    }
  }, [isAuthenticated, loadCart, saveCart, removeFromCart])

  // Clear cart
  const clearCart = async () => {
    const userId = getUserId()
    
    if (userId && isAuthenticated) {
      // Clear backend cart
      try {
        await cartApi.clear(userId)
      } catch (error) {
        console.error('Failed to clear backend cart:', error)
      }
    }
    
    // Clear local cart
    setCartItems([])
    setCartItemCount(0)
    localStorage.removeItem('cart')
    // Dispatch event for real-time update
    window.dispatchEvent(new CustomEvent('cart:updated', { 
      detail: { count: 0, items: [] }
    }))
    window.dispatchEvent(new CustomEvent('cart:refresh'))
  }

  // Sync local cart with backend when user logs in
  const syncCartWithBackend = useCallback(async () => {
    try {
      const userId = getUserId()
      if (!userId) return
      
      // Get local cart items
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[]
      
      if (localCart.length === 0) {
        // No local items, just load from backend
        await loadCart()
        return
      }
      
      // Get backend cart
      let backendCart: any
      try {
        backendCart = await cartApi.get(userId)
      } catch (error) {
        console.error('Failed to get backend cart:', error)
        return
      }
      
      // Merge: Add local items to backend
      for (const localItem of localCart) {
        if (localItem.sku_id) {
          try {
            await cartApi.add(userId, localItem.sku_id, localItem.quantity)
          } catch (error) {
            console.error('Failed to sync cart item:', error)
          }
        }
      }
      
      // Clear local cart after sync
      localStorage.removeItem('cart')
      
      // Reload cart from backend
      await loadCart()
      
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent('cart:refresh'))
      
      toast.success(t('cart.synced'))
    } catch (error) {
      console.error('Failed to sync cart:', error)
    }
  }, [loadCart])

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    const deliveryCost = cartItems.length > 0 ? 350 : 0
    const taxRate = 0.12
    const tax = subtotal * taxRate
    const total = subtotal + deliveryCost + tax

    return {
      subtotal,
      deliveryCost,
      tax,
      total,
      itemCount: cartItems.length,
      totalQuantity: cartItemCount
    }
  }

  // Initialize cart
  useEffect(() => {
    loadCart()
  }, [loadCart])
  
  // Listen for cart update events from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart()
    }
    
    window.addEventListener('cart:refresh', handleCartUpdate)
    return () => {
      window.removeEventListener('cart:refresh', handleCartUpdate)
    }
  }, [loadCart])

  // Watch for authentication changes and sync
  useEffect(() => {
    const handleLogin = async () => {
      console.log('Cart: Detected login, syncing with backend...')
      await syncCartWithBackend()
    }
    
    const handleLogout = async () => {
      console.log('Cart: Detected logout, loading from localStorage...')
      await loadCart()
    }
    
    // Listen for auth events
    window.addEventListener('auth:login', handleLogin)
    window.addEventListener('auth:logout', handleLogout)
    
    return () => {
      window.removeEventListener('auth:login', handleLogin)
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [loadCart, syncCartWithBackend])

  return {
    cartItems,
    cartItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateTotals,
    loadCart,
    syncCartWithBackend
  }
}

