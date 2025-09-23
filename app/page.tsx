"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, LogIn, ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_CONFIG } from "@/lib/config"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function MarquePage() {
  const router = useRouter()
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
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
  const [userData, setUserData] = useState<any>(null)
  const [randomProducts, setRandomProducts] = useState<any[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [bannerRotationIndex, setBannerRotationIndex] = useState(0)
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

  // Check authentication status
  const checkAuthStatus = () => {
    try {
      const authToken = localStorage.getItem('authToken')
      const savedUserData = localStorage.getItem('userData')
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      const isLoggedInFlag = localStorage.getItem('isLoggedIn')
      
      // Check if user was logged in
      if (isLoggedInFlag === 'true' && authToken && savedUserData) {
        // Check if token is still valid
        if (tokenExpiration) {
          const expirationTime = parseInt(tokenExpiration)
          const currentTime = new Date().getTime()
          
          if (currentTime < expirationTime) {
            // Token is still valid
            setIsLoggedIn(true)
            setUserData(JSON.parse(savedUserData))
            console.log('User is logged in with valid token')
    } else {
            // Token has expired, clear auth data
            console.log('Token expired, logging out user')
            handleLogout()
          }
        } else {
          // No expiration time found, assume valid for now
          setIsLoggedIn(true)
          setUserData(JSON.parse(savedUserData))
        }
      } else {
        // No valid authentication found
        setIsLoggedIn(false)
        setUserData(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsLoggedIn(false)
      setUserData(null)
    }
  }

  // Logout function to clear all auth data
  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('expiresInMinutes')
    localStorage.removeItem('market')
    localStorage.removeItem('userData')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('tokenExpiration')
    
    setIsLoggedIn(false)
    setUserData(null)
    console.log('User logged out successfully')
  }

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
    loadCartCount()
    checkAuthStatus()
  }, [])

  // Authentication handlers
  const handleLoginClick = () => {
    setIsLoginModalOpen(false)
    setIsPhoneModalOpen(true)
  }

  // New handler for header login button
  const handleHeaderLoginClick = () => {
    if (isLoggedIn) {
      // User is already logged in, navigate to profile
      router.push('/profile')
    } else {
      // User is not logged in, start phone verification
      setIsPhoneModalOpen(true)
    }
  }

  const handlePhoneSubmit = async () => {
    // Validate phone number is not empty
    if (!phoneNumber.trim()) {
      alert('Пожалуйста, введите номер телефона')
      return
    }

    setIsSendingSms(true)
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
    
    try {
      console.log('Sending SMS to:', fullPhoneNumber)
      console.log('API URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhoneNumber
        }),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('SMS sent successfully:', data)
    setIsPhoneModalOpen(false)
    setIsSmsModalOpen(true)
      } else {
        const errorData = await response.json()
        console.error('Failed to send SMS:', errorData)
        alert(`Не удалось отправить SMS: ${errorData.message || 'Попробуйте еще раз.'}`)
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      alert('Ошибка подключения. Убедитесь что API сервер запущен.')
    } finally {
      setIsSendingSms(false)
    }
  }

  const handleSmsVerification = async () => {
    if (smsCode.length >= 6) {
      setIsVerifyingCode(true)
      try {
        const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
        console.log('Verifying SMS code for:', fullPhoneNumber)
        
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_CODE}`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            phone: fullPhoneNumber,
            code: smsCode
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('SMS verification successful:', data)
          
          // Store complete authentication data
          if (data.data && data.data.access_token) {
            // Store authentication tokens and session info
            localStorage.setItem('authToken', data.data.access_token)
            localStorage.setItem('tokenType', data.data.token_type || 'bearer')
            localStorage.setItem('sessionId', data.data.session_id || '')
            localStorage.setItem('expiresInMinutes', data.data.expires_in_minutes?.toString() || '30')
            localStorage.setItem('market', data.data.market || data.data.user?.market || 'us')
            
            // Store user data
            localStorage.setItem('userData', JSON.stringify(data.data.user))
            localStorage.setItem('isLoggedIn', 'true')
            
            // Calculate and store token expiration time
            const expirationTime = new Date().getTime() + (data.data.expires_in_minutes || 30) * 60 * 1000
            localStorage.setItem('tokenExpiration', expirationTime.toString())
            
            // Update component state
            setUserData(data.data.user)
      setIsLoggedIn(true)
            
            console.log('Authentication data stored:', {
              userId: data.data.user?.id,
              phone: data.data.user?.phone,
              market: data.data.market,
              sessionId: data.data.session_id,
              expiresIn: data.data.expires_in_minutes
            })
          }
          
          setIsSmsModalOpen(false)
      setSmsCode("")
          setPhoneNumber("")
          setCountryCode("+996")
          console.log("User logged in successfully with phone:", `${countryCode} ${phoneNumber}`)
        } else {
          const errorData = await response.json()
          console.error('Failed to verify SMS code:', errorData)
          alert('Неверный код. Попробуйте еще раз.')
        }
      } catch (error) {
        console.error('Error verifying SMS code:', error)
        alert('Ошибка подключения. Проверьте интернет соединение.')
      } finally {
        setIsVerifyingCode(false)
      }
    }
  }

  const handleCountryCodeChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode)
    // Don't set the placeholder as the actual value
  }

  const getFullPhoneNumber = () => `${countryCode} ${phoneNumber}`

  const handleWishlistClick = (productId: number) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true)
    } else {
      console.log(`Added product ${productId} to wishlist`)
    }
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
                  <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-brand">
                    <Heart className="w-5 h-5 mb-1" />
                    <span>Избранные</span>
                  </Link>
                  <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                    <div className="relative">
                    <ShoppingCart className="w-5 h-5 mb-1" />
                      {cartItemCount > 0 && (
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
                    <span>{isLoggedIn ? "Профиль" : "Войти"}</span>
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
        <>
          <div>
            <div className="bg-brand text-white text-xs font-medium px-3 py-1 rounded-full inline-block mb-3">
              Новая коллекция
            </div>
            <div className="text-white text-xl font-bold">Осень-Зима</div>
          </div>
          <div className="text-white/90 text-sm">от 1999 сом</div>
          <div className="absolute right-4 top-4 w-32 h-48 opacity-20">
            <img 
              src="/images/coat.jpg" 
              alt="Coat" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </>
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
          <div className="relative z-10 mb-4">
            <div className="text-lg font-bold mb-2 text-white">до -80%</div>
            <div className="text-5xl font-black mb-0 leading-none text-white">СКИДКИ</div>
            <div className="text-5xl font-black mb-3 leading-none text-white">НЕДЕЛИ</div>
          </div>
          <div className="text-sm opacity-90 text-white relative z-10 mt-6">на все товары</div>
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
        <>
          <div>
            <div className="text-white text-2xl font-black mb-1 leading-tight">КАЧЕСТВО</div>
            <div className="text-white text-2xl font-black mb-1 leading-tight">ЛОКАЛЬНЫХ</div>
            <div className="text-white text-2xl font-black mb-4 leading-tight">БРЕНДОВ</div>
          </div>
          <div>
            <div className="text-white text-lg font-bold mb-1">на Wildberries</div>
            <div className="text-white text-sm opacity-80">при поддержке</div>
            <div className="mt-2 flex items-center">
              <div className="bg-white/20 px-2 py-1 rounded text-xs text-white font-medium">ПЛАТФОРМЫ РОСТА</div>
            </div>
          </div>
        </>
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
      
      // SIMULATION: Get images from product database
      // In real implementation, this would fetch from your actual database
      // The database can return ANY AMOUNT of images - 5, 10, 50, 100+
      const availableImages = allProducts.map(product => ({
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

  // Comprehensive product database for random generation
  const allProducts = [
    // Men's Category
    { id: 1, name: "Футболка спорт. из хлопка", brand: "MARQUE", price: 2999, originalPrice: 3999, discount: true, image: "/images/black-tshirt.jpg", category: "men", sizes: "25" },
    { id: 2, name: "Джинсы slim fit", brand: "DENIM", price: 5999, originalPrice: 7999, discount: true, image: "/images/jeans.jpg", category: "men", sizes: "30-36" },
    { id: 3, name: "Худи oversized", brand: "STREET", price: 4999, originalPrice: null, discount: false, image: "/images/hoodie.jpg", category: "men", sizes: "S-XL" },
    { id: 4, name: "Рубашка классическая", brand: "CLASSIC", price: 3499, originalPrice: 4499, discount: true, image: "/images/shirt.jpg", category: "men", sizes: "38-44" },
    { id: 5, name: "Кроссовки беговые", brand: "SPORT", price: 8999, originalPrice: null, discount: false, image: "/images/sneakers.jpg", category: "men", sizes: "40-45" },
    
    // Women's Category
    { id: 6, name: "Платье летнее", brand: "BLOOM", price: 4599, originalPrice: 6599, discount: true, image: "/images/dress.jpg", category: "women", sizes: "XS-L" },
    { id: 7, name: "Блузка шифоновая", brand: "ELEGANT", price: 3299, originalPrice: null, discount: false, image: "/images/blouse.jpg", category: "women", sizes: "36-42" },
    { id: 8, name: "Юбка мини", brand: "YOUNG", price: 2799, originalPrice: 3799, discount: true, image: "/images/skirt.jpg", category: "women", sizes: "S-L" },
    { id: 9, name: "Джинсы высокая посадка", brand: "DENIM", price: 5499, originalPrice: null, discount: false, image: "/images/high-waist-jeans.jpg", category: "women", sizes: "26-32" },
    { id: 10, name: "Кардиган вязаный", brand: "COZY", price: 4299, originalPrice: 5299, discount: true, image: "/images/cardigan.jpg", category: "women", sizes: "S-XL" },
    
    // Kids Category
    { id: 11, name: "Футболка детская", brand: "KIDS", price: 1999, originalPrice: 2499, discount: true, image: "/images/kids-tshirt.jpg", category: "kids", sizes: "4-12" },
    { id: 12, name: "Платье для девочки", brand: "PRINCESS", price: 3299, originalPrice: null, discount: false, image: "/images/girls-dress.jpg", category: "kids", sizes: "4-10" },
    { id: 13, name: "Шорты для мальчика", brand: "ACTIVE", price: 2299, originalPrice: 2999, discount: true, image: "/images/boys-shorts.jpg", category: "kids", sizes: "4-12" },
    { id: 14, name: "Кроссовки детские", brand: "SPORT", price: 4999, originalPrice: null, discount: false, image: "/images/kids-sneakers.jpg", category: "kids", sizes: "28-35" },
    { id: 15, name: "Куртка демисезон", brand: "WARM", price: 6999, originalPrice: 8999, discount: true, image: "/images/kids-jacket.jpg", category: "kids", sizes: "4-12" },
    
    // Sport Category
    { id: 16, name: "Леггинсы спортивные", brand: "FIT", price: 3599, originalPrice: null, discount: false, image: "/images/sport-leggings.jpg", category: "sport", sizes: "XS-L" },
    { id: 17, name: "Топ для фитнеса", brand: "ACTIVE", price: 2299, originalPrice: 2999, discount: true, image: "/images/sport-top.jpg", category: "sport", sizes: "S-L" },
    { id: 18, name: "Шорты беговые", brand: "RUN", price: 2599, originalPrice: null, discount: false, image: "/images/running-shorts.jpg", category: "sport", sizes: "S-XL" },
    { id: 19, name: "Толстовка спортивная", brand: "SPORT", price: 4599, originalPrice: 5599, discount: true, image: "/images/sport-hoodie.jpg", category: "sport", sizes: "S-XXL" },
    { id: 20, name: "Кроссовки для зала", brand: "GYM", price: 7999, originalPrice: null, discount: false, image: "/images/gym-shoes.jpg", category: "sport", sizes: "36-45" },
    
    // Accessories
    { id: 21, name: "Рюкзак городской", brand: "URBAN", price: 4999, originalPrice: 6999, discount: true, image: "/images/backpack.jpg", category: "accessories", sizes: "One" },
    { id: 22, name: "Часы наручные", brand: "TIME", price: 8999, originalPrice: null, discount: false, image: "/images/watch.jpg", category: "accessories", sizes: "One" },
    { id: 23, name: "Кепка бейсболка", brand: "STREET", price: 1999, originalPrice: 2499, discount: true, image: "/images/cap.jpg", category: "accessories", sizes: "One" },
    { id: 24, name: "Сумка женская", brand: "FASHION", price: 5599, originalPrice: null, discount: false, image: "/images/handbag.jpg", category: "accessories", sizes: "One" },
    { id: 25, name: "Ремень кожаный", brand: "LEATHER", price: 3299, originalPrice: 4299, discount: true, image: "/images/belt.jpg", category: "accessories", sizes: "90-110" },
  ]

  // Function to generate random products
  const generateRandomProducts = (count: number = 25) => {
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5)
    const products = []
    for (let i = 0; i < count; i++) {
      const randomProduct = shuffled[i % allProducts.length]
      products.push({
        ...randomProduct,
        id: `${randomProduct.id}-${Date.now()}-${i}`, // Unique ID for each instance
      })
    }
    return products
  }

  // Load carousel images from database on component mount
  useEffect(() => {
    const loadCarouselImages = async () => {
      const images = await fetchCarouselImagesFromDB()
      setCarouselImages(images)
    }
    
    loadCarouselImages()
  }, [])

  // Banner rotation effect - every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerRotationIndex(prev => (prev + 1) % heroBanners.length)
    }, 15000) // Rotate every 15 seconds

    return () => clearInterval(interval)
  }, [heroBanners.length])

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
    // Initial load
    setRandomProducts(generateRandomProducts(25))

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
          setRandomProducts(prev => [...prev, ...generateRandomProducts(15)])
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 w-full flex justify-center">
        <div style={{width: '1680px', height: '96px', paddingTop: '24px', paddingRight: '160px', paddingBottom: '24px', paddingLeft: '160px'}}>
          <div className="flex items-center justify-between h-12" style={{gap: '40px'}}>
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black tracking-wider">MARQUE</h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center" style={{gap: '40px'}}>
              <Button
                className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg"
                onClick={handleCatalogClick}
              >
                <span className="mr-2">⋮⋮⋮</span>
                Каталог
              </Button>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Товар, бренд или артикул"
                  className="pl-10 pr-4 py-2 w-80 bg-gray-100 border-0 rounded-lg"
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

              {/* User Actions */}
              <div className="flex items-center text-sm text-gray-600" style={{gap: '40px'}}>
                <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-brand">
                  <Heart className="w-5 h-5 mb-1" />
                  <span>Избранные</span>
                </Link>
                <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                  <div className="relative">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                    {cartItemCount > 0 && (
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
                  <span>{isLoggedIn ? "Профиль" : "Войти"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full relative" style={{minHeight: '2000px'}}>
        {/* Picture Carousel - Full Page Width */}
        <section className="w-full mb-8">
          <div className="flex items-center justify-center h-[506px] relative overflow-hidden w-full">
            {getCurrentBanners().map((banner, index) => (
              <div
                key={`${banner.id}-${bannerRotationIndex}-${index}`}
                 className={`absolute rounded-[24px] overflow-hidden transition-all duration-1000 ease-in-out transform ${
                   index === 1 
                     ? 'z-20 scale-100 opacity-100' // Center - large and prominent
                     : index === 0 
                       ? 'z-10 scale-100 opacity-70' // Left - full size at left edge
                       : 'z-10 scale-100 opacity-70' // Right - full size at right edge
                 }`}
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
                    <div className="absolute inset-0">
                      <img 
                        src="/images/coat.jpg" 
                        alt="Collection" 
                    className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="text-2xl font-bold">Новая коллекция</div>
                        <div className="text-lg opacity-90">Осень-Зима</div>
                </div>
          </div>
                  )}
                  
                  {banner.type === 'discount' && (
                    <div className="flex items-center justify-center h-full relative">
                      <div className="text-center text-white z-10">
                        <div className="text-6xl font-black mb-2 leading-none">СКИДКИ</div>
                        <div className="text-6xl font-black mb-4 leading-none">НЕДЕЛИ</div>
                        <div className="text-2xl font-bold">до -80%</div>
          </div>
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-12 right-12 w-24 h-24 bg-white/10 rounded-full animate-bounce"></div>
                        <div className="absolute bottom-12 left-12 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
                        <div className="absolute top-1/2 left-12 w-16 h-16 bg-white/10 rounded-full animate-ping"></div>
                </div>
            </div>
                  )}
                  
                  {banner.type === 'quality' && (
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400/80 to-green-600/80"></div>
                      <div className="absolute top-6 left-6 text-white">
                        <div className="text-3xl font-black mb-1">КАЧЕСТВО</div>
                        <div className="text-3xl font-black mb-1">ЛОКАЛЬНЫХ</div>
                        <div className="text-3xl font-black">БРЕНДОВ</div>
                </div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="text-xl font-bold">на Wildberries</div>
                        <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium mt-2 inline-block">
                          ПЛАТФОРМЫ РОСТА
            </div>
          </div>
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

        {/* Content Container */}
        <div style={{width: '1680px', paddingLeft: '160px', paddingRight: '160px', margin: '0 auto', position: 'relative'}}>
          {/* Products Grid */}
          <section className="mb-12" style={{position: 'absolute', top: '100px', left: '160px'}}>
          <div className="grid grid-cols-5" style={{width: '1360px', minHeight: '1156px', gap: '24px'}}>
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
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                </div>
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={product.image}
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6">MARQUE</h3>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 mb-4">Популярные категории</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>Мужчинам</div>
                  <div>Женщинам</div>
                  <div>Детям</div>
                  <div>Спорт</div>
                  <div>Обувь</div>
                  <div>Аксессуары</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-4">Бренды</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>ECCO</div>
                <div>VANS</div>
                <div>MANGO</div>
                <div>H&M</div>
                <div>LIME</div>
                <div>GUCCI</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>Политика конфиденциальности</div>
            <div>Пользовательское соглашение</div>
          </div>
        </div>
      </footer>

      {/* Phone Verification Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">Введите номер</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">Мы отправим вам код подтверждения</p>
            <div className="space-y-4">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-center text-lg py-3"
                placeholder="+996 505-23-12-55"
              />
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handlePhoneSubmit}
              >
                Продолжить
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Нажимая "Продолжить", вы соглашаетесь с{" "}
              <span className="text-brand cursor-pointer">Политикой конфиденциальности</span> и{" "}
              <span className="text-brand cursor-pointer">Пользовательским соглашением</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Verification Modal */}
      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 p-1"
                onClick={() => {
                  setIsSmsModalOpen(false)
                  setIsPhoneModalOpen(true)
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-center text-xl font-semibold">Код из СМС</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              Мы отправили вам код на номер
              <br />
              {phoneNumber}
            </p>
            <div className="space-y-4">
              <Input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="text-center text-lg py-3 tracking-widest"
                placeholder="233 512"
                maxLength={6}
              />
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handleSmsVerification}
                disabled={smsCode.length < 6}
              >
                Подтвердить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Required Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-brand" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-black">Войдите чтобы добавить товар в избранное</h2>
            </div>
            <div className="flex space-x-3 w-full">
              <Button
                className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handleLoginClick}
              >
                Войти
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-3 rounded-lg bg-transparent"
                onClick={() => setIsLoginModalOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Required Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-brand" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-black">Войдите чтобы добавить товар в избранное</h2>
            </div>
            <div className="flex space-x-3 w-full">
              <Button
                className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handleLoginClick}
              >
                Войти
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-3 rounded-lg bg-transparent"
                onClick={() => setIsLoginModalOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Verification Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">Введите номер</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">Мы отправим вам код подтверждения</p>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center space-x-2">
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 text-lg py-3"
                  placeholder={countryCodes.find(c => c.code === countryCode)?.placeholder || "Phone number"}
                />
              </div>
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handlePhoneSubmit}
                disabled={isSendingSms || !phoneNumber.trim()}
              >
                {isSendingSms ? "Отправляем SMS..." : "Продолжить"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Нажимая "Продолжить", вы соглашаетесь с{" "}
              <span className="text-brand cursor-pointer">Политикой конфиденциальности</span> и{" "}
              <span className="text-brand cursor-pointer">Пользовательским соглашением</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Verification Modal */}
      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 p-1"
                onClick={() => {
                  setIsSmsModalOpen(false)
                  setIsPhoneModalOpen(true)
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-center text-xl font-semibold">Код из СМС</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              Мы отправили вам код на номер
              <br />
              <span className="font-semibold">{getFullPhoneNumber()}</span>
            </p>
            <div className="space-y-4">
              <Input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="text-center text-lg py-3 tracking-widest"
                placeholder="233 512"
                maxLength={6}
              />
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handleSmsVerification}
                disabled={smsCode.length < 6 || isVerifyingCode}
              >
                {isVerifyingCode ? "Проверяем код..." : "Подтвердить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
