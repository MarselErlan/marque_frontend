"use client"
import { useState, useEffect } from "react"
import { ShoppingCart, Edit, Trash2, Minus, Plus, Check, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useCart } from "@/hooks/useCart"
import { getImageUrl } from "@/lib/utils"
import { ordersApi, authApi } from "@/lib/api"
import { toast } from "@/lib/toast"

export default function CartPage() {
  const router = useRouter()
  const auth = useAuth()
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart()

  const [isClient, setIsClient] = useState(false)

  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("21 июл")
  
  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment" | "success" | null>(null)
  const [checkoutAddress, setCheckoutAddress] = useState("")
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("")
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [orderTotal, setOrderTotal] = useState<number>(0)
  
  const deliveryDates = ["21 июл", "22 июл", "23 июл", "24 июл", "25 июл"]
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

  const handleCheckout = () => {
    auth.requireAuth(() => {
      setCheckoutStep("address")
    })
  }

  const handleAddressSubmit = () => {
    if (checkoutAddress) {
      setCheckoutStep("payment")
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

      // Create order via API
      const order = await ordersApi.create({
        customer_name: profile.full_name || profile.name || 'Покупатель',
        customer_phone: profile.phone,
        delivery_address: checkoutAddress,
        payment_method: checkoutPaymentMethod,
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
                    src={getImageUrl(item.image) || "/images/black-tshirt.jpg"}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/images/black-tshirt.jpg'
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
                      {deliveryDates.map((date: string, i: number) => (
                        <button
                          key={date}
                          className={`px-3 py-2 text-xs rounded-lg border flex-shrink-0 ${
                            selectedDeliveryDate === date
                              ? "bg-brand-50 text-brand border-brand-light"
                              : "bg-gray-100 text-gray-700 border-transparent"
                          }`}
                          onClick={() => setSelectedDeliveryDate(date)}
                        >
                          <span className="font-semibold">{i === 0 ? 'Завтра' : i === 1 ? 'Послезавтра' : date.split(' ')[0]}</span><br/>
                          <span className="text-gray-500">{date}</span>
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
