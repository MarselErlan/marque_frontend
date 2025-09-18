"use client"
import { useState } from "react"
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Camera,
  LogOut,
  Package,
  MapPin,
  CreditCard,
  Bell,
  Star,
  Upload,
  X,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [orderFilter, setOrderFilter] = useState("active")
  const [userName, setUserName] = useState("Анна Ахматова")
  const [phoneNumber, setPhoneNumber] = useState("+996 505 32 53 11")
  const [additionalPhone, setAdditionalPhone] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewPhotos, setReviewPhotos] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)

  const orders = [
    {
      id: "23529",
      date: "15.07.2025",
      deliveryDate: "21.07.2025",
      status: "ОФОРМЛЕН",
      statusColor: "text-green-600",
      total: "5233 сом",
      isActive: true,
      items: [
        {
          id: 1,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Черный",
        },
        {
          id: 2,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "L",
          color: "Белый",
        },
      ],
      canReview: false,
    },
    {
      id: "23529",
      date: "15.07.2025",
      deliveryDate: "21.07.2025",
      status: "В ПУТИ",
      statusColor: "text-yellow-600",
      total: "5233 сом",
      isActive: true,
      items: [
        {
          id: 3,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "S",
          color: "Серый",
        },
        {
          id: 4,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Белый",
        },
        {
          id: 5,
          name: "Джинсы",
          image: "/placeholder.svg?height=60&width=60",
          size: "32",
          color: "Синий",
        },
        {
          id: 6,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Черный",
        },
      ],
      canReview: false,
    },
    {
      id: "23529",
      date: "15.07.2025",
      deliveryDate: "21.07.2025",
      status: "ДОСТАВЛЕН",
      statusColor: "text-purple-600",
      total: "5233 сом",
      isActive: true,
      items: [
        {
          id: 7,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "XL",
          color: "Черный",
        },
        {
          id: 8,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Белый",
        },
        {
          id: 9,
          name: "Джинсы",
          image: "/placeholder.svg?height=60&width=60",
          size: "32",
          color: "Синий",
        },
        {
          id: 10,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Черный",
        },
        {
          id: 11,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "S",
          color: "Коричневый",
        },
        {
          id: 12,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "L",
          color: "Коричневый",
        },
        {
          id: 13,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Коричневый",
        },
        {
          id: 14,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "S",
          color: "Коричневый",
        },
        {
          id: 15,
          name: "Платье",
          image: "/placeholder.svg?height=60&width=60",
          size: "XS",
          color: "Коричневый",
        },
      ],
      canReview: true,
    },
    {
      id: "23528",
      date: "10.06.2025",
      deliveryDate: "15.06.2025",
      status: "ДОСТАВЛЕН",
      statusColor: "text-green-600",
      total: "3299 сом",
      isActive: false,
      items: [
        {
          id: 16,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "M",
          color: "Белый",
        },
      ],
      canReview: true,
    },
    {
      id: "23527",
      date: "25.05.2025",
      deliveryDate: "30.05.2025",
      status: "ДОСТАВЛЕН",
      statusColor: "text-green-600",
      total: "7899 сом",
      isActive: false,
      items: [
        {
          id: 17,
          name: "Футболка спорт из хлопка",
          image: "/placeholder.svg?height=60&width=60",
          size: "L",
          color: "Черный",
        },
        {
          id: 18,
          name: "Джинсы",
          image: "/placeholder.svg?height=60&width=60",
          size: "32",
          color: "Синий",
        },
      ],
      canReview: true,
    },
  ]

  const filteredOrders = orders.filter((order) => (orderFilter === "active" ? order.isActive : !order.isActive))

  const activeOrdersCount = orders.filter((order) => order.isActive).length

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    const newPhotos = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
    }))
    setReviewPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (photoId) => {
    setReviewPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
  }

  const handleSubmitReview = () => {
    if (reviewPhotos.length === 0) {
      alert("Фото обязательно для отзыва")
      return
    }
    if (reviewRating === 0) {
      alert("Пожалуйста, поставьте оценку")
      return
    }
    // Submit review logic here
    console.log("Review submitted:", { rating: reviewRating, text: reviewText, photos: reviewPhotos })
    setShowReviewForm(false)
    setReviewRating(0)
    setReviewText("")
    setReviewPhotos([])
  }

  const sidebarItems = [
    { id: "profile", label: "Профиль", icon: User },
    { id: "orders", label: "Заказы", icon: Package },
    { id: "addresses", label: "Адреса доставки", icon: MapPin },
    { id: "payments", label: "Способы оплаты", icon: CreditCard },
    { id: "notifications", label: "Уведомления", icon: Bell },
  ]

  const mobileTabItems = [
    { id: "profile", label: "Профиль" },
    { id: "orders", label: "Заказы" },
    { id: "addresses", label: "Адреса доставки" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-black tracking-wider cursor-pointer">MARQUE</h1>
              </Link>
            </div>

            {/* Navigation - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
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
                <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  <span>Корзина</span>
                </Link>
                <div className="flex flex-col items-center cursor-pointer text-purple-600">
                  <User className="w-5 h-5 mb-1" />
                  <span>Войти</span>
                </div>
              </div>
            </div>

            {/* Navigation - Mobile */}
            <div className="md:hidden flex items-center space-x-4">
              <Heart className="w-6 h-6 text-gray-600" />
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Товар, бренд или артикул"
              className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg"
            />
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex">
            {mobileTabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === item.id
                    ? "border-purple-600 text-purple-600 bg-purple-50"
                    : "border-transparent text-gray-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-64">
            <div className="bg-white rounded-lg p-6">
              <h1 className="text-2xl font-bold text-black mb-6">Личный кабинет</h1>
              <nav className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id ? "bg-purple-500 text-white" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="bg-white rounded-lg p-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-4 mb-8">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-black">{userName}</h2>
                    <p className="text-gray-500">{phoneNumber}</p>
                    <button className="text-purple-600 text-sm hover:underline mt-1">Редактировать фото</button>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ФИО</label>
                    <Input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Номер телефона (нельзя изменить)
                    </label>
                    <Input type="tel" value={phoneNumber} disabled className="w-full bg-gray-50" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дополнительный номер телефона
                    </label>
                    <Input
                      type="tel"
                      value={additionalPhone}
                      onChange={(e) => setAdditionalPhone(e.target.value)}
                      placeholder="+996 505 32 53 11"
                      className="w-full"
                    />
                  </div>

                  {/* Logout Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти из аккаунта</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && !selectedOrder && !showReviewForm && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-black mb-2">Мои заказы</h2>
                <p className="text-gray-500 text-sm mb-6">{activeOrdersCount} активных</p>

                <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      orderFilter === "active" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Активные
                  </button>
                  <button
                    onClick={() => setOrderFilter("archive")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      orderFilter === "archive" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Архив
                  </button>
                </div>

                <div className="space-y-4">
                  {filteredOrders.map((order, index) => (
                    <div key={`${order.id}-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 mb-2 md:mb-0">
                          <span className="font-medium">Заказ №{order.id}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${order.statusColor} bg-opacity-10`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">{order.date}</div>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        {order.items.slice(0, 8).map((item, itemIndex) => (
                          <img
                            key={`${item.id}-${itemIndex}`}
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ))}
                        {order.items.length > 8 && (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                            +{order.items.length - 8}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Доставка {order.deliveryDate}</div>
                          <div className="text-lg font-semibold">{order.total}</div>
                        </div>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            Детали
                          </Button>
                          {order.canReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowReviewForm(true)
                              }}
                            >
                              Оставить отзыв
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "orders" && selectedOrder && !showReviewForm && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="p-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">Заказ №{selectedOrder.id}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${selectedOrder.statusColor} bg-opacity-10`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">Размер: {item.size}</p>
                        <p className="text-sm text-gray-500">Цвет: {item.color}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Итого: {selectedOrder.total}</span>
                    <span className="text-sm text-gray-500">Доставка {selectedOrder.deliveryDate}</span>
                  </div>

                  {selectedOrder.canReview && (
                    <Button
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => setShowReviewForm(true)}
                    >
                      Написать отзыв
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeTab === "orders" && showReviewForm && selectedOrder && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)} className="p-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">Заказ №{selectedOrder.id}</h2>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Добавьте оценку товару (обязательно)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewRating ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Добавьте отзыв о товаре соответствии, качестве и доставке
                  </label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Опишите ваш опыт с товаром..."
                    className="w-full h-24"
                  />
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Добавьте фото (обязательно)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Загрузите фото товара</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer text-purple-600 hover:text-purple-700">
                        Выберите файлы
                      </label>
                    </div>
                  </div>

                  {/* Uploaded Photos */}
                  {reviewPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                      {reviewPhotos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt="Review photo"
                            className="w-full h-16 object-cover rounded"
                          />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitReview}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  disabled={reviewPhotos.length === 0 || reviewRating === 0}
                >
                  Отправить отзыв
                </Button>

                {/* Order Items */}
                <div className="mt-8 pt-6 border-t">
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {selectedOrder.items.map((item) => (
                      <img
                        key={item.id}
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-16 object-cover rounded"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Доставка {selectedOrder.deliveryDate}</p>
                  <p className="text-sm text-purple-600 cursor-pointer hover:underline">Написать отзыв</p>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-black mb-6">Адреса доставки</h2>
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Адреса доставки не добавлены</p>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-black mb-6">Способы оплаты</h2>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Способы оплаты не добавлены</p>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-black mb-6">Уведомления</h2>
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Настройки уведомлений</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
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
            <div>Условия пользования</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
