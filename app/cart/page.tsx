"use client"
import { useState } from "react"
import { Search, Heart, ShoppingCart, User, Edit, Trash2, Minus, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Футболка спорт из хлопка (чёрная)",
      size: "42",
      color: "Чёрный",
      price: 2999,
      originalPrice: 3699,
      quantity: 1,
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 2,
      name: "Футболка спорт из хлопка (белая)",
      size: "42",
      color: "Белый",
      price: 2999,
      originalPrice: 3699,
      quantity: 1,
      image: "/images/black-tshirt.jpg",
    },
  ])

  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("21 июл")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  const [checkoutStep, setCheckoutStep] = useState<"address" | "payment" | "success" | null>(null)
  const [checkoutAddress, setCheckoutAddress] = useState("")
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("")

  const deliveryDates = ["21 июл", "22 июл", "23 июл", "24 июл", "25 июл"]
  const deliveryCost = 350
  const taxRate = 0.12

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxes = Math.round(subtotal * taxRate)
  const discount = cartItems.reduce((sum, item) => sum + (item.originalPrice - item.price) * item.quantity, 0)
  const total = subtotal + deliveryCost + taxes

  const handleCheckout = () => {
    setCheckoutStep("address")
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

  const handleOrderComplete = () => {
    setCheckoutStep(null)
    setCartItems([]) // Clear cart after successful order
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
              <Button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg">
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
                <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                  <Heart className="w-5 h-5 mb-1" />
                  <span>Избранные</span>
                </Link>
                <div className="flex flex-col items-center cursor-pointer text-purple-600">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  <span>Корзина</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                  <User className="w-5 h-5 mb-1" />
                  <span>Войти</span>
                </div>
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
          </div>

          {/* Order Summary */}
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
                            ? "bg-purple-500 text-white border-purple-500"
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
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg"
                onClick={handleCheckout}
              >
                Перейти к оформлению
              </Button>
            </div>
          </div>
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
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
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
                  className="w-4 h-4 text-purple-600"
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
                  className="w-4 h-4 text-purple-600"
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
                  className="w-4 h-4 text-purple-600"
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
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
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
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Заказ принят к исполнению!</h3>
            <p className="text-gray-600 mb-6">Мы отправили детали заказа на ваш номер телефона</p>
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" onClick={handleOrderComplete}>
              ОК
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
