import { useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  brand: string
  image: string
  quantity: number
  size?: string
  color?: string
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartItemCount, setCartItemCount] = useState(0)

  // Load cart from localStorage
  const loadCart = () => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(existingCart)
      
      const totalCount = existingCart.reduce((total: number, item: CartItem) => total + item.quantity, 0)
      setCartItemCount(totalCount)
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
  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
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
  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.id === productId && item.size === size && item.color === color)
      )
      saveCart(newItems)
      return newItems
    })
  }

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number, size?: string, color?: string) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size, color)
      return
    }

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
  const clearCart = () => {
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
