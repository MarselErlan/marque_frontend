"use client"
import { useState, useEffect } from "react"
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
  Trash2,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useWishlist } from "@/hooks/useWishlist"
import { AuthModals } from "@/components/AuthModals"
import { getImageUrl } from "@/lib/utils"

interface OrderItem {
  id: number
  name: string
  image: string
  size: string
  color: string
}

interface Order {
  id: string
  date: string
  deliveryDate: string
  status: string
  statusColor: string
  total: string
  isActive: boolean
  items: OrderItem[]
  canReview: boolean
}

interface Address {
  id: number
  label: string
  address: string
  city?: string
  region?: string
  postalCode?: string
}

interface PaymentMethod {
  id: number
  type: string
  brand: string
  lastFour: string
  fullNumber: string
}

interface ReviewPhoto {
  id: number
  file: File
  url: string
}

export default function ProfilePage() {
  const router = useRouter()
  const auth = useAuth()
  const { isLoggedIn, userData, handleLogout } = auth
  const { wishlistItemCount } = useWishlist()
  
  const [activeTab, setActiveTab] = useState("profile")
  const [orderFilter, setOrderFilter] = useState("active")
  const [userName, setUserName] = useState("Анна Ахматова")
  const [phoneNumber, setPhoneNumber] = useState("+996 505 32 53 11")
  const [additionalPhone, setAdditionalPhone] = useState("")
  const [isClient, setIsClient] = useState(false)
  
  // Authentication states are now managed by the useAuth hook.
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewPhotos, setReviewPhotos] = useState<ReviewPhoto[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 1,
      label: "Адрес",
      address: "ул.Юнусалиева, 34",
    },
    {
      id: 2,
      label: "Адрес",
      address: "ул.Уметалиева, 11а",
    },
  ])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [newAddress, setNewAddress] = useState({
    label: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
  })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      type: "Банковская карта",
      brand: "Visa",
      lastFour: "2352",
      fullNumber: "•••• •••• •••• 2352",
    },
    {
      id: 2,
      type: "Банковская карта",
      brand: "Mastercard",
      lastFour: "5256",
      fullNumber: "•••• •••• •••• 5256",
    },
  ])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null)
  const [newPayment, setNewPayment] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  })

  const [notificationFilter, setNotificationFilter] = useState<"all" | "orders" | "sales">("all")
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    salesPromotions: true,
    emailNotifications: true,
    pushNotifications: false,
  })

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: "order" as const,
      title: "Заказ №123 подтвержден",
      time: "14:32",
      date: "сегодня",
      products: [{ image: "/black-t-shirt.png" }, { image: "/beige-t-shirt.jpg" }],
    },
    {
      id: 2,
      type: "order" as const,
      title: "Заказ №123 передан курьеру",
      time: "14:30",
      date: "сегодня",
      products: [{ image: "/black-t-shirt.png" }, { image: "/beige-t-shirt.jpg" }],
    },
    {
      id: 3,
      type: "order" as const,
      title: "Заказ №123 доставлен",
      time: "14:25",
      date: "сегодня",
      products: [{ image: "/black-t-shirt.png" }, { image: "/beige-t-shirt.jpg" }],
    },
    {
      id: 4,
      type: "sale" as const,
      title: "Скидка 30% на летнюю коллекцию",
      time: "10:00",
      date: "сегодня",
      products: [],
    },
    {
      id: 5,
      type: "sale" as const,
      title: "Новая коллекция уже в продаже",
      time: "09:15",
      date: "вчера",
      products: [],
    },
  ]

  // checkAuthStatus and handleLogout are now handled by the useAuth hook.

  // Check auth status on component mount
  useEffect(() => {
    setIsClient(true)
    
    // TEMPORARILY DISABLED: If loading is finished and user is not logged in, redirect
    // if (!auth.isLoading && !auth.isLoggedIn) {
    //   router.push('/')
    // } else if (userData) {
    //   setUserName(userData.full_name || userData.name || "Анна Ахматова")
    //   setPhoneNumber(userData.phone || "+996 505 32 53 11")
    // }
    
    // TEMPORARY: Always show profile page for testing
    if (userData) {
      setUserName(userData.full_name || userData.name || "Анна Ахматова")
      setPhoneNumber(userData.phone || "+996 505 32 53 11")
    }
  }, [auth.isLoading, auth.isLoggedIn, userData, router])

  const filteredNotifications = notifications.filter((notification) => {
    if (notificationFilter === "all") return true
    if (notificationFilter === "orders") return notification.type === "order"
    if (notificationFilter === "sales") return notification.type === "sale"
    return true
  })

  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const date = notification.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(notification)
      return groups
    },
    {} as Record<string, typeof notifications>,
  )

  const orders: Order[] = [
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
      statusColor: "text-brand",
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

  const handleAddAddress = () => {
    if (newAddress.address.trim()) {
      const address: Address = {
        id: Date.now(),
        label: newAddress.label || "Адрес",
        address: newAddress.address,
        city: newAddress.city,
        region: newAddress.region,
        postalCode: newAddress.postalCode,
      }
      setAddresses([...addresses, address])
      setNewAddress({ label: "", address: "", city: "", region: "", postalCode: "" })
      setShowAddressForm(false)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setNewAddress({
      label: address.label,
      address: address.address,
      city: address.city || "",
      region: address.region || "",
      postalCode: address.postalCode || "",
    })
    setShowAddressForm(true)
  }

  const handleUpdateAddress = () => {
    if (newAddress.address.trim() && editingAddress) {
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingAddress.id
            ? {
                ...addr,
                label: newAddress.label || "Адрес",
                address: newAddress.address,
                city: newAddress.city,
                region: newAddress.region,
                postalCode: newAddress.postalCode,
              }
            : addr,
        ),
      )
      setNewAddress({ label: "", address: "", city: "", region: "", postalCode: "" })
      setShowAddressForm(false)
      setEditingAddress(null)
    }
  }

  const handleDeleteAddress = (addressId: number) => {
    setAddresses(addresses.filter((addr) => addr.id !== addressId))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const newPhotos: ReviewPhoto[] = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
    }))
    setReviewPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (photoId: number) => {
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
    setShowReviewForm(false)
    setReviewRating(0)
    setReviewText("")
    setReviewPhotos([])
  }

  const handleAddPayment = () => {
    if (newPayment.cardNumber.trim() && newPayment.expiryDate.trim() && newPayment.cvv.trim()) {
      const lastFour = newPayment.cardNumber.slice(-4)
      const brand = newPayment.cardNumber.startsWith("4") ? "Visa" : "Mastercard"

      const payment: PaymentMethod = {
        id: Date.now(),
        type: "Банковская карта",
        brand,
        lastFour,
        fullNumber: `•••• •••• •••• ${lastFour}`,
      }
      setPaymentMethods([...paymentMethods, payment])
      setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
      setShowPaymentForm(false)
    }
  }

  const handleEditPayment = (payment: PaymentMethod) => {
    setEditingPayment(payment)
    setNewPayment({
      cardNumber: `****${payment.lastFour}`,
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    })
    setShowPaymentForm(true)
  }

  const handleUpdatePayment = () => {
    if (newPayment.cardNumber.trim() && newPayment.expiryDate.trim() && newPayment.cvv.trim() && editingPayment) {
      const lastFour = newPayment.cardNumber.slice(-4)
      const brand = newPayment.cardNumber.startsWith("4") ? "Visa" : "Mastercard"

      setPaymentMethods(
        paymentMethods.map((payment) =>
          payment.id === editingPayment.id
            ? {
                ...payment,
                brand,
                lastFour,
                fullNumber: `•••• •••• •••• ${lastFour}`,
              }
            : payment,
        ),
      )
      setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
      setShowPaymentForm(false)
      setEditingPayment(null)
    }
  }

  const handleDeletePayment = (paymentId: number) => {
    setPaymentMethods(paymentMethods.filter((payment) => payment.id !== paymentId))
  }

  const sidebarItems = [
    { id: "profile", label: "Профиль", icon: User },
    { id: "orders", label: "Заказы", icon: Package },
    { id: "addresses", label: "Адреса доставки", icon: MapPin },
    { id: "payments", label: "Способы оплаты", icon: CreditCard },
    { id: "notifications", label: "Уведомления", icon: Bell },
  ]

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    setShowSearchSuggestions(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchSuggestions(false), 200);
  };

  const handleHeaderLoginClick = () => {
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      auth.requireAuth(() => router.push('/profile'));
    }
  };


  const mobileTabItems = [
    { id: "profile", label: "Профиль" },
    { id: "orders", label: "Заказы" },
    { id: "addresses", label: "Адреса доставки" },
    { id: "payments", label: "Способы оплаты" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        {/* Desktop Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-bold text-black tracking-wider cursor-pointer">MARQUE</h1>
              </Link>
              <Button
                className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                onClick={() => router.push('/?catalog=true')}
              >
                <span className="text-lg">⋮⋮⋮</span>
                <span>Каталог</span>
              </Button>
            </div>
            <div className="flex-1 flex justify-center px-8">
              <div className="relative max-w-2xl w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Товар, бренд или артикул"
                  className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
                {showSearchSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
                    {/* Search suggestions would go here */}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex flex-col items-center cursor-pointer hover:text-brand relative">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                  <span className="text-lg">👤</span>
                </div>
                <span className="text-xs">Манекен</span>
              </div>
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
                className="flex flex-col items-center cursor-pointer text-brand bg-transparent border-none p-0"
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
                <User className="w-6 h-6 text-brand" />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center space-x-3">
              <Button
                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                onClick={() => router.push('/?catalog=true')}
              >
                <span className="text-lg">⋮⋮⋮</span>
                <span>Каталог</span>
              </Button>
              <div className="flex-1 relative">
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
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden border-t border-gray-200 overflow-x-auto">
          <div className="flex">
            {mobileTabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === item.id
                    ? "border-b-2 border-brand text-brand"
                    : "border-b-2 border-transparent text-gray-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
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
                        activeTab === item.id ? "bg-brand text-white" : "text-gray-700 hover:bg-gray-50"
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
              <div className="bg-white rounded-lg p-6 md:p-8">
                {/* Profile Header */}
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center hover:bg-brand-hover transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">{userName}</h2>
                    <p className="text-gray-600 text-lg mb-3">{phoneNumber}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-brand border-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      Редактировать фото
                    </Button>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">ФИО</label>
                    <Input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full h-12 text-lg border-gray-300 focus:border-brand focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Номер телефона (нельзя изменить)
                    </label>
                    <Input 
                      type="tel" 
                      value={phoneNumber} 
                      disabled 
                      className="w-full h-12 text-lg bg-gray-50 border-gray-200 text-gray-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Дополнительный номер телефона
                    </label>
                    <Input
                      type="tel"
                      value={additionalPhone}
                      onChange={(e) => setAdditionalPhone(e.target.value)}
                      placeholder="+996 505 32 53 11"
                      className="w-full h-12 text-lg border-gray-300 focus:border-brand focus:ring-brand"
                    />
                  </div>

                  {/* Logout Button */}
                  <div className="pt-8 border-t border-gray-200">
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full h-12 flex items-center justify-center space-x-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-lg font-medium">Выйти из аккаунта</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && !selectedOrder && !showReviewForm && (
              <div className="bg-white rounded-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Мои заказы</h2>
                    <p className="text-gray-600">{activeOrdersCount} активных</p>
                  </div>
                </div>

                <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      orderFilter === "active" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Активные
                  </button>
                  <button
                    onClick={() => setOrderFilter("archive")}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      orderFilter === "archive" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Архив
                  </button>
                </div>

                <div className="space-y-6">
                  {filteredOrders.map((order, index) => (
                    <div key={`${order.id}-${index}`} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div className="flex items-center space-x-4 mb-3 md:mb-0">
                          <span className="text-lg font-semibold text-gray-900">Заказ №{order.id}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === "ОФОРМЛЕН" ? "bg-green-100 text-green-700" :
                            order.status === "В ПУТИ" ? "bg-yellow-100 text-yellow-700" :
                            order.status === "ДОСТАВЛЕН" ? "bg-purple-100 text-purple-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">{order.date}</div>
                      </div>

                      <div className="flex items-center space-x-3 mb-6">
                        {order.items.slice(0, 8).map((item, itemIndex) => (
                          <img
                            key={`${item.id}-${itemIndex}`}
                            src={getImageUrl(item.image) || "/placeholder.svg"}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                        {order.items.length > 8 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 border border-gray-200">
                            +{order.items.length - 8}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500 mb-2">Доставка {order.deliveryDate}</div>
                          <div className="text-xl font-semibold text-gray-900">{order.total}</div>
                        </div>
                        <div className="flex space-x-3 mt-4 md:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedOrder(order)}
                            className="px-6 py-2 border-gray-300 hover:border-gray-400"
                          >
                            Детали
                          </Button>
                          {order.canReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-6 py-2 text-brand border-brand hover:bg-brand hover:text-white transition-colors"
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
                        src={getImageUrl(item.image) || "/placeholder.svg"}
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
                      className="bg-brand hover:bg-brand-hover text-white"
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
                      <label htmlFor="photo-upload" className="cursor-pointer text-brand hover:text-purple-700">
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
                            src={getImageUrl(photo.url) || "/placeholder.svg"}
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
                  className="w-full bg-brand hover:bg-brand-hover text-white"
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
                        src={getImageUrl(item.image) || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-16 object-cover rounded"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Доставка {selectedOrder.deliveryDate}</p>
                  <p className="text-sm text-brand cursor-pointer hover:underline">Написать отзыв</p>
                </div>
              </div>
            )}

            {activeTab === "addresses" && !showAddressForm && (
              <div className="bg-white rounded-lg p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">Адреса доставки</h2>
                  <p className="text-gray-600">{addresses.length} адреса</p>
                </div>

                <div className="space-y-4 mb-8">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">{address.label}</p>
                        <p className="text-gray-600">{address.address}</p>
                        {address.city && <p className="text-sm text-gray-500 mt-1">{address.city}</p>}
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAddress(address)}
                          className="text-gray-500 hover:text-gray-700 p-2"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full h-12 bg-brand hover:bg-brand-hover text-white text-lg font-medium rounded-lg transition-colors"
                >
                  Добавить адрес
                </Button>
              </div>
            )}

            {activeTab === "addresses" && showAddressForm && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddressForm(false)
                      setEditingAddress(null)
                      setNewAddress({ label: "", address: "", city: "", region: "", postalCode: "" })
                    }}
                    className="p-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">
                    {editingAddress ? "Редактировать адрес" : "Добавить адрес"}
                  </h2>
                </div>

                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Адрес *</label>
                    <Input
                      type="text"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      placeholder="ул. Название, дом 123, кв. 45"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                    <Input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Бишкек"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Регион</label>
                    <Input
                      type="text"
                      value={newAddress.region}
                      onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                      placeholder="Чуйская область"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Почтовый индекс</label>
                    <Input
                      type="text"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder="720000"
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white"
                      disabled={!newAddress.address.trim()}
                    >
                      {editingAddress ? "Сохранить изменения" : "Добавить адрес"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                        setNewAddress({ label: "", address: "", city: "", region: "", postalCode: "" })
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && !showPaymentForm && (
              <div className="bg-white rounded-lg p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">Способы оплаты</h2>
                  <p className="text-gray-600">{paymentMethods.length} способа</p>
                </div>

                <div className="space-y-4 mb-8">
                  {paymentMethods.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">{payment.type}</p>
                        <p className="text-gray-600">
                          {payment.brand} {payment.fullNumber}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                          className="text-gray-500 hover:text-gray-700 p-2"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full h-12 bg-brand hover:bg-brand-hover text-white text-lg font-medium rounded-lg transition-colors"
                >
                  Добавить способ оплаты
                </Button>
              </div>
            )}

            {activeTab === "payments" && showPaymentForm && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPaymentForm(false)
                      setEditingPayment(null)
                      setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
                    }}
                    className="p-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">
                    {editingPayment ? "Редактировать карту" : "Добавить способ оплаты"}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Номер карты *</label>
                    <Input
                      type="text"
                      value={newPayment.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 16)
                        const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ")
                        setNewPayment({ ...newPayment, cardNumber: formatted })
                      }}
                      placeholder="1234 5678 9012 3456"
                      className="w-full"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Срок действия *</label>
                      <Input
                        type="text"
                        value={newPayment.expiryDate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                          const formatted = value.replace(/(\d{2})(?=\d)/, "$1/")
                          setNewPayment({ ...newPayment, expiryDate: formatted })
                        }}
                        placeholder="MM/YY"
                        className="w-full"
                        maxLength={5}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV *</label>
                      <Input
                        type="text"
                        value={newPayment.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 3)
                          setNewPayment({ ...newPayment, cvv: value })
                        }}
                        placeholder="123"
                        className="w-full"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя владельца карты</label>
                    <Input
                      type="text"
                      value={newPayment.cardholderName}
                      onChange={(e) => setNewPayment({ ...newPayment, cardholderName: e.target.value })}
                      placeholder="IVAN PETROV"
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={editingPayment ? handleUpdatePayment : handleAddPayment}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white"
                      disabled={
                        !newPayment.cardNumber.trim() || !newPayment.expiryDate.trim() || !newPayment.cvv.trim()
                      }
                    >
                      {editingPayment ? "Сохранить изменения" : "Добавить карту"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPaymentForm(false)
                        setEditingPayment(null)
                        setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-lg p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Уведомления</h2>
                  </div>

                  {/* Notification Settings Toggle */}
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <button
                      onClick={() =>
                        setNotificationSettings((prev) => ({ ...prev, emailNotifications: !prev.emailNotifications }))
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        notificationSettings.emailNotifications
                          ? "bg-brand text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      onClick={() =>
                        setNotificationSettings((prev) => ({ ...prev, pushNotifications: !prev.pushNotifications }))
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        notificationSettings.pushNotifications
                          ? "bg-brand text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      Push
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setNotificationFilter("all")}
                    className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      notificationFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setNotificationFilter("orders")}
                    className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      notificationFilter === "orders"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Заказы
                  </button>
                  <button
                    onClick={() => setNotificationFilter("sales")}
                    className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      notificationFilter === "sales"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Акции
                  </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-8">
                  {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium text-gray-500 mb-4 lowercase">{date}</h3>
                      <div className="space-y-4">
                        {dateNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            {notification.products.length > 0 && (
                              <div className="flex -space-x-2">
                                {notification.products.slice(0, 2).map((product, index) => (
                                  <img
                                    key={index}
                                    src={getImageUrl(product.image) || "/placeholder.svg"}
                                    alt=""
                                    className="w-12 h-12 rounded-lg border-2 border-white object-cover"
                                  />
                                ))}
                              </div>
                            )}
                            {notification.products.length === 0 && (
                              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                                <Bell className="w-6 h-6 text-brand" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {notificationFilter === "all"
                        ? "У вас пока нет уведомлений"
                        : `Нет уведомлений в категории "${notificationFilter === "orders" ? "Заказы" : "Акции"}"`}
                    </p>
                  </div>
                )}

                {/* Notification Settings */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-black mb-4">Настройки уведомлений</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black">Обновления заказов</p>
                        <p className="text-xs text-gray-500">Получать уведомления о статусе заказов</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({ ...prev, orderUpdates: !prev.orderUpdates }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.orderUpdates ? "bg-purple-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationSettings.orderUpdates ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black">Акции и скидки</p>
                        <p className="text-xs text-gray-500">Получать уведомления о новых предложениях</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({ ...prev, salesPromotions: !prev.salesPromotions }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationSettings.salesPromotions ? "bg-purple-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationSettings.salesPromotions ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-8">MARQUE</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-300 mb-4">Популярные категории</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="hover:text-white cursor-pointer transition-colors">Мужчинам</div>
                    <div className="hover:text-white cursor-pointer transition-colors">Женщинам</div>
                    <div className="hover:text-white cursor-pointer transition-colors">Детям</div>
                    <div className="hover:text-white cursor-pointer transition-colors">Спорт</div>
                    <div className="hover:text-white cursor-pointer transition-colors">Обувь</div>
                    <div className="hover:text-white cursor-pointer transition-colors">Аксессуары</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-4">Бренды</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                <div className="hover:text-white cursor-pointer transition-colors">ECCO</div>
                <div className="hover:text-white cursor-pointer transition-colors">VANS</div>
                <div className="hover:text-white cursor-pointer transition-colors">MANGO</div>
                <div className="hover:text-white cursor-pointer transition-colors">H&M</div>
                <div className="hover:text-white cursor-pointer transition-colors">LIME</div>
                <div className="hover:text-white cursor-pointer transition-colors">GUCCI</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div className="hover:text-white cursor-pointer transition-colors">Политика конфиденциальности</div>
            <div className="hover:text-white cursor-pointer transition-colors">Условия пользования</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
