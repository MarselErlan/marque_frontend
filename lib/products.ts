// Product data and utilities

export interface Product {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  images?: string[]
  category: string
  subcategory?: string
  sizes?: string[]
  colors?: string[]
  rating?: number
  reviews?: number
  salesCount: number
  inStock?: boolean
  description?: string
  features?: string[]
}

// Sample product data (replace with API calls)
export const allProducts: Product[] = [
  {
    id: "1",
    name: "Футболка спорт. из хлопка",
    brand: "H&M",
    price: 1299,
    originalPrice: 1899,
    discount: 32,
    image: "/black-t-shirt.png",
    category: "Мужчинам",
    subcategory: "Футболки",
    sizes: ["S", "M", "L", "XL"],
    colors: ["black", "white", "gray"],
    rating: 4.5,
    reviews: 124,
    salesCount: 150,
    inStock: true
  },
  {
    id: "2",
    name: "Кроссовки беговые",
    brand: "Nike",
    price: 8999,
    originalPrice: 12999,
    discount: 31,
    image: "/images/white-sneakers.jpg",
    category: "Мужчинам",
    subcategory: "Обувь",
    sizes: ["40", "41", "42", "43", "44"],
    colors: ["white", "black"],
    rating: 4.8,
    reviews: 89,
    salesCount: 120,
    inStock: true
  },
  {
    id: "3",
    name: "Худи oversized",
    brand: "Zara",
    price: 3999,
    originalPrice: 5999,
    discount: 33,
    image: "/images/male-model-hoodie.jpg",
    category: "Мужчинам",
    subcategory: "Толстовки",
    sizes: ["S", "M", "L", "XL"],
    colors: ["black", "gray", "beige"],
    rating: 4.3,
    reviews: 67,
    salesCount: 95,
    inStock: true
  },
  {
    id: "4",
    name: "Кардиган вязаный",
    brand: "Mango",
    price: 4599,
    originalPrice: 6999,
    discount: 34,
    image: "/beige-t-shirt.jpg",
    category: "Женщинам",
    subcategory: "Кардиганы",
    sizes: ["XS", "S", "M", "L"],
    colors: ["beige", "cream", "brown"],
    rating: 4.6,
    reviews: 43,
    salesCount: 75,
    inStock: true
  },
  {
    id: "5",
    name: "Платье летнее",
    brand: "H&M",
    price: 2799,
    originalPrice: 3999,
    discount: 30,
    image: "/images/female-model-yellow.jpg",
    category: "Женщинам",
    subcategory: "Платья",
    sizes: ["XS", "S", "M", "L"],
    colors: ["yellow", "blue", "white"],
    rating: 4.4,
    reviews: 156,
    salesCount: 200,
    inStock: true
  }
]

// Sort products by sales count
export const getProductsBySales = (count?: number): Product[] => {
  const sortedProducts = [...allProducts].sort((a, b) => b.salesCount - a.salesCount)
  return count ? sortedProducts.slice(0, count) : sortedProducts
}

// Get products by category
export const getProductsByCategory = (category: string): Product[] => {
  return allProducts.filter(product => 
    product.category.toLowerCase() === category.toLowerCase()
  )
}

// Get featured products
export const getFeaturedProducts = (count: number = 12): Product[] => {
  return allProducts
    .filter(product => product.discount && product.discount > 25)
    .slice(0, count)
}

// Search products
export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase()
  return allProducts.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.brand.toLowerCase().includes(lowercaseQuery) ||
    product.category.toLowerCase().includes(lowercaseQuery) ||
    (product.subcategory && product.subcategory.toLowerCase().includes(lowercaseQuery))
  )
}

// Get product by ID
export const getProductById = (id: string): Product | undefined => {
  return allProducts.find(product => product.id === id)
}

// Calculate discount percentage
export const calculateDiscount = (originalPrice: number, currentPrice: number): number => {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

// Format price
export const formatPrice = (price: number, currency: string = 'сом'): string => {
  return `${price.toLocaleString()} ${currency}`
}

// Check if product is on sale
export const isOnSale = (product: Product): boolean => {
  return !!(product.originalPrice && product.originalPrice > product.price)
}
