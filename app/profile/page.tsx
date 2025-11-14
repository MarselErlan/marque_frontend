"use client"
import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react"
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
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useWishlist } from "@/hooks/useWishlist"
import {
  useProfile,
  Address as BackendAddress,
  PaymentMethod as BackendPaymentMethod,
  Order as BackendOrder,
  Notification as BackendNotification,
} from "@/hooks/useProfile"
import { AuthModals } from "@/components/AuthModals"
import { getImageUrl } from "@/lib/utils"
import { toast } from "sonner"

interface ReviewPhoto {
  id: number
  file: File
  url: string
}

interface AddressFormState {
  label: string
  fullAddress: string
  street: string
  city: string
  state: string
  postalCode: string
  building: string
  apartment: string
  isDefault: boolean
}

interface PaymentFormState {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
}

interface UiOrderItem {
  id: number
  name: string
  image: string
  size?: string | null
  color?: string | null
}

interface UiOrder {
  id: number
  orderNumber: string
  status: string
  statusBadgeClass: string
  statusTextClass: string
  totalLabel: string
  orderDate: string
  deliveryDate: string | null
  items: UiOrderItem[]
  isActive: boolean
  canReview: boolean
}

interface UiNotification {
  id: number
  type: string
  title: string
  message?: string | null
  time: string
  date: string
  isRead: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const auth = useAuth()
  const { isLoggedIn, userData, handleLogout } = auth
  const { wishlistItemCount } = useWishlist()
  const {
    profile,
    isLoadingProfile,
    fetchProfile,
    updateProfile,
    addresses: backendAddresses,
    isLoadingAddresses,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    paymentMethods: backendPaymentMethods,
    isLoadingPayments,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    orders: backendOrders,
    isLoadingOrders,
    fetchOrders,
    notifications: backendNotifications,
    isLoadingNotifications,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount,
    phoneNumbers,
    isLoadingPhones,
    fetchPhoneNumbers,
    createPhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber,
  } = useProfile()
  
  // Handle logout with redirect
  const handleLogoutClick = async () => {
    try {
      console.log('🔴 Profile: Starting logout...')
      await handleLogout()
      toast.success('Вы успешно вышли из аккаунта')
      console.log('🔴 Profile: Redirecting to home...')
      
      // Force a hard navigation to ensure auth state is reset
      window.location.href = '/'
    } catch (error) {
      console.error('🔴 Profile: Logout error:', error)
      toast.error('Ошибка при выходе из аккаунта')
    }
  }
  
