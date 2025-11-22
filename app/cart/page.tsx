"use client"
import { useState, useEffect } from "react"
import { ShoppingCart, Edit, Trash2, Minus, Plus, Check, ChevronRight, Loader2, MapPin, CreditCard, ArrowLeft } from "lucide-react"
import { SparklesIcon } from "@/components/SparklesIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useCart } from "@/hooks/useCart"
import { useProfile, Address, PaymentMethod } from "@/hooks/useProfile"
import { getImageUrl } from "@/lib/utils"
import { ordersApi, authApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export default function CartPage() {
  const router = useRouter()
  const auth = useAuth()
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart()
  const { 
    addresses, 
    fetchAddresses, 
    createAddress, 
    isLoadingAddresses,
    paymentMethods,
    fetchPaymentMethods,
    isLoadingPayments,
    profile,
    phoneNumbers,
    fetchPhoneNumbers
  } = useProfile()

  const [isClient, setIsClient] = useState(false)

  // Generate delivery dates (tomorrow + next 4 days)
  const generateDeliveryDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const deliveryDates = generateDeliveryDates()
  const [selectedDeliveryDateIndex, setSelectedDeliveryDateIndex] = useState(0)
  const selectedDeliveryDateObj = deliveryDates[selectedDeliveryDateIndex]
  
  // Format date for display (e.g., "21 июн")
  const formatDeliveryDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  
  // Get day name for date display
  const getDayName = (date: Date, index: number) => {
    if (index === 0) return 'Завтра'
    if (index === 1) return 'Послезавтра'
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[date.getDay()]
  }

  // Format date for API (ISO format YYYY-MM-DD)
  const formatDeliveryDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment" | "review" | "success" | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)
  const [checkoutAddress, setCheckoutAddress] = useState("")
  const [checkoutPaymentMethodDisplay, setCheckoutPaymentMethodDisplay] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  
  // Address form state matching profile page structure
  const createEmptyAddress = () => ({
    label: "",
    fullAddress: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    building: "",
    apartment: "",
    entrance: "",
    floor: "",
    isDefault: false,
  })
  const [newAddress, setNewAddress] = useState(createEmptyAddress())
  const resetAddressForm = () => setNewAddress(createEmptyAddress())
  
  // Get user location for conditional rendering
  const userLocation = (
    profile?.location ||
    profile?.market ||
    'KG'
  ).toUpperCase()
  const isUSLocation = userLocation === 'US'
  
  // Compose full address helper
  const composeFullAddress = (address: typeof newAddress) => {
    if (isUSLocation) {
      // US format: street, city, state, postalCode
      const parts = [
        address.street?.trim(),
        address.city?.trim(),
        address.state?.trim(),
        address.postalCode?.trim(),
      ].filter(Boolean)
      return parts.join(", ")
    } else {
      // KG format: street, building, apartment, entrance, floor, city
      const parts = [
        address.street?.trim() ? `ул. ${address.street.trim()}` : null,
        address.building?.trim() ? `д. ${address.building.trim()}` : null,
        address.apartment?.trim() ? `кв. ${address.apartment.trim()}` : null,
        address.entrance?.trim() ? `подъезд ${address.entrance.trim()}` : null,
        address.floor?.trim() ? `этаж ${address.floor.trim()}` : null,
        address.city?.trim(),
      ].filter(Boolean)
      return parts.join(", ")
    }
  }
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("")
  const [orderComment, setOrderComment] = useState("") // Comment for the order/delivery
  const [additionalPhoneForOrder, setAdditionalPhoneForOrder] = useState("") // Additional phone number for order
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [isCreatingAddress, setIsCreatingAddress] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [orderTotal, setOrderTotal] = useState<number>(0)
  
  const deliveryCost = 150
  const taxRate = 0.12

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load addresses, payment methods, and phone numbers when user is logged in
  useEffect(() => {
    if (auth.isLoggedIn && !auth.isLoading) {
      fetchAddresses()
      fetchPaymentMethods()
      fetchPhoneNumbers()
    }
  }, [auth.isLoggedIn, auth.isLoading, fetchAddresses, fetchPaymentMethods, fetchPhoneNumbers])
  
  // Get additional phone number
  const additionalPhone = phoneNumbers?.find(p => !p.is_primary)?.phone || phoneNumbers?.find(p => p.is_primary && phoneNumbers.length > 1)?.phone || null

  // Auto-select default address when addresses are loaded
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0]
      setSelectedAddressId(defaultAddress.id)
      setCheckoutAddress(defaultAddress.full_address)
      // Pre-fill order comment with address comment if available
      if (defaultAddress.comment && !orderComment) {
        setOrderComment(defaultAddress.comment)
      }
    }
  }, [addresses, selectedAddressId])

  // Update order comment when address changes (only pre-fill if empty)
  useEffect(() => {
    if (selectedAddressId && addresses && !orderComment) {
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)
      if (selectedAddress?.comment) {
        setOrderComment(selectedAddress.comment)
      }
    }
  }, [selectedAddressId, addresses])

  // Auto-select default payment method when payment methods are loaded
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethodId) {
      const defaultPayment = paymentMethods.find(pm => pm.is_default) || paymentMethods[0]
      setSelectedPaymentMethodId(defaultPayment.id)
      // Map payment_type to backend payment_method choices
      const paymentTypeMap: Record<string, string> = {
        'card': 'card',
        'cash': 'cash',
        'transfer': 'transfer',
        'digital_wallet': 'digital_wallet',
      }
      const backendPaymentMethod = paymentTypeMap[defaultPayment.payment_type] || defaultPayment.payment_type || 'cash'
      setCheckoutPaymentMethod(backendPaymentMethod)
      
      if (defaultPayment.payment_type === 'card') {
        setCheckoutPaymentMethodDisplay(`${defaultPayment.card_type || 'Card'} ${defaultPayment.card_number_masked || ''}`)
      } else if (defaultPayment.payment_type === 'cash') {
        setCheckoutPaymentMethodDisplay('Наличные при получении')
      } else {
        setCheckoutPaymentMethodDisplay(defaultPayment.payment_type)
      }
    } else if (paymentMethods && paymentMethods.length === 0 && !selectedPaymentMethodId) {
      // No payment methods saved, default to cash
      setCheckoutPaymentMethod('cash')
      setCheckoutPaymentMethodDisplay('Наличные при получении')
    }
  }, [paymentMethods, selectedPaymentMethodId])

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxes = Math.round(subtotal * taxRate)
  const discount = cartItems.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price
    return sum + (originalPrice - item.price) * item.quantity
  }, 0)
  const total = subtotal + deliveryCost

  const handleCheckout = async () => {
    auth.requireAuth(async () => {
      // Always start the checkout flow - require user to confirm address and payment
      // Fetch addresses when checkout starts
      const fetchedAddresses = await fetchAddresses()
      // Auto-select default address if available
      if (fetchedAddresses && fetchedAddresses.length > 0 && !selectedAddressId) {
        const defaultAddress = fetchedAddresses.find(addr => addr.is_default) || fetchedAddresses[0]
        setSelectedAddressId(defaultAddress.id)
        setCheckoutAddress(defaultAddress.full_address)
      }
      
      // If both address and payment are selected, go to review step
      // Otherwise, if address is selected but payment is not, go to payment step
      // Otherwise start with address
      if (checkoutAddress && checkoutPaymentMethod) {
        setCheckoutStep("review")
      } else if (checkoutAddress && !checkoutPaymentMethod) {
        setCheckoutStep("payment")
      } else {
        setCheckoutStep("address")
      }
    })
  }

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id)
    setCheckoutAddress(address.full_address)
    setShowAddressForm(false)
    // If payment is already selected, go to review step, otherwise close modal
    if (checkoutPaymentMethod) {
      setCheckoutStep("review")
    } else {
      setCheckoutStep(null)
    }
  }

  const handleAddressButtonClick = () => {
    auth.requireAuth(async () => {
      await fetchAddresses()
      setCheckoutStep("address")
    })
  }

  const handlePaymentMethodButtonClick = () => {
    auth.requireAuth(async () => {
      await fetchPaymentMethods()
      setCheckoutStep("payment")
    })
  }

  const handlePaymentMethodSelect = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethodId(paymentMethod.id)
    // Map payment_type to backend payment_method choices
    const paymentTypeMap: Record<string, string> = {
      'card': 'card',
      'cash': 'cash',
      'transfer': 'transfer',
      'digital_wallet': 'digital_wallet',
    }
    const backendPaymentMethod = paymentTypeMap[paymentMethod.payment_type] || paymentMethod.payment_type || 'cash'
    setCheckoutPaymentMethod(backendPaymentMethod)
    
    // Set display text
    if (paymentMethod.payment_type === 'card') {
      setCheckoutPaymentMethodDisplay(`${paymentMethod.card_type || 'Card'} ${paymentMethod.card_number_masked || ''}`)
    } else if (paymentMethod.payment_type === 'cash') {
      setCheckoutPaymentMethodDisplay('Наличные при получении')
    } else {
      setCheckoutPaymentMethodDisplay(paymentMethod.payment_type)
    }
    // If address is already selected, go to review step, otherwise close modal
    if (checkoutAddress) {
      setCheckoutStep("review")
    } else {
      setCheckoutStep(null)
    }
  }

  const handleCreateAddress = async () => {
    // Validation matching profile page
    if (!newAddress.city.trim()) {
      toast.error('Введите город')
      return
    }

    if (isUSLocation) {
      if (!newAddress.street.trim()) {
        toast.error("Введите адрес")
        return
      }
      if (!newAddress.state.trim()) {
        toast.error("Введите штат/регион")
        return
      }
      if (!newAddress.postalCode.trim()) {
        toast.error("Укажите почтовый индекс")
        return
      }
    } else {
      // KG validation
      if (!newAddress.street.trim()) {
        toast.error("Введите улицу")
        return
      }
      if (!newAddress.building.trim()) {
        toast.error("Введите номер дома")
        return
      }
    }

    const fullAddressValue = (newAddress.fullAddress || composeFullAddress(newAddress)).trim()

    if (!fullAddressValue) {
      toast.error("Введите полный адрес")
      return
    }

    setIsCreatingAddress(true)
    try {
      const success = await createAddress({
        title: newAddress.label || 'Дом',
        full_address: fullAddressValue,
        street: newAddress.street || undefined,
        city: newAddress.city,
        state: isUSLocation ? newAddress.state || undefined : undefined,
        postal_code: newAddress.postalCode || undefined,
        country: profile?.country || (isUSLocation ? "United States" : "Kyrgyzstan"),
        building: newAddress.building || undefined,
        apartment: newAddress.apartment || undefined,
        entrance: newAddress.entrance || undefined,
        floor: newAddress.floor || undefined,
        is_default: newAddress.isDefault || undefined,
      })

      if (success) {
        const updatedAddresses = await fetchAddresses()
        setShowAddressForm(false)
        resetAddressForm()
        // Select the newly created address (last one in the list)
        if (updatedAddresses && updatedAddresses.length > 0) {
          const latest = updatedAddresses[updatedAddresses.length - 1]
          handleAddressSelect(latest)
        }
      }
    } catch (error) {
      console.error('Error creating address:', error)
    } finally {
      setIsCreatingAddress(false)
    }
  }

  const handleAddressSubmit = () => {
    if (selectedAddressId && checkoutAddress) {
      // If payment is already selected, go to review, otherwise go to payment
      if (checkoutPaymentMethod) {
        setCheckoutStep("review")
      } else {
        setCheckoutStep("payment")
      }
    } else if (!addresses || addresses.length === 0) {
      toast.error('Пожалуйста, выберите или создайте адрес доставки')
    }
  }

  const handlePaymentSubmit = () => {
    // Just navigate to review step, don't create order yet
    if (!checkoutPaymentMethod) {
      toast.error('Пожалуйста, выберите способ оплаты')
      return
    }

    if (!checkoutAddress) {
      toast.error('Пожалуйста, укажите адрес доставки')
      return
    }

    // Go to review step
    setCheckoutStep("review")
  }

  const handleConfirmOrder = async () => {
    if (!checkoutPaymentMethod) {
      toast.error('Пожалуйста, выберите способ оплаты')
      return
    }

    if (!checkoutAddress) {
      toast.error('Пожалуйста, укажите адрес доставки')
      return
    }

    setIsSubmittingOrder(true)

    try {
      // Get user profile for customer info
      const profile = await authApi.getProfile()

      // Get selected address details
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)

      // Create order via API
      const order = await ordersApi.create({
        customer_name: profile.full_name || profile.name || 'Покупатель',
        customer_phone: profile.phone,
        delivery_address: checkoutAddress,
        delivery_city: selectedAddress?.city || undefined,
        delivery_state: selectedAddress?.state || undefined,
        delivery_postal_code: selectedAddress?.postal_code || undefined,
        delivery_notes: orderComment.trim() || undefined,
        shipping_address_id: selectedAddressId || undefined,
        payment_method_used_id: selectedPaymentMethodId || undefined,
        payment_method: checkoutPaymentMethod,
        requested_delivery_date: formatDeliveryDateForAPI(selectedDeliveryDateObj),
        use_cart: true
      })

      // Success!
      setOrderNumber(order.order_number)
      setOrderTotal(order.total_amount)
      setCheckoutStep("success")
      
      // Clear cart from localStorage
      clearCart()
      
      toast.success(`Заказ ${order.order_number} успешно создан!`)
      
    } catch (error: any) {
      console.error('Order creation failed:', error)
      toast.error(error.message || 'Ошибка при оформлении заказа. Попробуйте еще раз.')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const handleOrderComplete = () => {
    setCheckoutStep(null)
    router.push("/profile")
  }

  if (!isClient) {
    return null // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50 md:bg-gray-50">
      <AuthModals {...auth} />


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8 py-0 md:py-4 lg:py-8">
        <div className="bg-white md:bg-transparent md:flex md:gap-8">
          {/* Cart Items */}
          <div className="flex-1 px-4 md:px-0 pt-4 md:pt-0 pb-4 md:pb-0">
            <div className="mb-4 md:mb-6">
              <h1 className="text-2xl font-bold text-black">Корзина</h1>
              <p className="text-gray-500 text-sm mt-1">{cartItems.length} {cartItems.length === 1 ? 'товар' : cartItems.length < 5 ? 'товара' : 'товаров'}</p>
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
              <>
                <div className="space-y-3 md:space-y-4">
                  {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 md:p-4 flex space-x-3 md:space-x-4">
                    {/* Product Image */}
                    <img
                      src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                      alt={item.name}
                      className="w-16 h-20 md:w-20 md:h-24 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/images/product_placeholder_adobe.png'
                      }}
                    />

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">{item.brand || 'H&M'}</p>
                          <h3 className="font-medium text-black mb-1.5 text-sm leading-tight line-clamp-2">{item.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                            <span>Размер {item.size}</span>
                            <span>Цвет {item.color}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="p-1 h-auto bg-gray-100 rounded-full">
                            <Edit className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1 h-auto bg-gray-100 rounded-full" onClick={() => removeFromCart(item.id, item.size, item.color)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-7 h-7 md:w-8 md:h-8 p-0 bg-gray-100 border-none"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 md:w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-7 h-7 md:w-8 md:h-8 p-0 bg-gray-100 border-none"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-sm md:text-base font-bold text-brand">{item.price} сом</span>
                          {item.originalPrice && <span className="text-xs md:text-sm text-gray-400 line-through">{item.originalPrice} сом</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                
                {/* 3D Mannequin Button */}
                <div className="mt-4 md:mt-6">
                  <Button
                    className="w-full md:w-auto md:px-4 bg-brand/40 md:bg-brand hover:bg-brand/50 md:hover:bg-brand-hover text-brand md:text-white py-2.5 md:py-2 rounded-lg text-sm md:text-sm font-medium flex items-center justify-center gap-2"
                    onClick={() => {
                      // Navigate to mannequin page or open mannequin feature
                      router.push('/mannequin')
                    }}
                  >
                    <SparklesIcon className="w-4 h-4 md:w-4 md:h-4" strokeWidth={1.5} />
                    <span>3D манекен</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="w-full md:w-96 mt-0 md:mt-0 px-4 md:px-0 pb-4 md:pb-0">
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6 space-y-4">
                {/* Delivery Options */}
                <div>
                  <div className="flex bg-gray-100 rounded-lg p-1 text-sm mb-4">
                    <button className="flex-1 py-1.5 rounded-md bg-white text-black font-semibold">Доставка 150 сом</button>
                    <button className="flex-1 py-1.5 text-gray-500">Самовывоз</button>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-black mb-2">Дата доставки</p>
                    <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                      {deliveryDates.map((date: Date, i: number) => (
                        <button
                          key={i}
                          className={`px-3 py-2 text-xs rounded-lg border flex-shrink-0 ${
                            selectedDeliveryDateIndex === i
                              ? "bg-brand-50 text-brand border-brand-light"
                              : "bg-gray-100 text-gray-700 border-transparent"
                          }`}
                          onClick={() => setSelectedDeliveryDateIndex(i)}
                        >
                          <span className="font-semibold block">
                            {i === 0 ? 'Завтра' : i === 1 ? 'Послезавтра' : getDayName(date, i).split(' ')[0]}
                          </span>
                          <span className="text-gray-500 text-xs mt-0.5 block">{formatDeliveryDate(date)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address & Payment Method */}
                  <div className="mt-4 space-y-3">
                    <button 
                      onClick={handleAddressButtonClick}
                      className="w-full flex justify-between items-center text-left bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Адрес доставки</p>
                          {checkoutAddress ? (
                            <p className="font-semibold text-sm truncate">{checkoutAddress}</p>
                          ) : (
                            <p className="font-semibold text-sm text-gray-400">Выберите адрес</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                    <button 
                      onClick={handlePaymentMethodButtonClick}
                      className="w-full flex justify-between items-center text-left bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-0.5">Способ оплаты</p>
                          {checkoutPaymentMethodDisplay ? (
                            <p className="font-semibold text-sm truncate">{checkoutPaymentMethodDisplay}</p>
                          ) : (
                            <p className="font-semibold text-sm text-gray-400">Выберите способ оплаты</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Товаров в заказе</span>
                    <span className="text-black font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Товары на сумму</span>
                    <span className="text-black font-medium">{subtotal.toLocaleString()} сом</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Скидка</span>
                    <span className="text-black font-medium">-{discount.toLocaleString()} сом</span>
                  </div>
                  <div className="border-t pt-2.5 mt-2.5">
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-black">Итого</span>
                      <span className="text-brand">{total.toLocaleString()} сом</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg text-base"
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
      <Dialog open={checkoutStep === "address"} onOpenChange={(open) => {
        if (!open) {
          setCheckoutStep(null)
          setShowAddressForm(false)
          resetAddressForm()
          setSelectedAddressId(null)
          setCheckoutAddress("")
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Выберите адрес доставки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingAddresses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            ) : showAddressForm ? (
              // Address Creation Form - matching profile page structure
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddressForm(false)
                      resetAddressForm()
                    }}
                    className="p-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h3 className="text-lg font-semibold text-black">Добавить адрес</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Название адреса</label>
                  <Input
                    type="text"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Дом, Работа, и т.д."
                    className="w-full"
                  />
                </div>

                {isUSLocation ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street address *</label>
                      <Input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="123 Main St"
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full address (optional)</label>
                      <Input
                        type="text"
                        value={newAddress.fullAddress}
                        onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                        placeholder="123 Main St, Suite 5"
                        className="w-full"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* KG User Address Form - Matching mobile design */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Город *</label>
                      <Input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="Бишкек"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Улица *</label>
                      <Input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="Юнусалиева"
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дом *</label>
                        <Input
                          type="text"
                          value={newAddress.building}
                          onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                          placeholder="23"
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Квартира</label>
                        <Input
                          type="text"
                          value={newAddress.apartment}
                          onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                          placeholder="12"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Подъезд</label>
                        <Input
                          type="text"
                          value={newAddress.entrance}
                          onChange={(e) => setNewAddress({ ...newAddress, entrance: e.target.value })}
                          placeholder="1"
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                        <Input
                          type="text"
                          value={newAddress.floor}
                          onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                          placeholder="5"
                          className="w-full"
                        />
                      </div>
                    </div>

                  </>
                )}

                {isUSLocation && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Город *</label>
                      <Input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="Chicago"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Штат / Регион *</label>
                      <Input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="IL"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP / Почтовый индекс *</label>
                      <Input
                        type="text"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        placeholder="60074"
                        className="w-full"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Comment field for both US and KG users */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="w-4 h-4 text-brand"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-600">
                    Сделать адресом по умолчанию
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={handleCreateAddress}
                    className="flex-1 bg-brand hover:bg-brand-hover text-white"
                    disabled={
                      isCreatingAddress ||
                      !newAddress.city.trim() ||
                      (isUSLocation &&
                        (!newAddress.street.trim() ||
                          !newAddress.state.trim() ||
                          !newAddress.postalCode.trim())) ||
                      (!isUSLocation &&
                        (!newAddress.street.trim() ||
                          !newAddress.building.trim()))
                    }
                  >
                    {isCreatingAddress ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      'Добавить адрес'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddressForm(false)
                      resetAddressForm()
                    }}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : addresses && addresses.length > 0 ? (
              // Address Selection List
              <div className="space-y-3">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => handleAddressSelect(address)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                      selectedAddressId === address.id
                        ? 'border-brand bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">{address.title}</span>
                          {address.is_default && (
                            <span className="text-xs bg-brand-100 text-brand px-2 py-0.5 rounded">По умолчанию</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{address.full_address}</p>
                        {address.city && (
                          <p className="text-xs text-gray-500 mt-1">{address.city}</p>
                        )}
                      </div>
                      {selectedAddressId === address.id && (
                        <Check className="w-5 h-5 text-brand" />
                      )}
                    </div>
                  </button>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddressForm(true)}
                >
                  + Добавить новый адрес
                </Button>
                <Button
                  className="w-full bg-brand hover:bg-brand-hover text-white"
                  onClick={handleAddressSubmit}
                  disabled={!selectedAddressId}
                >
                  Продолжить
                </Button>
              </div>
            ) : (
              // No addresses - show creation form matching profile page
              <div className="space-y-4">
                <p className="text-center text-gray-600 text-sm mb-4">
                  У вас нет сохраненных адресов. Создайте адрес для доставки.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Название адреса</label>
                  <Input
                    type="text"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Дом, Работа, и т.д."
                    className="w-full"
                  />
                </div>

                {isUSLocation ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street address *</label>
                      <Input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="123 Main St"
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full address (optional)</label>
                      <Input
                        type="text"
                        value={newAddress.fullAddress}
                        onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                        placeholder="123 Main St, Suite 5"
                        className="w-full"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* KG User Address Form - Matching mobile design */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Город *</label>
                      <Input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="Бишкек"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Улица *</label>
                      <Input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        placeholder="Юнусалиева"
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дом *</label>
                        <Input
                          type="text"
                          value={newAddress.building}
                          onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                          placeholder="23"
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Квартира</label>
                        <Input
                          type="text"
                          value={newAddress.apartment}
                          onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                          placeholder="12"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Подъезд</label>
                        <Input
                          type="text"
                          value={newAddress.entrance}
                          onChange={(e) => setNewAddress({ ...newAddress, entrance: e.target.value })}
                          placeholder="1"
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Этаж</label>
                        <Input
                          type="text"
                          value={newAddress.floor}
                          onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                          placeholder="5"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </>
                )}

                {isUSLocation && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Город *</label>
                      <Input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="Chicago"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Штат / Регион *</label>
                      <Input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="IL"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP / Почтовый индекс *</label>
                      <Input
                        type="text"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        placeholder="60074"
                        className="w-full"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Comment field for both US and KG users */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default_new"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="w-4 h-4 text-brand"
                  />
                  <label htmlFor="is_default_new" className="text-sm text-gray-600">
                    Сделать адресом по умолчанию
                  </label>
                </div>

                <Button
                  className="w-full bg-brand hover:bg-brand-hover text-white"
                  onClick={handleCreateAddress}
                  disabled={
                    isCreatingAddress ||
                    !newAddress.city.trim() ||
                    (isUSLocation &&
                      (!newAddress.street.trim() ||
                        !newAddress.state.trim() ||
                        !newAddress.postalCode.trim())) ||
                    (!isUSLocation &&
                      (!newAddress.street.trim() ||
                        !newAddress.building.trim()))
                  }
                >
                  {isCreatingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать адрес и продолжить'
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <Dialog open={checkoutStep === "payment"} onOpenChange={() => setCheckoutStep(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Выберите способ оплаты</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingPayments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            ) : paymentMethods && paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((paymentMethod) => (
                  <button
                    key={paymentMethod.id}
                    onClick={() => handlePaymentMethodSelect(paymentMethod)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                      selectedPaymentMethodId === paymentMethod.id
                        ? 'border-brand bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {paymentMethod.payment_type === "card" ? "Банковская карта" : paymentMethod.payment_type === "cash" ? "Наличные при получении" : paymentMethod.payment_type}
                          </span>
                          {paymentMethod.is_default && (
                            <span className="text-xs bg-brand-100 text-brand px-2 py-0.5 rounded">По умолчанию</span>
                          )}
                        </div>
                        {paymentMethod.payment_type === "card" && (
                          <p className="text-sm text-gray-600">
                            {paymentMethod.card_type ? paymentMethod.card_type.toUpperCase() : "Card"} {paymentMethod.card_number_masked || ""}
                          </p>
                        )}
                        {paymentMethod.payment_type === "cash" && (
                          <p className="text-sm text-gray-600">Оплата при получении заказа</p>
                        )}
                      </div>
                      {selectedPaymentMethodId === paymentMethod.id && (
                        <Check className="w-5 h-5 text-brand" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-gray-600 text-sm mb-4">
                  У вас нет сохраненных способов оплаты. Выберите один из вариантов:
                </p>
                <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={checkoutPaymentMethod === "cash"}
                    onChange={(e) => {
                      setCheckoutPaymentMethod(e.target.value)
                      setCheckoutPaymentMethodDisplay("Наличные при получении")
                    }}
                    className="w-4 h-4 text-brand"
                  />
                  <span>Наличные при получении</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={checkoutPaymentMethod === "card"}
                    onChange={(e) => {
                      setCheckoutPaymentMethod(e.target.value)
                      setCheckoutPaymentMethodDisplay("Банковская карта")
                    }}
                    className="w-4 h-4 text-brand"
                  />
                  <span>Банковская карта (введите данные при оформлении)</span>
                </label>
              </div>
            )}
            <Button
              className="w-full bg-brand hover:bg-brand-hover text-white"
              onClick={() => {
                if (checkoutPaymentMethod) {
                  // If address is selected, go to review, otherwise close
                  if (checkoutAddress) {
                    setCheckoutStep("review")
                  } else {
                    setCheckoutStep(null)
                  }
                } else {
                  toast.error('Пожалуйста, выберите способ оплаты')
                }
              }}
              disabled={!checkoutPaymentMethod || isSubmittingOrder}
            >
              {checkoutAddress ? "Продолжить" : "Сохранить и закрыть"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review/Confirmation Modal */}
      <Dialog open={checkoutStep === "review"} onOpenChange={(open) => {
        if (!open) {
          setCheckoutStep(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Подтверждение заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Order Items Summary */}
            <div>
              <h3 className="text-base font-semibold text-black mb-3">Товары в заказе</h3>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/images/product_placeholder_adobe.png'
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Размер: {item.size} | Цвет: {item.color}
                      </p>
                      <p className="text-sm font-semibold text-brand mt-1">
                        {item.price} сом × {item.quantity} = {(item.price * item.quantity).toLocaleString()} сом
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="border-t pt-4">
              <h3 className="text-base font-semibold text-black mb-3">Доставка</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Дата доставки:</span>
                  <span className="text-sm font-medium text-black">
                    {selectedDeliveryDateIndex === 0 ? 'Завтра' : selectedDeliveryDateIndex === 1 ? 'Послезавтра' : deliveryDates[selectedDeliveryDateIndex].getDate().toString()}{' '}
                    {formatDeliveryDate(selectedDeliveryDateObj)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Адрес доставки:</span>
                  <button
                    onClick={() => {
                      setCheckoutStep("address")
                    }}
                    className="text-sm font-medium text-brand hover:underline text-right max-w-[60%] flex items-center gap-1"
                  >
                    {checkoutAddress || "Не выбран"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Способ оплаты:</span>
                  <button
                    onClick={() => {
                      setCheckoutStep("payment")
                    }}
                    className="text-sm font-medium text-brand hover:underline flex items-center gap-1"
                  >
                    {checkoutPaymentMethodDisplay || "Не выбран"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Phone Number and Comment */}
            <div className="border-t pt-4">
              <div className="space-y-4">
                {/* Additional Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дополнительный телефон
                  </label>
                  <Input
                    type="tel"
                    value={additionalPhoneForOrder}
                    onChange={(e) => setAdditionalPhoneForOrder(e.target.value)}
                    placeholder={profile?.phone ? `Например: ${profile.phone}` : "+996 505 32 53 11"}
                    className="w-full h-11 text-base border-gray-300 focus:border-brand focus:ring-brand"
                  />
                </div>

                {/* Order Comment */}
                <div>
                  <h3 className="text-base font-semibold text-black mb-3">Комментарий к заказу</h3>
                  <Textarea
                    value={orderComment}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length <= 500) {
                        setOrderComment(value)
                      }
                    }}
                    placeholder="Добавьте комментарий для курьера (например, код от домофона, время доставки и т.д.)"
                    className="w-full min-h-[100px]"
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {orderComment.length}/500
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <h3 className="text-base font-semibold text-black mb-3">Итого</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары ({cartItems.length}):</span>
                  <span className="text-black font-medium">{subtotal.toLocaleString()} сом</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка:</span>
                  <span className="text-black font-medium">{deliveryCost.toLocaleString()} сом</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Скидка:</span>
                    <span className="text-green-600 font-medium">-{discount.toLocaleString()} сом</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-black">Итого к оплате:</span>
                    <span className="text-brand">{total.toLocaleString()} сом</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCheckoutStep(null)}
                disabled={isSubmittingOrder}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 bg-brand hover:bg-brand-hover text-white"
                onClick={handleConfirmOrder}
                disabled={isSubmittingOrder || !checkoutAddress || !checkoutPaymentMethod}
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Оформление...
                  </>
                ) : (
                  'Подтвердить заказ'
                )}
              </Button>
            </div>
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
            {orderNumber && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Номер заказа</p>
                <p className="text-2xl font-bold text-brand">{orderNumber}</p>
                {orderTotal > 0 && (
                  <p className="text-sm text-gray-600 mt-2">Сумма: {orderTotal.toLocaleString()} сом</p>
                )}
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Телефон:</span>
                <span className="font-medium text-black">{profile?.phone || "Не указан"}</span>
              </div>
              {additionalPhoneForOrder && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Дополнительный телефон:</span>
                  <span className="font-medium text-black">{additionalPhoneForOrder}</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-6">Мы отправили детали заказа на ваш номер телефона</p>
            <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={handleOrderComplete}>
              Перейти в профиль
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
