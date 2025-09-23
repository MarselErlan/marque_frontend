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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[300px] md:h-[400px]">
            {/* Left Banner */}
            <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-brand text-white text-xs font-medium px-3 py-1 rounded-full inline-block mb-3">
                  Новая коллекция
                </div>
                <div className="text-white text-xl font-bold">Осень-Зима</div>
              </div>
              <div className="text-white/90 text-sm">
                от 1999 сом
              </div>
              {/* Coat image placeholder */}
              <div className="absolute right-4 top-4 w-32 h-48 opacity-20">
                <img 
                  src="/images/coat.jpg" 
                  alt="Coat" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            </div>

            {/* Center Banner - Main Discount */}
            <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl p-6 overflow-hidden flex items-center justify-center">
              <div className="text-center text-white relative z-10">
                <div className="text-lg font-bold mb-2">до -80%</div>
                <div className="text-5xl md:text-6xl font-black mb-0 leading-none">СКИДКИ</div>
                <div className="text-5xl md:text-6xl font-black mb-2 leading-none">НЕДЕЛИ</div>
                <div className="text-sm opacity-90">на все товары</div>
              </div>
              {/* Abstract shapes background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-8 left-6 w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="absolute top-1/2 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
              </div>
            </div>

            {/* Right Banner */}
            <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="text-white text-2xl font-black mb-1 leading-tight">КАЧЕСТВО</div>
                <div className="text-white text-2xl font-black mb-1 leading-tight">ЛОКАЛЬНЫХ</div>
                <div className="text-white text-2xl font-black mb-4 leading-tight">БРЕНДОВ</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold mb-1">на Wildberries</div>
                <div className="text-white text-sm opacity-80">при поддержке</div>
                <div className="mt-2 flex items-center">
                  <div className="bg-white/20 px-2 py-1 rounded text-xs text-white font-medium">
                    ПЛАТФОРМЫ РОСТА
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 15 }, (_, i) => (
              <Link
                key={i}
                href={`/product/${i + 1}`}
                className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group"
              >
                {/* Discount Badge */}
                <div className="relative mb-3">
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
                    %
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </div>
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src="/images/black-tshirt.jpg"
                      alt="Футболка спорт. из хлопка"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase font-medium">MARQUE</div>
                  <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                    Футболка спорт. из хлопка
                  </h3>
                  
                  {/* Price */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-base font-bold text-brand">2999 сом</span>
                    <span className="text-xs text-gray-400 line-through">3999 сом</span>
                  </div>
                  
                  {/* Size Info */}
                  <div className="text-xs text-gray-500">Размеры 25</div>
                </div>
              </Link>
            ))}
          </div>
        </section>


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