  const [activeTab, setActiveTab] = useState("profile")
  const [orderFilter, setOrderFilter] = useState("active")
  const [userName, setUserName] = useState("Анна Ахматова")
  const [phoneNumber, setPhoneNumber] = useState("+996 505 32 53 11")
  const [additionalPhone, setAdditionalPhone] = useState("")
  const [additionalPhoneId, setAdditionalPhoneId] = useState<number | null>(null)
  const [isSavingAdditionalPhone, setIsSavingAdditionalPhone] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Authentication states are now managed by the useAuth hook.
  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewPhotos, setReviewPhotos] = useState<ReviewPhoto[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<BackendAddress | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const createEmptyAddress = (): AddressFormState => ({
    label: "",
    fullAddress: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    building: "",
    apartment: "",
    isDefault: false,
  })
  const [newAddress, setNewAddress] = useState<AddressFormState>(createEmptyAddress())
  const resetAddressForm = () => setNewAddress(createEmptyAddress())

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [newPayment, setNewPayment] = useState<PaymentFormState>({
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

  const userLocation = (
    profile?.location ||
    profile?.market ||
    userData?.location ||
    userData?.market ||
    'KG'
  ).toUpperCase()
  const isUSLocation = userLocation === 'US'
  const additionalPhonePlaceholder = isUSLocation ? "+1 555 123 4567" : "+996 505 32 53 11"
  const profileImageUrl = profile?.profile_image ? getImageUrl(profile.profile_image) : null

  // Mock notifications data
  const getNotificationDateLabel = (date: Date) => {
    const today = new Date()
    const diffInMs = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInDays === 0) return "сегодня"
    if (diffInDays === 1) return "вчера"
    return date.toLocaleDateString("ru-RU")
  }

  const composeFullAddress = (address: AddressFormState) => {
    const parts = [
      address.street?.trim(),
      address.city?.trim(),
      address.state?.trim(),
      address.postalCode?.trim(),
    ].filter(Boolean)

    return parts.join(", ")
  }

  const notifications: UiNotification[] = useMemo(() => {
    return backendNotifications.map((notification) => {
      const createdAt = new Date(notification.created_at)
      const time = Number.isNaN(createdAt.getTime())
        ? ""
        : createdAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      const dateLabel = Number.isNaN(createdAt.getTime()) ? "" : getNotificationDateLabel(new Date(createdAt))

      return {
        id: notification.id,
        type: notification.type || "other",
        title: notification.title || "Уведомление",
        message: notification.message,
        time,
        date: dateLabel,
        isRead: notification.is_read,
      }
    })
  }, [backendNotifications])

  // checkAuthStatus and handleLogout are now handled by the useAuth hook.

  // Check auth status on component mount
  useEffect(() => {
    // If loading is finished and user is not logged in, redirect to home
    if (!auth.isLoading && !auth.isLoggedIn) {
      console.log('🔴 Profile: User not logged in, redirecting to home...')
      router.push('/')
      return
    }
    
    // Update user data if logged in
    if (userData) {
      setUserName(userData.full_name || userData.name || "Анна Ахматова")
      setPhoneNumber(userData.phone || "+996 505 32 53 11")
    }
  }, [auth.isLoading, auth.isLoggedIn, userData, router])

  useEffect(() => {
    if (isLoadingPhones) {
      return
    }
    if (phoneNumbers.length > 0) {
      const primary = phoneNumbers.find((number) => number.is_primary) ?? phoneNumbers[0]
      setAdditionalPhone(primary.phone)
      setAdditionalPhoneId(primary.id)
    } else {
      setAdditionalPhone("")
      setAdditionalPhoneId(null)
    }
  }, [phoneNumbers, isLoadingPhones])

  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || profile.name || "")
      setPhoneNumber(profile.phone)
    }
  }, [profile])

  useEffect(() => {
    // Only fetch data if user is logged in
    if (!auth.isLoggedIn || auth.isLoading) {
      return
    }
    
    fetchProfile()
    fetchAddresses()
    fetchPaymentMethods()
    fetchOrders()
    fetchNotifications()
    fetchPhoneNumbers()
  }, [auth.isLoggedIn, auth.isLoading, fetchProfile, fetchAddresses, fetchPaymentMethods, fetchOrders, fetchNotifications, fetchPhoneNumbers])

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

  const statusMeta: Record<string, { label: string; badgeClass: string; textClass: string }> = {
    pending: { label: "В ожидании", badgeClass: "bg-yellow-100 text-yellow-700", textClass: "text-yellow-700" },
    confirmed: { label: "Подтвержден", badgeClass: "bg-green-100 text-green-700", textClass: "text-green-700" },
    processing: { label: "Обрабатывается", badgeClass: "bg-blue-100 text-blue-700", textClass: "text-blue-700" },
    shipped: { label: "В пути", badgeClass: "bg-purple-100 text-purple-700", textClass: "text-purple-700" },
    delivered: { label: "Доставлен", badgeClass: "bg-brand/10 text-brand", textClass: "text-brand" },
    cancelled: { label: "Отменен", badgeClass: "bg-red-100 text-red-700", textClass: "text-red-700" },
    refunded: { label: "Возврат", badgeClass: "bg-red-100 text-red-700", textClass: "text-red-700" },
  }

  const formatDate = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString("ru-RU")
  }

  const orders: UiOrder[] = useMemo(() => {
    return backendOrders.map((order) => {
      const status =
        statusMeta[order.status] ?? {
          label: order.status,
          badgeClass: "bg-gray-100 text-gray-700",
          textClass: "text-gray-700",
        }
      const totalLabel = order.total_amount
        ? `${order.total_amount} ${order.currency ?? ""}`.trim()
        : ""

      const items: UiOrderItem[] =
        order.items?.map((item, index) => ({
          id: item.id ?? index,
          name: item.product_name,
          image: item.image_url || "/images/product_placeholder_adobe.png",
          size: item.size,
          color: item.color,
        })) ?? []

      return {
        id: order.id,
        orderNumber: order.order_number,
        status: status.label,
        statusBadgeClass: status.badgeClass,
        statusTextClass: status.textClass,
        totalLabel,
        orderDate: formatDate(order.order_date) ?? "",
        deliveryDate: formatDate(order.delivery_date),
        items,
        isActive: !["delivered", "cancelled", "refunded"].includes(order.status),
        canReview: order.status === "delivered",
      }
    })
  }, [backendOrders])

  const filteredOrders = orders.filter((order) => (orderFilter === "active" ? order.isActive : !order.isActive))

  const activeOrdersCount = orders.filter((order) => order.isActive).length

  const handleProfileImageButtonClick = () => {
    if (isUploadingImage) return
    fileInputRef.current?.click()
  }

  const handleProfileImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      await updateProfile({ profile_image: file })
    } catch (error) {
      console.error('Profile image upload failed', error)
      toast.error('Не удалось загрузить фото профиля')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleSaveAdditionalPhone = async () => {
    const trimmed = additionalPhone.trim()
    if (!trimmed) {
      toast.error("Введите дополнительный номер телефона")
      return
    }
    if (!trimmed.startsWith('+')) {
      toast.error("Добавьте код страны, например +996...")
      return
    }
    setIsSavingAdditionalPhone(true)
    try {
      const payload = { phone: trimmed, label: 'Additional', is_primary: true }
      const success = additionalPhoneId
        ? await updatePhoneNumber(additionalPhoneId, payload)
        : await createPhoneNumber(payload)
      if (success) {
        setAdditionalPhone(trimmed)
      }
    } finally {
      setIsSavingAdditionalPhone(false)
    }
  }

  const handleRemoveAdditionalPhone = async () => {
    if (!additionalPhoneId) return
    setIsSavingAdditionalPhone(true)
    try {
      const success = await deletePhoneNumber(additionalPhoneId)
      if (success) {
        setAdditionalPhone("")
        setAdditionalPhoneId(null)
      }
    } finally {
      setIsSavingAdditionalPhone(false)
    }
  }

  const handleAddAddress = async () => {
    if (!isUSLocation && !newAddress.fullAddress.trim()) {
      toast.error("Введите адрес доставки")
      return
    }

    if (!newAddress.city.trim()) {
      toast.error("Введите город")
      return
    }

    if (isUSLocation) {
      if (!newAddress.street.trim()) {
        toast.error("Введите улицу")
        return
      }
      if (!newAddress.state.trim()) {
        toast.error("Укажите штат/регион")
        return
      }
      if (!newAddress.postalCode.trim()) {
        toast.error("Укажите почтовый индекс")
        return
      }
    }

    const fullAddressValue = (newAddress.fullAddress || composeFullAddress(newAddress)).trim()

    if (!fullAddressValue) {
      toast.error("Введите полный адрес")
      return
    }

    const success = await createAddress({
      title: newAddress.label || "Адрес",
      full_address: fullAddressValue,
      street: newAddress.street || undefined,
      city: newAddress.city || undefined,
      state: isUSLocation ? newAddress.state || undefined : undefined,
      postal_code: newAddress.postalCode || undefined,
      country:
        profile?.country ||
        (isUSLocation ? "United States" : "Kyrgyzstan"),
      is_default: newAddress.isDefault || undefined,
    })

    if (success) {
      resetAddressForm()
      setShowAddressForm(false)
      setEditingAddress(null)
    }
  }

  const handleEditAddress = (address: BackendAddress) => {
    setEditingAddress(address)
    setNewAddress({
      label: address.title || "Адрес",
      fullAddress: address.full_address || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postal_code || "",
      building: address.building || "",
      apartment: address.apartment || "",
      isDefault: address.is_default || false,
    })
    setShowAddressForm(true)
  }

  const handleUpdateAddress = async () => {
    if (!editingAddress) return
    if (!isUSLocation && !newAddress.fullAddress.trim()) {
      toast.error("Введите адрес доставки")
      return
    }

    if (!newAddress.city.trim()) {
      toast.error("Введите город")
      return
    }

    if (isUSLocation) {
      if (!newAddress.street.trim()) {
        toast.error("Введите улицу")
        return
      }
      if (!newAddress.state.trim()) {
        toast.error("Укажите штат/регион")
        return
      }
      if (!newAddress.postalCode.trim()) {
        toast.error("Укажите почтовый индекс")
        return
      }
    }

    const fullAddressValue = (newAddress.fullAddress || composeFullAddress(newAddress)).trim()

    if (!fullAddressValue) {
      toast.error("Введите полный адрес")
      return
    }

    const success = await updateAddress(editingAddress.id, {
      title: newAddress.label || "Адрес",
      full_address: fullAddressValue,
      street: newAddress.street || undefined,
      city: newAddress.city || undefined,
      state: isUSLocation ? newAddress.state || undefined : undefined,
      postal_code: newAddress.postalCode || undefined,
      country:
        profile?.country ||
        (isUSLocation ? "United States" : "Kyrgyzstan"),
      is_default: newAddress.isDefault || undefined,
    })

    if (success) {
      resetAddressForm()
      setShowAddressForm(false)
      setEditingAddress(null)
    }
  }

  const handleDeleteAddress = async (addressId: number) => {
    await deleteAddress(addressId)
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

  const handleAddPayment = async () => {
    if (!newPayment.cardNumber.trim() || !newPayment.expiryDate.trim() || !newPayment.cvv.trim()) {
      toast.error("Заполните данные карты")
      return
    }

    const sanitizedNumber = newPayment.cardNumber.replace(/\s/g, "")
    if (sanitizedNumber.length < 13) {
      toast.error("Неверный номер карты")
      return
    }

    const [monthRaw, yearRaw] = newPayment.expiryDate.split("/")
    if (!monthRaw || !yearRaw) {
      toast.error("Укажите срок действия в формате MM/YY")
      return
    }

    const expiry_month = monthRaw.padStart(2, "0")
    const expiry_year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw

    const success = await createPaymentMethod({
      card_number: sanitizedNumber,
      card_holder_name: newPayment.cardholderName || "Cardholder",
      expiry_month,
      expiry_year,
    })

    if (success) {
      setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
      setShowPaymentForm(false)
    }
  }

  const handleDeletePayment = async (paymentId: number) => {
    await deletePaymentMethod(paymentId)
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
                    <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleProfileImageButtonClick}
                      disabled={isUploadingImage}
                      className="absolute bottom-0 right-0 w-9 h-9 bg-brand rounded-full flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-70"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageChange}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">{userName}</h2>
                    <p className="text-gray-600 text-lg mb-3">{phoneNumber}</p>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleProfileImageButtonClick}
                      className="text-brand border-brand hover:bg-brand hover:text-white transition-colors"
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? 'Загрузка...' : 'Редактировать фото'}
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Input
                        type="tel"
                        value={additionalPhone}
                        onChange={(e) => setAdditionalPhone(e.target.value)}
                        placeholder={additionalPhonePlaceholder}
                        className="w-full h-12 text-lg border-gray-300 focus:border-brand focus:ring-brand"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleSaveAdditionalPhone}
                          disabled={isSavingAdditionalPhone || isLoadingPhones || !additionalPhone.trim()}
                          className="px-4 sm:px-6"
                        >
                          {isSavingAdditionalPhone ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Сохраняем...
                            </span>
                          ) : (
                            additionalPhoneId ? "Обновить" : "Добавить"
                          )}
                        </Button>
                        {additionalPhoneId && (
                          <Button
                            variant="outline"
                            onClick={handleRemoveAdditionalPhone}
                            disabled={isSavingAdditionalPhone || isLoadingPhones}
                            className="px-4 sm:px-6"
                          >
                            Удалить
                          </Button>
                        )}
                      </div>
                    </div>
                    {isLoadingPhones && (
                      <p className="text-sm text-gray-500 mt-2">Загружаем дополнительные номера...</p>
                    )}
                    {!isLoadingPhones && phoneNumbers.length > 1 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Другие номера</p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          {phoneNumbers
                            .filter((number) => number.id !== additionalPhoneId)
                            .map((number) => (
                              <li key={number.id}>
                                {number.phone}
                                {number.label ? ` • ${number.label}` : ""}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="pt-8 border-t border-gray-200">
                    <Button
                      onClick={handleLogoutClick}
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
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.statusBadgeClass}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">{order.orderDate}</div>
                      </div>

                      <div className="flex items-center space-x-3 mb-6">
                        {order.items.slice(0, 8).map((item, itemIndex) => (
                          <img
                            key={`${item.id}-${itemIndex}`}
                          src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
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
                          <div className="text-xl font-semibold text-gray-900">{order.totalLabel}</div>
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
                  <span className={`px-2 py-1 rounded text-xs font-medium ${selectedOrder.statusBadgeClass}`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <img
                        src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
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
                    <span className="text-lg font-semibold">Итого: {selectedOrder.totalLabel}</span>
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
                            src={getImageUrl(photo.url) || "/images/product_placeholder_adobe.png"}
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
                        src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
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
                  <p className="text-gray-600">{backendAddresses.length} адреса</p>
                </div>

                <div className="space-y-4 mb-8">
                  {backendAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">{address.title || "Адрес"}</p>
                        <p className="text-gray-600">{address.full_address}</p>
                        {(address.city || address.state || address.postal_code) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
                          </p>
                        )}
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
                    resetAddressForm()
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Адрес *</label>
                      <Input
                        type="text"
                        value={newAddress.fullAddress}
                        onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                        placeholder="ул. Название, дом 123, кв. 45"
                        className="w-full"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Город *</label>
                    <Input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder={isUSLocation ? "Chicago" : "Бишкек"}
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isUSLocation ? "Штат / Регион *" : "Регион"}
                    </label>
                    <Input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder={isUSLocation ? "IL" : "Чуйская область"}
                      className="w-full"
                      required={isUSLocation}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isUSLocation ? "ZIP / Почтовый индекс *" : "Почтовый индекс"}
                    </label>
                    <Input
                      type="text"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      placeholder={isUSLocation ? "60074" : "720000"}
                      className="w-full"
                      required={isUSLocation}
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white"
                      disabled={
                        (!isUSLocation && !newAddress.fullAddress.trim()) ||
                        !newAddress.city.trim() ||
                        (isUSLocation &&
                          (!newAddress.street.trim() ||
                            !newAddress.state.trim() ||
                            !newAddress.postalCode.trim()))
                      }
                    >
                      {editingAddress ? "Сохранить изменения" : "Добавить адрес"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                        resetAddressForm()
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
                  <p className="text-gray-600">{backendPaymentMethods.length} способа</p>
                </div>

                <div className="space-y-4 mb-8">
                  {backendPaymentMethods.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          {payment.payment_type === "card" ? "Банковская карта" : payment.payment_type}
                        </p>
                        <p className="text-gray-600">
                          {payment.card_type ? payment.card_type.toUpperCase() : "Карта"}{" "}
                          {payment.card_number_masked || ""}
                        </p>
                        {payment.is_default && (
                          <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                            Основной способ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
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
                            <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center">
                              <Bell className="w-6 h-6 text-brand" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900">{notification.title}</p>
                              {notification.message && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{notification.message}</p>
                              )}
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
