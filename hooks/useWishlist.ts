"use client"
import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/lib/products'

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const storedWishlist = localStorage.getItem('wishlist')
      if (storedWishlist) {
        setWishlistItems(JSON.parse(storedWishlist))
      }
    } catch (error) {
      console.error("Failed to load wishlist from localStorage", error)
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems))
      } catch (error) {
        console.error("Failed to save wishlist to localStorage", error)
      }
    }
  }, [wishlistItems, isClient])

  const addToWishlist = useCallback((product: Product) => {
    setWishlistItems((prevItems) => {
      if (prevItems.find((item) => item.id === product.id)) {
        return prevItems // Already in wishlist
      }
      return [...prevItems, product]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }, [])

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
