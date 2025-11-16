"use client"
import { useState, useEffect } from "react"
import { ShoppingCart, Edit, Trash2, Minus, Plus, Check, ChevronRight, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useCart } from "@/hooks/useCart"
import { useProfile, Address } from "@/hooks/useProfile"
import { getImageUrl } from "@/lib/utils"
import { ordersApi, authApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export default function CartPage() {
  const router = useRouter()
  const auth = useAuth()
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart()
  const { addresses, fetchAddresses, createAddress, isLoadingAddresses } = useProfile()

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
  
  // Format date for display (e.g., "21 июл")
  const formatDeliveryDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  // Format date for API (ISO format YYYY-MM-DD)
  const formatDeliveryDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment" | "success" | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [checkoutAddress, setCheckoutAddress] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    title: "",
    full_address: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    building: "",
    apartment: "",
    is_default: false,
  })
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("")
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [isCreatingAddress, setIsCreatingAddress] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [orderTotal, setOrderTotal] = useState<number>(0)
  
  const deliveryCost = 150
  const taxRate = 0.12

  useEffect(() => {
    setIsClient(true)
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxes = Math.round(subtotal * taxRate)
  const discount = cartItems.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price
    return sum + (originalPrice - item.price) * item.quantity
  }, 0)
  const total = subtotal + deliveryCost

  const handleCheckout = async () => {
    auth.requireAuth(async () => {
      // Fetch addresses when checkout starts
      const fetchedAddresses = await fetchAddresses()
      // Auto-select default address if available
      if (fetchedAddresses && fetchedAddresses.length > 0) {
        const defaultAddress = fetchedAddresses.find(addr => addr.is_default) || fetchedAddresses[0]
        setSelectedAddressId(defaultAddress.id)
        setCheckoutAddress(defaultAddress.full_address)
      }
      setCheckoutStep("address")
    })
  }

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id)
    setCheckoutAddress(address.full_address)
    setShowAddressForm(false)
  }

  const handleCreateAddress = async () => {
    if (!newAddress.full_address.trim()) {
      toast.error('Введите адрес доставки')
      return
    }
    if (!newAddress.city.trim()) {
      toast.error('Введите город')
      return
    }

    setIsCreatingAddress(true)
    try {
      const success = await createAddress({
        title: newAddress.title || 'Дом',
        full_address: newAddress.full_address,
        street: newAddress.street || undefined,
        city: newAddress.city,
        state: newAddress.state || undefined,
        postal_code: newAddress.postal_code || undefined,
        building: newAddress.building || undefined,
        apartment: newAddress.apartment || undefined,
        is_default: newAddress.is_default,
      })

      if (success) {
        const updatedAddresses = await fetchAddresses()
        setShowAddressForm(false)
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
      setCheckoutStep("payment")
    } else if (!addresses || addresses.length === 0) {
      toast.error('Пожалуйста, выберите или создайте адрес доставки')
    }
  }

  const handlePaymentSubmit = async () => {
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
        shipping_address_id: selectedAddressId || undefined,
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
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="md:flex md:gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-black">Корзина</h1>
              <p className="text-gray-500 md:hidden">{cartItems.length} товара</p>
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
                <div key={item.id} className="bg-white rounded-lg p-4 flex space-x-4">
                  {/* Product Image */}
                  <img
                    src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/images/product_placeholder_adobe.png'
                    }}
                  />

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{item.brand || 'H&M'}</p>
                        <h3 className="font-medium text-black mb-2 text-sm leading-tight">{item.name}</h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>Размер: {item.size}</span>
                          <span>Цвет: {item.color}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Button variant="ghost" size="sm" className="p-1 h-auto bg-gray-100 rounded-full">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1 h-auto bg-gray-100 rounded-full" onClick={() => removeFromCart(item.id, item.size, item.color)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 bg-gray-100 border-none"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 bg-gray-100 border-none"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-brand">{item.price} сом</span>
                        {item.originalPrice && <span className="text-sm text-gray-400 line-through">{item.originalPrice} сом</span>}
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
            <div className="w-full md:w-96 mt-8 md:mt-0">
              <div className="bg-white rounded-lg p-4 md:p-6 space-y-4">
                {/* Delivery Options */}
                <div>
                  <div className="flex bg-gray-100 rounded-lg p-1 text-sm mb-4">
                    <button className="flex-1 py-1.5 rounded-md bg-white text-black font-semibold">Доставка 150 сом</button>
                    <button className="flex-1 py-1.5 text-gray-500">Самовывоз</button>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-black mb-2">Дата доставки</p>
                    <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
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
                          <span className="font-semibold">
                            {i === 0 ? 'Завтра' : i === 1 ? 'Послезавтра' : date.getDate().toString()}
                          </span><br/>
                          <span className="text-gray-500">{formatDeliveryDate(date)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address & Payment Method */}
                  <div className="mt-4 space-y-3">
                    <button className="w-full flex justify-between items-center text-left bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Адрес доставки</p>
                        <p className="font-semibold">Юнусалиева, 40</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-full flex justify-between items-center text-left bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Способ оплаты</p>
                        <p className="font-semibold">Visa **** 4394</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Товары в заказе</span>
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
                  <div className="border-t pt-2 mt-2">
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
      <Dialog open={checkoutStep === "address"} onOpenChange={() => {
        setCheckoutStep(null)
        setShowAddressForm(false)
        setSelectedAddressId(null)
        setCheckoutAddress("")
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
              // Address Creation Form
              <div className="space-y-4">
                <Input
                  placeholder="Название (например: Дом, Работа)"
                  value={newAddress.title}
                  onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                  className="w-full"
                />
                <Input
                  placeholder="Полный адрес *"
                  value={newAddress.full_address}
                  onChange={(e) => setNewAddress({ ...newAddress, full_address: e.target.value })}
                  className="w-full"
                  required
                />
                <Input
                  placeholder="Город *"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="w-full"
                  required
                />
                <Input
                  placeholder="Улица (опционально)"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full"
                />
                <div className="flex space-x-2">
                  <Input
                    placeholder="Дом/Здание"
                    value={newAddress.building}
                    onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Квартира/Офис"
                    value={newAddress.apartment}
                    onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <Input
                  placeholder="Штат/Регион (опционально)"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="w-full"
                />
                <Input
                  placeholder="Почтовый индекс (опционально)"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="w-full"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                    className="w-4 h-4 text-brand"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-600">
                    Сделать адресом по умолчанию
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddressForm(false)
                      setNewAddress({
                        title: "",
                        full_address: "",
                        street: "",
                        city: "",
                        state: "",
                        postal_code: "",
                        building: "",
                        apartment: "",
                        is_default: false,
                      })
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="flex-1 bg-brand hover:bg-brand-hover text-white"
                    onClick={handleCreateAddress}
                    disabled={isCreatingAddress || !newAddress.full_address.trim() || !newAddress.city.trim()}
                  >
                    {isCreatingAddress ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      'Создать адрес'
                    )}
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
              // No addresses - show creation form
              <div className="space-y-4">
                <p className="text-center text-gray-600 text-sm">
                  У вас нет сохраненных адресов. Создайте адрес для доставки.
                </p>
                <Input
                  placeholder="Название (например: Дом, Работа)"
                  value={newAddress.title}
                  onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                  className="w-full"
                />
                <Input
                  placeholder="Полный адрес *"
                  value={newAddress.full_address}
                  onChange={(e) => setNewAddress({ ...newAddress, full_address: e.target.value })}
                  className="w-full"
                  required
                />
                <Input
                  placeholder="Город *"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="w-full"
                  required
                />
                <Input
                  placeholder="Улица (опционально)"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full"
                />
                <div className="flex space-x-2">
                  <Input
                    placeholder="Дом/Здание"
                    value={newAddress.building}
                    onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Квартира/Офис"
                    value={newAddress.apartment}
                    onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <Input
                  placeholder="Штат/Регион (опционально)"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="w-full"
                />
                <Input
                  placeholder="Почтовый индекс (опционально)"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  className="w-full"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default_new"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                    className="w-4 h-4 text-brand"
                  />
                  <label htmlFor="is_default_new" className="text-sm text-gray-600">
                    Сделать адресом по умолчанию
                  </label>
                </div>
                <Button
                  className="w-full bg-brand hover:bg-brand-hover text-white"
                  onClick={handleCreateAddress}
                  disabled={isCreatingAddress || !newAddress.full_address.trim() || !newAddress.city.trim()}
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
              disabled={!checkoutPaymentMethod || isSubmittingOrder}
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Оформляем заказ...
                </>
              ) : (
                'Оформить заказ'
              )}
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
            {orderNumber && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Номер заказа</p>
                <p className="text-2xl font-bold text-brand">{orderNumber}</p>
                {orderTotal > 0 && (
                  <p className="text-sm text-gray-600 mt-2">Сумма: {orderTotal.toLocaleString()} сом</p>
                )}
              </div>
            )}
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
