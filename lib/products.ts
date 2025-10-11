// Product data and utilities

export interface Product {
  id: string | number
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
    brand: "MARQUE",
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    image: "/images/black-tshirt.jpg",
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
    brand: "SPORT",
    price: 8999,
    originalPrice: 12999,
    discount: 31,
    image: "/images/black-tshirt.jpg",
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
    name: "Джинсы slim fit",
    brand: "DENIM",
    price: 5999,
    originalPrice: 7999,
    discount: 25,
    image: "/images/black-tshirt.jpg",
    category: "Мужчинам",
    subcategory: "Джинсы",
    sizes: ["30-36", "32-34", "34-36"],
    colors: ["blue", "black", "gray"],
    rating: 4.3,
    reviews: 67,
    salesCount: 95,
    inStock: true
  },
  {
    id: "4",
    name: "Платье летнее",
    brand: "BLOOM",
    price: 4599,
    originalPrice: 6500,
    discount: 29,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Платья",
    sizes: ["XS-L"],
    colors: ["yellow", "green", "pink"],
    rating: 4.6,
    reviews: 43,
    salesCount: 75,
    inStock: true
  },
  {
    id: "5",
    name: "Часы наручные",
    brand: "TIME",
    price: 8999,
    originalPrice: undefined,
    discount: undefined,
    image: "/images/black-tshirt.jpg",
    category: "Мужчинам",
    subcategory: "Аксессуары",
    sizes: ["One"],
    colors: ["gold", "silver", "black"],
    rating: 4.4,
    reviews: 156,
    salesCount: 200,
    inStock: true
  },
  {
    id: "6",
    name: "Худи oversized",
    brand: "FIT",
    price: 3999,
    originalPrice: 5999,
    discount: 33,
    image: "/images/black-tshirt.jpg",
    category: "Мужчинам",
    subcategory: "Толстовки",
    sizes: ["S", "M", "L", "XL"],
    colors: ["black", "gray", "beige"],
    rating: 4.3,
    reviews: 67,
    salesCount: 180,
    inStock: true
  },
  {
    id: "7",
    name: "Леггинсы спортивные",
    brand: "DENIM",
    price: 3999,
    originalPrice: 5999,
    discount: 33,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Спортивная одежда",
    sizes: ["XS", "S", "M", "L"],
    colors: ["olive", "black", "gray"],
    rating: 4.7,
    reviews: 89,
    salesCount: 140,
    inStock: true
  },
  {
    id: "8",
    name: "Джинсы высокой посадки",
    brand: "URBAN",
    price: 6999,
    originalPrice: 8999,
    discount: 22,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Джинсы",
    sizes: ["25-32"],
    colors: ["blue", "black", "white"],
    rating: 4.5,
    reviews: 78,
    salesCount: 110,
    inStock: true
  },
  {
    id: "9",
    name: "Рюкзак городской",
    brand: "ELEGANT",
    price: 4999,
    originalPrice: 6999,
    discount: 29,
    image: "/images/black-tshirt.jpg",
    category: "Мужчинам",
    subcategory: "Аксессуары",
    sizes: ["One"],
    colors: ["black", "navy", "gray"],
    rating: 4.6,
    reviews: 92,
    salesCount: 130,
    inStock: true
  },
  {
    id: "10",
    name: "Блузка шифоновая",
    brand: "ELEGANT",
    price: 3999,
    originalPrice: 5999,
    discount: 33,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Блузки",
    sizes: ["XS", "S", "M", "L"],
    colors: ["beige", "white", "pink"],
    rating: 4.4,
    reviews: 65,
    salesCount: 85,
    inStock: true
  },
  {
    id: "11",
    name: "Футболка базовая",
    brand: "MARQUE",
    price: 1999,
    originalPrice: 2999,
    discount: 33,
    image: "/images/black-tshirt.jpg",
    category: "Мужчинам",
    subcategory: "Футболки",
    sizes: ["S", "M", "L", "XL"],
    colors: ["black", "white", "gray"],
    rating: 4.2,
    reviews: 234,
    salesCount: 300,
    inStock: true
  },
  {
    id: "12",
    name: "Платье вечернее",
    brand: "BLOOM",
    price: 8999,
    originalPrice: 12999,
    discount: 31,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Платья",
    sizes: ["XS", "S", "M", "L"],
    colors: ["olive", "black", "navy"],
    rating: 4.8,
    reviews: 45,
    salesCount: 60,
    inStock: true
  },
  {
    id: "13",
    name: "Сумка кожаная",
    brand: "TIME",
    price: 7999,
    originalPrice: 9999,
    discount: 20,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Аксессуары",
    sizes: ["One"],
    colors: ["brown", "black", "cognac"],
    rating: 4.7,
    reviews: 156,
    salesCount: 90,
    inStock: true
  },
  {
    id: "14",
    name: "Кроссовки белые",
    brand: "SPORT",
    price: 6999,
    originalPrice: 8999,
    discount: 22,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Обувь",
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["white", "gray", "pink"],
    rating: 4.5,
    reviews: 189,
    salesCount: 250,
    inStock: true
  },
  {
    id: "15",
    name: "Толстовка с капюшоном",
    brand: "FIT",
    price: 4999,
    originalPrice: 6999,
    discount: 29,
    image: "/images/black-tshirt.jpg",
    category: "Женщинам",
    subcategory: "Толстовки",
    sizes: ["XS", "S", "M", "L"],
    colors: ["gray", "pink", "white"],
    rating: 4.4,
    reviews: 123,
    salesCount: 160,
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
