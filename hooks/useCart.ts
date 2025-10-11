import { useState, useEffect } from 'react'
import { cartApi } from '@/lib/api'

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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load cart from backend or localStorage
  const loadCart = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        // User is authenticated, fetch from backend
        try {
          const backendCart = await cartApi.get()
          const items = backendCart.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            originalPrice: item.original_price,
            brand: item.brand || 'MARQUE',
            image: item.image || '/images/black-tshirt.jpg',
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            sku_id: item.sku_id
          }))
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
  }

  // Save cart to localStorage
  const saveCart = (items: CartItem[]) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items))
      const totalCount = items.reduce((total, item) => total + item.quantity, 0)
      setCartItemCount(totalCount)
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }

  // Add item to cart
  const addToCart = async (product: Omit<CartItem, 'quantity'>) => {
    const token = localStorage.getItem('authToken')
    
    if (token && product.sku_id) {
      // Add to backend cart
      try {
        await cartApi.add(product.sku_id, 1)
        await loadCart() // Reload cart from backend
        return
      } catch (error) {
        console.error('Failed to add to backend cart:', error)
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
      return newItems
    })
  }

  // Remove item from cart
  const removeFromCart = async (productId: string | number, size?: string, color?: string) => {
    const token = localStorage.getItem('authToken')
    
    if (token && isAuthenticated) {
      // Remove from backend cart
      try {
        await cartApi.remove(Number(productId))
        await loadCart() // Reload cart from backend
        return
      } catch (error) {
        console.error('Failed to remove from backend cart:', error)
        // Fall back to localStorage
      }
    }
    
    // Remove from localStorage cart
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.id === productId && item.size === size && item.color === color)
      )
      saveCart(newItems)
      return newItems
    })
  }

  // Update quantity
  const updateQuantity = async (productId: string | number, newQuantity: number, size?: string, color?: string) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId, size, color)
      return
    }

    const token = localStorage.getItem('authToken')
    
    if (token && isAuthenticated) {
      // Update backend cart
      try {
        await cartApi.updateQuantity(Number(productId), newQuantity)
        await loadCart() // Reload cart from backend
        return
      } catch (error) {
        console.error('Failed to update backend cart:', error)
        // Fall back to localStorage
      }
    }

    // Update localStorage cart
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

  // Clear cart
  const clearCart = async () => {
    const token = localStorage.getItem('authToken')
    
    if (token && isAuthenticated) {
      // Clear backend cart
      try {
        await cartApi.clear()
      } catch (error) {
        console.error('Failed to clear backend cart:', error)
      }
    }
    
    // Clear local cart
    setCartItems([])
    setCartItemCount(0)
    localStorage.removeItem('cart')
  }

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
  }, [])

  return {
    cartItems,
    cartItemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    calculateTotals,
    loadCart
  }
}

