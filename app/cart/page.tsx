"use client"
import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, Edit, Trash2, Minus, Plus, Check, LogIn, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_CONFIG } from "@/lib/config"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartItemCount, setCartItemCount] = useState(0)

  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("21 июл")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment" | "success" | null>(null)
  const [checkoutAddress, setCheckoutAddress] = useState("")
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("")
  
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

  const deliveryDates = ["21 июл", "22 июл", "23 июл", "24 июл", "25 июл"]
  const deliveryCost = 350
  const taxRate = 0.12

  // Country codes for phone input
  const countryCodes = [
    { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
    { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
  ]

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

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const loadCartItems = () => {
      try {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          setCartItems(parsedCart)
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
    
    loadCartItems()
    loadCartCount()
    checkAuthStatus()
  }, [])

  // Save cart items to localStorage whenever cartItems changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems))
    }
  }, [cartItems])

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const updatedItems = cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    setCartItems(updatedItems)
    localStorage.setItem('cart', JSON.stringify(updatedItems))
    loadCartCount()
  }

  const removeItem = (id: number) => {
    const updatedItems = cartItems.filter((item) => item.id !== id)
    setCartItems(updatedItems)
    if (updatedItems.length === 0) {
      localStorage.removeItem('cart')
    } else {
      localStorage.setItem('cart', JSON.stringify(updatedItems))
    }
    loadCartCount()
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxes = Math.round(subtotal * taxRate)
  const discount = cartItems.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price
    return sum + (originalPrice - item.price) * item.quantity
  }, 0)
  const total = subtotal + deliveryCost + taxes

  const handleCheckout = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true)
    } else {
      setCheckoutStep("address")
    }
  }

  const handleAddressSubmit = () => {
    if (checkoutAddress) {
      setCheckoutStep("payment")
    }
  }

  const handlePaymentSubmit = () => {
    if (checkoutPaymentMethod) {
      setCheckoutStep("success")
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
    const cleanPhoneNumber = phoneNumber.replace(/[-\s]/g, '')
    const fullPhoneNumber = `${countryCode}${cleanPhoneNumber}`
    
    // Validate phone number format according to backend requirements
    if (countryCode === '+1') {
      if (cleanPhoneNumber.length !== 10) {
        alert('Для номеров США введите 10 цифр (например: 3125551234)')
        setIsSendingSms(false)
        return
      }
    }
    
    if (countryCode === '+996') {
      if (cleanPhoneNumber.length !== 9) {
        alert('Для номеров КГ введите 9 цифр (например: 505123456)')
        setIsSendingSms(false)
        return
      }
    }
    
    console.log('DEBUG: Country Code:', countryCode)
    console.log('DEBUG: Raw Phone Number:', phoneNumber)
    console.log('DEBUG: Clean Phone Number:', cleanPhoneNumber)
    console.log('DEBUG: Full Phone Number:', fullPhoneNumber)
    
    try {
      console.log('Sending SMS to:', fullPhoneNumber)
      console.log('API URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`)
      
      // Show a temporary alert with the phone number being sent
      alert(`Отправляем SMS на номер: ${fullPhoneNumber}`)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Market': countryCode === '+1' ? 'us' : 'kg',
          'X-Request-ID': `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        body: JSON.stringify({
          phone: fullPhoneNumber
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      if (response.ok) {
        const data = await response.json()
        console.log('SMS sent successfully:', data)
        setIsPhoneModalOpen(false)
        setIsSmsModalOpen(true)
      } else {
        const errorText = await response.text()
        console.error('Failed to send SMS. Status:', response.status)
        console.error('Error response:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          alert(`Не удалось отправить SMS: ${errorData.message || 'Попробуйте еще раз.'}`)
        } catch {
          alert(`Ошибка сервера: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      if (
        error instanceof TypeError &&
        typeof error.message === 'string' &&
        error.message.includes('fetch')
      ) {
        alert('Ошибка сети: Не удается подключиться к серверу. Проверьте интернет соединение.')
      } else {
        alert('Ошибка подключения. Убедитесь что API сервер запущен.')
      }
    } finally {
      setIsSendingSms(false)
    }
  }

  const handleSmsVerification = async () => {
    if (smsCode.length >= 6) {
      setIsVerifyingCode(true)
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
      
      try {
        console.log('Verifying SMS code for:', fullPhoneNumber)
        console.log('SMS code:', smsCode)
        
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_CODE}`, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Market': countryCode === '+1' ? 'us' : 'kg',
            'X-Request-ID': `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
          
          // Proceed to checkout after successful login
          setCheckoutStep("address")
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
    // setPhoneNumber("") // Keep the input empty when changing country
  }

  const getFullPhoneNumber = () => `${countryCode} ${phoneNumber}`


  const handleOrderComplete = () => {
    setCheckoutStep(null)
    setCartItems([]) // Clear cart after successful order
    localStorage.removeItem("cart")
    loadCartCount()
    router.push("/order-success") // Redirect to order success page instead of just closing modal
  }

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
                <div className="flex flex-col items-center cursor-pointer text-brand relative">
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5 mb-1" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </div>
                  <span>Корзина</span>
                </div>
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
        <div className="flex gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-black">Корзина</h1>
              <p className="text-gray-500">{cartItems.length} товара</p>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Ваша корзина пуста</h3>
                <p className="text-gray-500 mb-6">Добавьте товары в корзину, чтобы сделать заказ</p>
                <Link href="/">
                  <Button className="bg-brand hover:bg-brand-hover text-white">
                    Перейти к покупкам
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-6 flex items-center space-x-4">
                  {/* Product Image */}
                  <img
                    src={item.image || "/placeholder.svg?height=80&width=80&query=t-shirt"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">H&M</p>
                        <h3 className="font-medium text-black mb-2">{item.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Размер: {item.size}</span>
                          <span>Цвет: {item.color}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="p-1">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-black">{item.price} сом</span>
                        <span className="text-sm text-gray-400 line-through">{item.originalPrice} сом</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="w-80">
              <div className="bg-white rounded-lg p-6 space-y-6">
              {/* Delivery Options */}
              <div>
                <h3 className="font-semibold text-black mb-3">Доставка 350 сом</h3>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Дата доставки</p>
                  <div className="flex space-x-2 mb-4">
                    {deliveryDates.map((date) => (
                      <button
                        key={date}
                        className={`px-3 py-2 text-xs rounded border ${
                          selectedDeliveryDate === date
                            ? "bg-brand text-white border-purple-500"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                        onClick={() => setSelectedDeliveryDate(date)}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{selectedDeliveryDate}</p>
                </div>

                {/* Delivery Address */}
                <div className="mb-4">
                  <Select value={deliveryAddress} onValueChange={setDeliveryAddress}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Адрес доставки" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="address1">ул. Ленина, 123</SelectItem>
                      <SelectItem value="address2">пр. Мира, 456</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Способ оплаты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Банковская карта</SelectItem>
                      <SelectItem value="cash">Наличные</SelectItem>
                      <SelectItem value="online">Онлайн оплата</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары в заказе</span>
                  <span className="text-black">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары на сумму</span>
                  <span className="text-black">{subtotal.toLocaleString()} сом</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Скидка</span>
                  <span className="text-black">{discount.toLocaleString()} сом</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-black">Итого</span>
                    <span className="text-black">{total.toLocaleString()} сом</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handleCheckout}
              >
                Перейти к оформлению
              </Button>
            </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
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

      {/* Address Selection Modal */}
      <Dialog open={checkoutStep === "address"} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Выберите адрес доставки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Введите адрес"
                value={checkoutAddress}
                onChange={(e) => setCheckoutAddress(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input placeholder="Квартира, офис" className="w-full" />
            </div>
            <div>
              <Input placeholder="Подъезд" className="w-full" />
            </div>
            <div>
              <Input placeholder="Этаж" className="w-full" />
            </div>
            <Button
              className="w-full bg-brand hover:bg-brand-hover text-white"
              onClick={handleAddressSubmit}
              disabled={!checkoutAddress}
            >
              Продолжить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <Dialog open={checkoutStep === "payment"} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Выберите способ оплаты</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={checkoutPaymentMethod === "card"}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-brand"
                />
                <span>Банковская карта</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={checkoutPaymentMethod === "cash"}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-brand"
                />
                <span>Наличные при получении</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={checkoutPaymentMethod === "online"}
                  onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-brand"
                />
                <span>Онлайн оплата</span>
              </label>
            </div>
            {checkoutPaymentMethod === "card" && (
              <div className="space-y-3 pt-4 border-t">
                <Input placeholder="Номер карты" />
                <div className="flex space-x-2">
                  <Input placeholder="ММ/ГГ" className="flex-1" />
                  <Input placeholder="CVC" className="flex-1" />
                </div>
                <Input placeholder="Имя держателя карты" />
              </div>
            )}
            <Button
              className="w-full bg-brand hover:bg-brand-hover text-white"
              onClick={handlePaymentSubmit}
              disabled={!checkoutPaymentMethod}
            >
              Оформить заказ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={checkoutStep === "success"} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Заказ оформлен</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Заказ принят к исполнению!</h3>
            <p className="text-gray-600 mb-6">Мы отправили детали заказа на ваш номер телефона</p>
            <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={handleOrderComplete}>
              ОК
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Required Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Войти в аккаунт</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-brand" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-black">Войдите чтобы оформить заказ</h2>
              <p className="text-gray-600">Для оформления заказа необходимо войти в аккаунт</p>
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
                {isSendingSms ? "Отправляем SMS..." : `Продолжить (${countryCode}${phoneNumber.replace(/[-\s]/g, '')})`}
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
