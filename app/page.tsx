"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, LogIn, ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_CONFIG } from "@/lib/config"
import { getProductsBySales } from "@/lib/products"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"

export default function MarquePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()
  const { isLoggedIn } = auth
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItemCount } = useWishlist()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("Мужчинам")
  const [cartItemCount, setCartItemCount] = useState(0)
  
  // Authentication states
  const [countryCode, setCountryCode] = useState("+996")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [randomProducts, setRandomProducts] = useState<any[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [bannerRotationIndex, setBannerRotationIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)
  // This comment is added to force a Railway redeployment.

  const searchSuggestions = [
    "футболка",
    "футболка мужская",
    "футболка женская",
    "футболка из хлопка",
    "футболка чёрная",
  ]

  // Country codes for phone input
  const countryCodes = [
    { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
    { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
  ]

  // checkAuthStatus and handleLogout are now handled by the useAuth hook.

  // Load cart count from localStorage
  const loadCartCount = () => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const totalItems = existingCart.reduce((total: number, item: any) => total + item.quantity, 0)
      setCartItemCount(totalItems)
    } catch (error) {
      console.error('Error loading cart count:', error)
      setCartItemCount(0)
    }
  }

  // Load cart count on component mount
  useEffect(() => {
    setIsClient(true)
    loadCartCount()
    if (searchParams.get('catalog') === 'true') {
      setShowCatalog(true)
    }
  }, [searchParams])

  // New handler for header login button
  const handleHeaderLoginClick = () => {
    auth.requireAuth(() => {
      router.push('/profile')
    })
  }

  const handleWishlistClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    auth.requireAuth(() => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id)
      } else {
        addToWishlist(product)
      }
    })
  }

  const handleCatalogClick = () => {
    setShowCatalog(true)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSearchSuggestions(value.length > 0)
  }

  const handleSearchFocus = () => {
    if (searchQuery.length > 0) {
      setShowSearchSuggestions(true)
    }
  }

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSearchSuggestions(false), 200)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSearchSuggestions(false)
  }

  const removeSuggestion = (suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, you would remove this from user's search history
    console.log("Remove suggestion:", suggestion)
  }

  const catalogCategories = [
    { name: "Мужчинам", active: selectedCatalogCategory === "Мужчинам" },
    { name: "Женщинам", active: selectedCatalogCategory === "Женщинам" },
    { name: "Детям", active: selectedCatalogCategory === "Детям" },
    { name: "Спорт", active: selectedCatalogCategory === "Спорт" },
    { name: "Обувь", active: selectedCatalogCategory === "Обувь" },
    { name: "Аксессуары", active: selectedCatalogCategory === "Аксессуары" },
    { name: "Бренды", active: selectedCatalogCategory === "Бренды" },
  ]

  const menCategories = [
    { name: "Футболки и поло", count: 2352, image: "/images/black-tshirt.jpg" },
    { name: "Рубашки", count: 2375, image: "/images/black-tshirt.jpg" },
    { name: "Свитшоты и худи", count: 8533, image: "/images/black-tshirt.jpg" },
    { name: "Джинсы", count: 1254, image: "/images/black-tshirt.jpg" },
    { name: "Брюки и шорты", count: 643, image: "/images/black-tshirt.jpg" },
    { name: "Костюмы и пиджаки", count: 124, image: "/images/black-tshirt.jpg" },
    { name: "Верхняя одежда", count: 74, image: "/images/black-tshirt.jpg" },
    { name: "Спортивная одежда", count: 2362, image: "/images/black-tshirt.jpg" },
    { name: "Нижнее белье", count: 7634, image: "/images/black-tshirt.jpg" },
    { name: "Домашняя одежда", count: 23, image: "/images/black-tshirt.jpg" },
  ]

  const womenCategories = [
    { name: "Платья", count: 1852, image: "/images/black-tshirt.jpg" },
    { name: "Блузки и рубашки", count: 1275, image: "/images/black-tshirt.jpg" },
    { name: "Футболки и топы", count: 2533, image: "/images/black-tshirt.jpg" },
    { name: "Джинсы", count: 954, image: "/images/black-tshirt.jpg" },
    { name: "Брюки и леггинсы", count: 743, image: "/images/black-tshirt.jpg" },
    { name: "Юбки", count: 324, image: "/images/black-tshirt.jpg" },
    { name: "Верхняя одежда", count: 174, image: "/images/black-tshirt.jpg" },
    { name: "Спортивная одежда", count: 1362, image: "/images/black-tshirt.jpg" },
    { name: "Нижнее белье", count: 2634, image: "/images/black-tshirt.jpg" },
    { name: "Домашняя одежда", count: 123, image: "/images/black-tshirt.jpg" },
  ]

  const getCurrentCategories = () => {
    switch (selectedCatalogCategory) {
      case "Женщинам":
        return womenCategories
      case "Мужчинам":
      default:
        return menCategories
    }
  }

  // Show catalog page if catalog is open
  if (showCatalog) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-black tracking-wider">MARQUE</h1>
              </div>

              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <Button
                  className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg"
                  onClick={() => setShowCatalog(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Каталог
                </Button>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Товар, бренд или артикул"
                    className="pl-10 pr-4 py-2 w-80 bg-gray-100 border-0 rounded-lg"
                  />
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                    <Heart className="w-5 h-5 mb-1" />
                    {isClient && wishlistItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {wishlistItemCount}
                      </span>
                    )}
                    <span>Избранные</span>
                  </Link>
                  <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                    <div className="relative">
                    <ShoppingCart className="w-5 h-5 mb-1" />
                      {isClient && cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </div>
                    <span>Корзина</span>
                  </Link>
                  <button 
                    onClick={handleHeaderLoginClick}
                    className="flex flex-col items-center cursor-pointer hover:text-brand bg-transparent border-none p-0"
                  >
                    <User className="w-5 h-5 mb-1" />
                    <span>{isClient && isLoggedIn ? "Профиль" : "Войти"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Catalog Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 bg-white rounded-lg p-6">
              <nav className="space-y-2">
                {catalogCategories.map((category, index) => (
                  <div
                    key={index}
                    className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                      category.active
                        ? "bg-brand-50 text-brand border-l-4 border-brand"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCatalogCategory(category.name)}
                  >
                    {category.name}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black mb-8">{selectedCatalogCategory}</h1>
              <div className="grid grid-cols-2 gap-6">
                {getCurrentCategories().map((category, index) => (
                  <Link
                    key={index}
                    href={`/subcategory/${selectedCatalogCategory.toLowerCase()}/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4"
                  >
                    <img
                      src={category.image || "/placeholder.svg?height=60&width=60&query=clothing item"}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-black mb-1">{category.name}</h3>
                      <span className="text-gray-500 text-sm">{category.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const categories = [
    {
      title: "Мужчинам",
      image: "/images/male-model-black.jpg",
      bgColor: "bg-gray-100",
      href: "/category/muzhchinam",
    },
    {
      title: "Женщинам",
      image: "/images/female-model-olive.jpg",
      bgColor: "bg-brand-50",
      href: "/category/zhenshchinam",
    },
    {
      title: "Детям",
      image: "/images/kids-yellow-blue.jpg",
      bgColor: "bg-yellow-50",
      href: "/category/detyam",
    },
    {
      title: "Обувь",
      image: "/images/white-sneakers.jpg",
      bgColor: "bg-gray-50",
      href: "/category/obuv",
    },
    {
      title: "Спорт",
      image: "/images/male-model-hoodie.jpg",
      bgColor: "bg-gray-100",
      href: "/category/sport",
    },
  ]

  // Hero banners for rotation (design dimensions)
  const heroBanners = [
    {
      id: 'collection',
      type: 'collection',
      width: '712px',
      height: '400px',
      gradient: 'from-orange-400 to-orange-600',
      content: (
        <></>
      )
    },
    {
      id: 'discount',
      type: 'discount',
      width: '900px',
      height: '506px',
      gradient: 'from-purple-500 via-pink-500 to-orange-500',
      content: (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-6 right-12 w-24 h-24 bg-white/10 rounded-full animate-bounce"></div>
            <div className="absolute bottom-12 left-8 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 left-6 w-16 h-16 bg-white/10 rounded-full animate-ping"></div>
          </div>
        </>
      )
    },
    {
      id: 'quality',
      type: 'quality',
      width: '712px',
      height: '400px',
      gradient: 'from-green-400 to-green-600',
      content: (
        <></>
      )
    }
  ]

  // Dynamic carousel images from database (can be any amount)
  const [carouselImages, setCarouselImages] = useState<any[]>([])

  // Fetch carousel images from database (dynamic amount)
  const fetchCarouselImagesFromDB = async () => {
    // TODO: Replace with actual API call to your database
    // Example: const response = await fetch('/api/carousel-images')
    // Example: return await response.json()
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // SIMULATION: Get images from centralized product dataset
      // Use shared lib products to avoid broken image paths
      const availableImages = getProductsBySales().map(product => ({
        id: product.id,
        src: product.image,
        alt: product.name,
        category: product.category,
        brand: product.brand,
        // Add any other database fields like price, rating, etc.
      }))
      
      // Shuffle and return ALL available images from database
      // The carousel will cycle through ALL of them, regardless of count
      const shuffledImages = [...availableImages].sort(() => Math.random() - 0.5)
      
      console.log(`✅ Loaded ${shuffledImages.length} images from database for carousel`)
      return shuffledImages // Dynamic amount based on database content
    } catch (error) {
      console.error('❌ Error fetching carousel images:', error)
      return []
    }
  }

  // Complete product database sorted by sales (best-selling first)
  const allProducts = [
    // Best-selling products first
    { id: 1, name: "Футболка спорт. из хлопка", brand: "MARQUE", price: 2999, originalPrice: 3999, discount: true, image: "/images/black-tshirt.jpg", category: "men", sizes: "25", salesCount: 1247 },
    { id: 5, name: "Кроссовки беговые", brand: "SPORT", price: 8999, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "men", sizes: "40-45", salesCount: 985 },
    { id: 2, name: "Джинсы slim fit", brand: "DENIM", price: 5999, originalPrice: 7999, discount: true, image: "/images/black-tshirt.jpg", category: "men", sizes: "30-36", salesCount: 876 },
    { id: 6, name: "Платье летнее", brand: "BLOOM", price: 4599, originalPrice: 6599, discount: true, image: "/images/black-tshirt.jpg", category: "women", sizes: "XS-L", salesCount: 743 },
    { id: 22, name: "Часы наручные", brand: "TIME", price: 8999, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "accessories", sizes: "One", salesCount: 692 },
    { id: 3, name: "Худи oversized", brand: "STREET", price: 4999, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "men", sizes: "S-XL", salesCount: 634 },
    { id: 16, name: "Леггинсы спортивные", brand: "FIT", price: 3599, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "sport", sizes: "XS-L", salesCount: 587 },
    { id: 9, name: "Джинсы высокая посадка", brand: "DENIM", price: 5499, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "women", sizes: "26-32", salesCount: 521 },
    { id: 21, name: "Рюкзак городской", brand: "URBAN", price: 4999, originalPrice: 6999, discount: true, image: "/images/black-tshirt.jpg", category: "accessories", sizes: "One", salesCount: 478 },
    { id: 7, name: "Блузка шифоновая", brand: "ELEGANT", price: 3299, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "women", sizes: "36-42", salesCount: 456 },
    { id: 20, name: "Кроссовки для зала", brand: "GYM", price: 7999, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "sport", sizes: "36-45", salesCount: 423 },
    { id: 4, name: "Рубашка классическая", brand: "CLASSIC", price: 3499, originalPrice: 4499, discount: true, image: "/images/black-tshirt.jpg", category: "men", sizes: "38-44", salesCount: 389 },
    { id: 10, name: "Кардиган вязаный", brand: "COZY", price: 4299, originalPrice: 5299, discount: true, image: "/images/black-tshirt.jpg", category: "women", sizes: "S-XL", salesCount: 342 },
    { id: 17, name: "Топ для фитнеса", brand: "ACTIVE", price: 2299, originalPrice: 2999, discount: true, image: "/images/black-tshirt.jpg", category: "sport", sizes: "S-L", salesCount: 298 },
    { id: 24, name: "Сумка женская", brand: "FASHION", price: 5599, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "accessories", sizes: "One", salesCount: 267 },
    { id: 11, name: "Футболка детская", brand: "KIDS", price: 1999, originalPrice: 2499, discount: true, image: "/images/black-tshirt.jpg", category: "kids", sizes: "4-12", salesCount: 234 },
    { id: 19, name: "Толстовка спортивная", brand: "SPORT", price: 4599, originalPrice: 5599, discount: true, image: "/images/black-tshirt.jpg", category: "sport", sizes: "S-XXL", salesCount: 212 },
    { id: 8, name: "Юбка мини", brand: "YOUNG", price: 2799, originalPrice: 3799, discount: true, image: "/images/black-tshirt.jpg", category: "women", sizes: "S-L", salesCount: 187 },
    { id: 14, name: "Кроссовки детские", brand: "SPORT", price: 4999, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "kids", sizes: "28-35", salesCount: 156 },
    { id: 23, name: "Кепка бейсболка", brand: "STREET", price: 1999, originalPrice: 2499, discount: true, image: "/images/black-tshirt.jpg", category: "accessories", sizes: "One", salesCount: 143 },
    { id: 18, name: "Шорты беговые", brand: "RUN", price: 2599, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "sport", sizes: "S-XL", salesCount: 132 },
    { id: 12, name: "Платье для девочки", brand: "PRINCESS", price: 3299, originalPrice: null, discount: false, image: "/images/black-tshirt.jpg", category: "kids", sizes: "4-10", salesCount: 119 },
    { id: 25, name: "Ремень кожаный", brand: "LEATHER", price: 3299, originalPrice: 4299, discount: true, image: "/images/black-tshirt.jpg", category: "accessories", sizes: "90-110", salesCount: 98 },
    { id: 15, name: "Куртка демисезон", brand: "WARM", price: 6999, originalPrice: 8999, discount: true, image: "/images/black-tshirt.jpg", category: "kids", sizes: "4-12", salesCount: 87 },
      { id: 13, name: "Шорты для мальчика", brand: "ACTIVE", price: 2299, originalPrice: 2999, discount: true, image: "/black-t-shirt.png", category: "kids", sizes: "4-12", salesCount: 76 },
    ]

  // Use the optimized function from lib/products
  const getProductsBySalesLocal = (count: number = 25) => {
    const products = getProductsBySales()
    const result = []
    for (let i = 0; i < count; i++) {
      const product = products[i % products.length]
      result.push({
        ...product,
        id: `${product.id}-${Date.now()}-${i}`, // Unique ID for each instance
      })
    }
    return result
  }

  // Load carousel images from database on component mount
  useEffect(() => {
    const loadCarouselImages = async () => {
      const images = await fetchCarouselImagesFromDB()
      setCarouselImages(images)
    }
    
    loadCarouselImages()
  }, [])

  // Banner rotation effect - every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerRotationIndex(prev => (prev + 1) % heroBanners.length)
    }, 10000) // Rotate every 10 seconds

    return () => clearInterval(interval)
  }, [heroBanners.length])

  // Handle banner click to move to center
  const handleBannerClick = (clickedIndex: number) => {
    // If left banner (index 0) is clicked, move it to center
    if (clickedIndex === 0) {
      setBannerRotationIndex(prev => (prev - 1 + heroBanners.length) % heroBanners.length)
    }
    // If right banner (index 2) is clicked, move it to center
    else if (clickedIndex === 2) {
      setBannerRotationIndex(prev => (prev + 1) % heroBanners.length)
    }
    // If center banner (index 1) is clicked, do nothing or add custom action
  }

  // Get current 3 banners in rotation order (right → center → left → right)
  const getCurrentBanners = () => {
    const banners = []
    for (let i = 0; i < 3; i++) {
      const index = (bannerRotationIndex + i) % heroBanners.length
      banners.push(heroBanners[index])
    }
    return banners
  }

  // Infinite scroll effect
  useEffect(() => {
    // Initial load - products ordered by sales
    setRandomProducts(getProductsBySalesLocal(25))

    const handleScroll = () => {
      if (isLoadingMore) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Load more when user scrolls to 80% of the page
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        setIsLoadingMore(true)
        
        // Simulate loading delay
        setTimeout(() => {
          setRandomProducts(prev => [...prev, ...getProductsBySalesLocal(15)])
          setIsLoadingMore(false)
        }, 500)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore])

  // Get current 3 images for carousel display (from any amount available in DB)
  const getCurrentCarouselImages = () => {
    if (carouselImages.length === 0) return [] // No images loaded yet
    
    const images = []
    const totalImages = carouselImages.length
    
    // Always show 3 images, but cycle through all available from database
    for (let i = 0; i < 3; i++) {
      const index = (carouselIndex + i) % totalImages
      images.push(carouselImages[index])
    }
    return images
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        {/* Desktop Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo and Catalog */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-bold text-black tracking-wider cursor-pointer">MARQUE</h1>
              </Link>
              <Button
                className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg"
                onClick={handleCatalogClick}
              >
                <span className="mr-2">⋮⋮⋮</span>
                Каталог
              </Button>
            </div>

            {/* Center Section - Search Bar */}
            <div className="flex-1 flex justify-center px-8">
              <div className="relative max-w-2xl w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Товар, бренд или артикул"
                  className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
                {showSearchSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
                    {searchSuggestions
                      .filter((suggestion) => suggestion.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-center space-x-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{suggestion}</span>
                          </div>
                          <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={(e) => removeSuggestion(suggestion, e)}
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              </div>

            {/* Right Section - User Actions */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
              <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                  <Heart className="w-5 h-5 mb-1" />
                  {isClient && wishlistItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {wishlistItemCount}
                    </span>
                  )}
                  <span>Избранные</span>
                </Link>
              <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  {isClient && cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  )}
                </div>
                  <span>Корзина</span>
                </Link>
              <button 
                onClick={handleHeaderLoginClick}
                className="flex flex-col items-center cursor-pointer hover:text-brand bg-transparent border-none p-0"
              >
                  <User className="w-5 h-5 mb-1" />
                <span>{isClient && isLoggedIn ? "Профиль" : "Войти"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden px-4 pt-2 pb-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-xl font-bold text-black tracking-wider cursor-pointer">MARQUE</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/wishlist" className="p-2 relative">
                <Heart className="w-6 h-6 text-gray-600" />
                {isClient && wishlistItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistItemCount}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="p-2 relative">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {isClient && cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <button onClick={handleHeaderLoginClick} className="p-2">
                <User className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <Button
              className="bg-brand hover:bg-brand-hover text-white p-2 rounded-lg"
              onClick={handleCatalogClick}
            >
              <span className="text-xl">⋮⋮⋮</span>
            </Button>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Товар, бренд или артикул"
                className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full relative">
        {/* Picture Carousel - Desktop Only */}
        <section className="w-full mb-8 mt-8 hidden md:block">
          <div className="flex items-center justify-center h-[506px] relative overflow-hidden w-full">
            {getCurrentBanners().map((banner, index) => (
              <div
                key={`${banner.id}-${bannerRotationIndex}-${index}`}
                 className={`absolute rounded-[24px] overflow-hidden transition-all duration-1000 ease-in-out transform cursor-pointer ${
                   index === 1 
                     ? 'z-20 scale-100 opacity-100' // Center - large and prominent
                     : index === 0 
                       ? 'z-10 scale-100 opacity-100 hover:opacity-100 hover:scale-105' // Left - full size at left edge
                       : 'z-10 scale-100 opacity-100 hover:opacity-100 hover:scale-105' // Right - full size at right edge
                 }`}
                onClick={() => handleBannerClick(index)}
                style={{
                  width: index === 1 ? '900px' : '712px', // Center 900px, sides 712px
                  height: index === 1 ? '506px' : '400px', // Center 506px, sides 400px
                  left: index === 1 ? '50%' : 
                        index === 0 ? '-356px' : // Left: half of 712px off screen
                        'calc(100vw - 356px)', // Right: half of 712px off screen from right
                  transform: index === 1 ? 'translateX(-50%)' : 
                           index === 0 ? 'translateX(0)' : 
                           'translateX(0)'
                }}
              >
                {/* Pure image/content without text overlay for focus on pictures */}
                <div className={`w-full h-full bg-gradient-to-br ${banner.gradient} rounded-[24px] relative overflow-hidden`}>
                  {banner.type === 'collection' && (
                    <div className="relative h-full overflow-hidden">
                      {/* Background Image */}
                      <img 
                        src="/b93dc4af6b33446ca2a5472bc63797bc73a9eae2.png" 
                        alt="Collection Banner" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-orange-400', 'to-orange-600');
                        }}
                      />
                      {/* Overlay for depth */}
                      <div className="absolute inset-0 bg-black/10"></div>
                </div>
                  )}
                  
                  {banner.type === 'discount' && (
                    <div className="relative h-full overflow-hidden">
                      {/* Background Image */}
                      <img 
                        src="/fcdeeb08e8c20a6a5cf5276b59b60923dfb8c706(1).png" 
                        alt="Sale Banner" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-500', 'via-pink-500', 'to-orange-500');
                        }}
                      />
                      {/* Overlay for text readability */}
                      <div className="absolute inset-0 bg-black/20"></div>
                      {/* Content */}
                      <div className="flex items-center justify-center h-full relative">
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-12 right-12 w-24 h-24 bg-white/10 rounded-full animate-bounce"></div>
                          <div className="absolute bottom-12 left-12 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
                          <div className="absolute top-1/2 left-12 w-16 h-16 bg-white/10 rounded-full animate-ping"></div>
          </div>
                </div>
            </div>
                  )}
                  
                  {banner.type === 'quality' && (
                    <div className="relative h-full overflow-hidden">
                      {/* Background Image */}
                      <img 
                        src="/5891ae04bafdf76a4d441c78c7e1f8a0a3a1d631.png" 
                        alt="Quality Banner" 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { 
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-green-400', 'to-green-600');
                        }}
                      />
                      {/* Overlay for depth */}
                      <div className="absolute inset-0 bg-black/10"></div>
          </div>
                  )}
                </div>
            </div>
            ))}
            
            {/* Navigation indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
              {heroBanners.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === bannerRotationIndex % heroBanners.length
                      ? 'bg-white' 
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Mobile Banner Carousel */}
        <section className="w-full my-4 md:hidden">
          <div className="h-48 relative overflow-hidden flex items-center justify-center">
            {getCurrentBanners().map((banner, index) => (
              <div
                key={`${banner.id}-${bannerRotationIndex}-${index}`}
                className={`absolute rounded-xl overflow-hidden transition-all duration-1000 ease-in-out transform cursor-pointer`}
                onClick={() => handleBannerClick(index)}
                style={{
                  width: 'calc(100vw - 80px)',
                  height: index === 1 ? '100%' : '90%',
                  zIndex: index === 1 ? 20 : 10,
                  left: '50%',
                  transform: 
                    index === 1 ? 'translateX(-50%)' : 
                    (index === 0 ? 'translateX(calc(-50% - 45vw)) scale(0.9)' : 'translateX(calc(-50% + 45vw)) scale(0.9)'),
                }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${banner.gradient} rounded-xl relative overflow-hidden`}>
                  {banner.type === 'collection' && (
                    <div className="relative h-full overflow-hidden">
                      <img src="/b93dc4af6b33446ca2a5472bc63797bc73a9eae2.png" alt="Collection Banner" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                  )}
                  {banner.type === 'discount' && (
                    <div className="relative h-full overflow-hidden">
                      <img src="/fcdeeb08e8c20a6a5cf5276b59b60923dfb8c706(1).png" alt="Sale Banner" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white p-4">
                        <span className="text-sm font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-md">до -80%</span>
                        <h2 className="text-3xl font-black mt-2">СКИДКИ</h2>
                        <p className="text-lg font-bold">ПОСПЕЛИ</p>
                      </div>
                    </div>
                  )}
                  {banner.type === 'quality' && (
                    <div className="relative h-full overflow-hidden">
                      <img src="/5891ae04bafdf76a4d441c78c7e1f8a0a3a1d631.png" alt="Quality Banner" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Navigation indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
              {heroBanners.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === bannerRotationIndex % heroBanners.length
                      ? 'bg-white' 
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="px-4 md:px-0" style={{maxWidth: '1680px', margin: '0 auto'}}>
          {/* Products Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6" style={{minHeight: '1156px'}}>
              {randomProducts.map((product, i) => (
                <Link
                  key={`${product.id}-${i}`}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group"
                >
                  {/* Discount Badge */}
                  <div className="relative mb-3">
                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
                        %
                  </div>
                    )}
                    <div className="absolute top-2 right-2 z-10">
                      <button onClick={(e) => handleWishlistClick(e, product)}>
                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src="/images/black-tshirt.jpg"
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase font-medium">{product.brand}</div>
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    
                    {/* Price */}
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">{product.price} сом</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">{product.originalPrice} сом</span>
                      )}
                    </div>
                    
                    {/* Size Info */}
                    <div className="text-xs text-gray-500">Размеры {product.sizes}</div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Loading Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                <span className="ml-3 text-gray-600">Загружаем ещё товары...</span>
                  </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
