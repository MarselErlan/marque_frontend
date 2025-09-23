"use client"
import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, Star, Check, LogIn, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_CONFIG } from "@/lib/config"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false)
  const [countryCode, setCountryCode] = useState("+996")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  // Mock product data - in real app this would come from API
  const product = {
    id: params.id,
    name: "Футболка спорт из хлопка",
    price: "2999 сом",
    rating: 4.4,
    reviewCount: 20,
    sold: 120,
    images: [
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "black", label: "Чёрный", color: "#000000" },
      { name: "white", label: "Белый", color: "#FFFFFF" },
    ],
    description: `В нем сочетается, что мы ценим в спортивной одежде: быстро сохнущий, с легким охлаждающим эффектом, эластичный и дышащий. Эта футболка обеспечивает максимальный комфорт во время тренировок. Футболка обладает отличной посадкой, высоким качеством материалов, отличным качеством пошива и стильным дизайном.`,
    specifications: {
      Пол: "Мужской/Женский",
      Цвет: "Чёрный",
      Материал: "100% хлопок, 180г/м²",
      Сезон: "Мужской",
      Страна: "Турция",
      Бренд: "Турция",
    },
  }

  const reviews = [
    {
      id: 1,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
    {
      id: 2,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
    {
      id: 3,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
  ]

  const similarProducts = [
    {
      id: 1,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
    {
      id: 2,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
    {
      id: 3,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
    {
      id: 4,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
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

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add item to cart (in real app, this would be stored in context/state management)
    const cartItem = {
      id: Date.now(), // Generate unique ID
      productId: product.id,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      price: parseInt(product.price.replace(/\D/g, '')), // Extract numeric price
      image: product.images[0]
    }
    
    // Store in localStorage for demo purposes
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItemIndex = existingCart.findIndex(
      (item: any) => item.productId === product.id && item.size === selectedSize && item.color === selectedColor
    )
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantity
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    setIsAddingToCart(false)
    setIsAddedToCart(true)
    
    // Update cart count
    loadCartCount()
    
    // Reset success state after 2 seconds
    setTimeout(() => setIsAddedToCart(false), 2000)
    
    console.log("Added to cart:", cartItem)
  }

  const handleCompare = () => {
    console.log("Added to compare:", product.id)
  }

  const handleWishlist = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true)
    } else {
      console.log("Added to wishlist:", product.id)
    }
  }

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

  const handleGoToCart = () => {
    router.push('/cart')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-black tracking-wider">
                MARQUE
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/category/мужчинам" className="hover:text-brand">
            Мужчинам
          </Link>
          <span>›</span>
          <Link href="/subcategory/мужчинам/футболки-и-поло" className="hover:text-brand">
            Футболки и поло
          </Link>
          <span>›</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImageIndex] || "/placeholder.svg?height=500&width=500&query=black t-shirt"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-purple-500" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image || "/placeholder.svg?height=80&width=80&query=black t-shirt"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Продано {product.sold}</span>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Размер</h3>
              <div className="flex space-x-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-4 py-2 border rounded-lg ${
                      selectedSize === size
                        ? "border-purple-500 bg-purple-50 text-brand"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Цвет</h3>
              <div className="flex space-x-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color.name ? "border-purple-500" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.color }}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.label}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">Чёрный</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {isAddedToCart ? (
                <div className="flex space-x-2">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
                    disabled
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Добавлено в корзину
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-3 rounded-lg border-purple-500 text-brand hover:bg-purple-50"
                    onClick={handleGoToCart}
                  >
                    Перейти в корзину
                  </Button>
                </div>
              ) : (
                <Button
                  className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-lg disabled:opacity-50"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? "Добавляем..." : "Добавить в корзину"}
                </Button>
              )}
              
              {!isAddedToCart && (
                <>
                  <Button variant="outline" className="px-6 py-3 rounded-lg bg-transparent" onClick={handleCompare}>
                    Сравнить товар
                  </Button>
                  <Button variant="outline" size="icon" className="p-3 rounded-lg bg-transparent" onClick={handleWishlist}>
                    <Heart className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Description */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-4">О товаре</h2>
          <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

          {/* Specifications Table */}
          <div className="bg-white rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600">{key}</span>
                  <span className="text-black font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Отзывы</h2>
            <Button variant="ghost" className="text-brand hover:text-purple-700">
              ВСЕ ОТЗЫВЫ →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-brand font-semibold text-sm">
                      {review.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">{review.author}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-4">{review.text}</p>

                <div className="flex space-x-2">
                  {review.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg?height=60&width=60&query=product review"}
                      alt={`Review ${index + 1}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Похожие товары</h2>
            <Button variant="ghost" className="text-brand hover:text-purple-700">
              ВСЕ ТОВАРЫ →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative mb-4">
                  <img
                    src={product.image || "/placeholder.svg?height=200&width=200&query=black t-shirt"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                    <Heart className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-black mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand">{product.price}</span>
                  <span className="text-xs text-gray-500">Продано {product.sold}</span>
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

      {/* Login Required Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
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
