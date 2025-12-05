"use client"
import { useState, useEffect, useMemo, useRef, ChangeEvent, useCallback } from "react"
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
  ChevronRight,
  Settings,
  Languages,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useWishlist } from "@/hooks/useWishlist"
import { useLanguage } from "@/contexts/LanguageContext"
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
import { ordersApi, profileApi } from "@/lib/api"
import { useCurrency } from "@/hooks/useCurrency"

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
  entrance: string
  floor: string
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
  hasReview?: boolean
  reviewedProductIds?: number[] // Track which products have been reviewed
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
  const { language, setLanguage, t } = useLanguage()
  const { format, currency, formatDirect, isLoading: isCurrencyLoading } = useCurrency()
  
  // Store formatted order prices
  const [formattedOrderPrices, setFormattedOrderPrices] = useState<Record<string, {
    itemPrices: Record<number, { price: string; subtotal: string }>
    subtotal: string
    shipping: string
    total: string
  }>>({})
  
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
  } = useProfile()
  
  // Handle logout with redirect
  const handleLogoutClick = async () => {
    try {
      console.log('🔴 Profile: Starting logout...')
      await handleLogout()
      toast.success(t('auth.logoutSuccess'))
      console.log('🔴 Profile: Redirecting to home...')
      
      // Force a hard navigation to ensure auth state is reset
      window.location.href = '/'
    } catch (error) {
      console.error('🔴 Profile: Logout error:', error)
      toast.error(t('auth.logoutError'))
    }
  }
  
  const [activeTab, setActiveTab] = useState("profile")
  const [orderFilter, setOrderFilter] = useState("active")
  const [userName, setUserName] = useState(t('profile.defaultName'))
  const [phoneNumber, setPhoneNumber] = useState(t('profile.defaultPhone'))
  const [pendingProfileImage, setPendingProfileImage] = useState<File | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [localProfileImageUrl, setLocalProfileImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Authentication states are now managed by the useAuth hook.
  const [selectedOrder, setSelectedOrder] = useState<UiOrder | null>(null)
  const [orderDetail, setOrderDetail] = useState<any>(null)
  const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewPhotos, setReviewPhotos] = useState<ReviewPhoto[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showProductSelection, setShowProductSelection] = useState(false) // New: Show product selection view
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
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
      entrance: "",
      floor: "",
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
  const profileImageUrl = localProfileImageUrl || (profile?.profile_image ? getImageUrl(profile.profile_image) : null)
  
  // Update local image URL when profile changes
  useEffect(() => {
    if (profile?.profile_image && !localProfileImageUrl) {
      setLocalProfileImageUrl(getImageUrl(profile.profile_image))
    }
  }, [profile?.profile_image])

  // Mock notifications data
  const getNotificationDateLabel = (date: Date) => {
    const today = new Date()
    const diffInMs = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInDays === 0) return t('common.today')
    if (diffInDays === 1) return t('common.yesterday')
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'ky' ? 'ky-KG' : 'en-US')
  }

  const composeFullAddress = (address: AddressFormState) => {
    if (isUSLocation) {
      // US format: street, city, state, postalCode
      const parts = [
        address.street?.trim(),
        address.fullAddress?.trim(), // Added fullAddress for US
        address.city?.trim(),
        address.state?.trim(),
        address.postalCode?.trim(),
      ].filter(Boolean)
      return parts.join(", ")
    } else {
      // KG format: street, building, apartment, entrance, floor, city
      const parts = [
        address.street?.trim() ? `${t('addresses.street')} ${address.street.trim()}` : null,
        address.building?.trim() ? `${t('addresses.buildingShort')} ${address.building.trim()}` : null,
        address.apartment?.trim() ? `${t('addresses.apartmentShort')} ${address.apartment.trim()}` : null,
        address.entrance?.trim() ? `${t('addresses.entrance')} ${address.entrance.trim()}` : null,
        address.floor?.trim() ? `${t('addresses.floor')} ${address.floor.trim()}` : null,
        address.city?.trim(),
      ].filter(Boolean)
      return parts.join(", ")
    }
  }

  const notifications: UiNotification[] = useMemo(() => {
    return backendNotifications.map((notification) => {
      const createdAt = new Date(notification.created_at)
      const time = Number.isNaN(createdAt.getTime())
        ? ""
        : createdAt.toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'ky' ? 'ky-KG' : 'en-US', { hour: "2-digit", minute: "2-digit" })
      const dateLabel = Number.isNaN(createdAt.getTime()) ? "" : getNotificationDateLabel(new Date(createdAt))

      return {
        id: notification.id,
        type: notification.type || "other",
        title: notification.title || t('notifications.defaultTitle'),
        message: notification.message,
        time,
        date: dateLabel,
        isRead: notification.is_read,
      }
    })
  }, [backendNotifications, language, t])

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
      setUserName(userData.full_name || userData.name || t('profile.defaultName'))
      setPhoneNumber(userData.phone || t('profile.defaultPhone'))
    }
  }, [auth.isLoading, auth.isLoggedIn, userData, router, t])


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
  }, [auth.isLoggedIn, auth.isLoading, fetchProfile, fetchAddresses, fetchPaymentMethods, fetchOrders, fetchNotifications])

  // Fetch order detail when selectedOrder changes
  useEffect(() => {
    if (selectedOrder && !showReviewForm) {
      const fetchOrderDetail = async () => {
        setIsLoadingOrderDetail(true)
        try {
          const detail = await profileApi.getOrderDetail(selectedOrder.id)
          if (detail.success && detail.order) {
            setOrderDetail(detail.order)
          }
        } catch (error) {
          console.error('Failed to fetch order detail:', error)
        } finally {
          setIsLoadingOrderDetail(false)
        }
      }
      fetchOrderDetail()
    } else {
      setOrderDetail(null)
    }
  }, [selectedOrder, showReviewForm])

  // Format order prices when orderDetail or currency changes
  useEffect(() => {
    const formatOrderPrices = async () => {
      if (!orderDetail || isCurrencyLoading || !currency) {
        console.log('⏳ Waiting for order detail or currency:', { orderDetail: !!orderDetail, isCurrencyLoading, currency: !!currency })
        return
      }
      
      const orderCurrency = orderDetail.currency || 'KGS'
      const orderKey = orderDetail.id || orderDetail.order_number || selectedOrder?.id || 'default'
      console.log('💰 Formatting order prices:', { orderKey, orderCurrency, userCurrency: currency.code })
      
      const itemPrices: Record<number, { price: string; subtotal: string }> = {}
      
      if (orderDetail.items && orderDetail.items.length > 0) {
        await Promise.all(
          orderDetail.items.map(async (item: any, index: number) => {
            const itemId = item.id || index
            const price = item.price ? await format(item.price, orderCurrency) : ''
            const subtotal = item.subtotal ? await format(item.subtotal, orderCurrency) : ''
            itemPrices[itemId] = { price, subtotal }
            console.log('💰 Formatted item price:', { itemId, originalPrice: item.price, formattedPrice: price, originalSubtotal: item.subtotal, formattedSubtotal: subtotal })
          })
        )
      }
      
      const subtotal = orderDetail.subtotal !== undefined ? await format(orderDetail.subtotal, orderCurrency) : ''
      const shipping = orderDetail.shipping_cost !== undefined ? await format(orderDetail.shipping_cost, orderCurrency) : ''
      const total = orderDetail.total_amount ? await format(orderDetail.total_amount, orderCurrency) : ''
      
      console.log('💰 Formatted order totals:', { subtotal, shipping, total })
      
      setFormattedOrderPrices({
        [orderKey]: {
          itemPrices,
          subtotal,
          shipping,
          total,
        }
      })
    }
    
    formatOrderPrices()
  }, [orderDetail, currency, isCurrencyLoading, format, selectedOrder])

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

  const statusMeta: Record<string, { label: string; badgeClass: string; textClass: string }> = useMemo(() => ({
    pending: { label: t('orders.status.pending'), badgeClass: "bg-yellow-100 text-yellow-700", textClass: "text-yellow-700" },
    confirmed: { label: t('orders.status.confirmed'), badgeClass: "bg-green-100 text-green-700", textClass: "text-green-700" },
    processing: { label: t('orders.status.processing'), badgeClass: "bg-blue-100 text-blue-700", textClass: "text-blue-700" },
    shipped: { label: t('orders.status.shipped'), badgeClass: "bg-purple-100 text-purple-700", textClass: "text-purple-700" },
    delivered: { label: t('orders.status.delivered'), badgeClass: "bg-brand/10 text-brand", textClass: "text-brand" },
    cancelled: { label: t('orders.status.cancelled'), badgeClass: "bg-red-100 text-red-700", textClass: "text-red-700" },
    refunded: { label: t('orders.status.refunded'), badgeClass: "bg-red-100 text-red-700", textClass: "text-red-700" },
  }), [t])

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'ky' ? 'ky-KG' : 'en-US')
  }, [language])

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

      // Get unique product IDs from order items
      const uniqueProductIds = new Set<number>()
      order.items?.forEach((item: any) => {
        if (item.product_id) {
          uniqueProductIds.add(item.product_id)
        }
      })

      // Check if all products have been reviewed
      const reviewedProductIds = (order as any).reviewed_product_ids || []
      const allProductsReviewed = uniqueProductIds.size > 0 && 
        Array.from(uniqueProductIds).every(id => reviewedProductIds.includes(id))

      return {
        id: order.id,
        orderNumber: order.order_number,
        status: status.label,
        statusBadgeClass: status.badgeClass,
        statusTextClass: status.textClass,
        totalLabel,
        orderDate: formatDate(order.order_date) ?? "",
        deliveryDate: formatDate(order.requested_delivery_date || order.delivery_date),
        items,
        isActive: !["delivered", "cancelled", "refunded"].includes(order.status),
        canReview: order.status === "delivered" && !allProductsReviewed,
        hasReview: allProductsReviewed,
        reviewedProductIds: reviewedProductIds,
      }
    })
  }, [backendOrders, statusMeta, formatDate, t, language])

  const filteredOrders = orders.filter((order) => (orderFilter === "active" ? order.isActive : !order.isActive))

  const activeOrdersCount = orders.filter((order) => order.isActive).length

  const handleProfileImageButtonClick = () => {
    if (isUploadingImage) return
    fileInputRef.current?.click()
  }

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPendingProfileImage(file)
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setLocalProfileImageUrl(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleUpdateProfile = async () => {
    const trimmed = userName.trim()
    if (!trimmed) {
      toast.error(t('validation.enterName'))
      return
    }
    
    setIsUpdatingProfile(true)
    try {
      // Update profile with name and image together
      const updateData: any = { full_name: trimmed }
      if (pendingProfileImage) {
        updateData.profile_image = pendingProfileImage
      }
      
      await updateProfile(updateData)
      
      // Clear pending image after successful update and refresh profile
      if (pendingProfileImage) {
        setPendingProfileImage(null)
        // Refresh profile to get new image URL
        await fetchProfile()
      }
      
      toast.success(t('profile.profileUpdated'))
    } catch (error) {
      console.error('Profile update failed', error)
      toast.error(t('profile.profileUpdateError'))
    } finally {
      setIsUpdatingProfile(false)
    }
  }


  const handleAddAddress = async () => {
    if (!newAddress.city.trim()) {
      toast.error(t('validation.enterCity'))
      return
    }

    if (isUSLocation) {
      if (!newAddress.street.trim()) {
        toast.error(t('validation.enterStreet'))
        return
      }
      if (!newAddress.state.trim()) {
        toast.error(t('validation.enterState'))
        return
      }
      if (!newAddress.postalCode.trim()) {
        toast.error(t('validation.enterPostalCode'))
        return
      }
    } else {
      // KG validation
      if (!newAddress.street.trim()) {
        toast.error(t('validation.enterStreet'))
        return
      }
      if (!newAddress.building.trim()) {
        toast.error(t('validation.enterBuilding'))
        return
      }
    }

    const fullAddressValue = (newAddress.fullAddress || composeFullAddress(newAddress)).trim()

    if (!fullAddressValue) {
      toast.error(t('validation.enterFullAddress'))
      return
    }

    const success = await createAddress({
      title: newAddress.label || t('addresses.defaultTitle'),
      full_address: fullAddressValue,
      street: newAddress.street || undefined,
      city: newAddress.city || undefined,
      state: isUSLocation ? newAddress.state || undefined : undefined,
      postal_code: newAddress.postalCode || undefined,
      building: newAddress.building || undefined,
      apartment: newAddress.apartment || undefined,
      entrance: newAddress.entrance || undefined,
      floor: newAddress.floor || undefined,
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
      label: address.title || t('addresses.defaultTitle'),
      fullAddress: address.full_address || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postal_code || "",
      building: address.building || "",
      apartment: address.apartment || "",
      entrance: (address as any).entrance || "",
      floor: (address as any).floor || "",
      isDefault: address.is_default || false,
    })
    setShowAddressForm(true)
  }

  const handleUpdateAddress = async () => {
    if (!editingAddress) return

    if (!newAddress.city.trim()) {
      toast.error(t('validation.enterCity'))
      return
    }

    if (isUSLocation) {
      if (!newAddress.street.trim()) {
        toast.error(t('validation.enterStreet'))
        return
      }
      if (!newAddress.state.trim()) {
        toast.error(t('validation.enterState'))
        return
      }
      if (!newAddress.postalCode.trim()) {
        toast.error(t('validation.enterPostalCode'))
        return
      }
    } else {
      // KG validation
      if (!newAddress.street.trim()) {
        toast.error(t('validation.enterStreet'))
        return
      }
      if (!newAddress.building.trim()) {
        toast.error(t('validation.enterBuilding'))
        return
      }
    }

    const fullAddressValue = (newAddress.fullAddress || composeFullAddress(newAddress)).trim()

    if (!fullAddressValue) {
      toast.error(t('validation.enterFullAddress'))
      return
    }

    const success = await updateAddress(editingAddress.id, {
      title: newAddress.label || t('addresses.defaultTitle'),
      full_address: fullAddressValue,
      street: newAddress.street || undefined,
      city: newAddress.city || undefined,
      state: isUSLocation ? newAddress.state || undefined : undefined,
      postal_code: newAddress.postalCode || undefined,
      building: newAddress.building || undefined,
      apartment: newAddress.apartment || undefined,
      entrance: newAddress.entrance || undefined,
      floor: newAddress.floor || undefined,
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
    // Reset input to allow selecting the same files again if needed
    e.target.value = ''
  }

  const removePhoto = (photoId: number) => {
    setReviewPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
  }

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error(t('product.reviewRatingRequired'))
      return
    }
    if (!reviewText.trim()) {
      toast.error(t('product.reviewTextRequired'))
      return
    }
    if (!selectedOrder) {
      toast.error(t('product.reviewOrderMissing'))
      return
    }
    if (!selectedProductId) {
      toast.error(t('product.reviewProductMissing'))
      return
    }

    setIsSubmittingReview(true)
    try {
      const imageFiles = reviewPhotos.length > 0 ? reviewPhotos.map((photo) => photo.file) : []
      
      await ordersApi.createReview({
        order_id: selectedOrder.id,
        product_id: selectedProductId,
        rating: reviewRating,
        comment: reviewText.trim(),
        images: imageFiles.length > 0 ? imageFiles : undefined,
      })

      toast.success(t('product.reviewSubmitted'))
      
      // Update reviewedProductIds locally
      if (selectedOrder && selectedProductId) {
        const updatedReviewedIds = [...(selectedOrder.reviewedProductIds || []), selectedProductId]
        
        // Get unique product IDs from order items
        const uniqueProductIds = new Set<number>()
        if (orderDetail?.order?.items) {
          orderDetail.order.items.forEach((item: any) => {
            if (item.product_id) {
              uniqueProductIds.add(item.product_id)
            }
          })
        }
        
        // Check if all products are now reviewed
        const allReviewed = uniqueProductIds.size > 0 && 
          Array.from(uniqueProductIds).every(id => updatedReviewedIds.includes(id))
        
        setSelectedOrder({
          ...selectedOrder,
          reviewedProductIds: updatedReviewedIds,
          hasReview: allReviewed,
          canReview: !allReviewed,
        })
        
        // Also update orderDetail if it exists
        if (orderDetail?.order) {
          setOrderDetail({
            ...orderDetail,
            order: {
              ...orderDetail.order,
              reviewed_product_ids: updatedReviewedIds,
            }
          })
        }
      }
      
      // Reset form
      setReviewRating(0)
      setReviewText("")
      setReviewPhotos([])
      
      // Check if there are more products to review
      if (selectedOrder && orderDetail?.order?.items) {
        const uniqueProductIds = new Set<number>()
        orderDetail.order.items.forEach((item: any) => {
          if (item.product_id) {
            uniqueProductIds.add(item.product_id)
          }
        })
        
        const reviewedIds = selectedOrder.reviewedProductIds || []
        const remainingProducts = Array.from(uniqueProductIds).filter(id => !reviewedIds.includes(id))
        
        if (remainingProducts.length > 0) {
          // More products to review - go back to product selection
          setSelectedProductId(null)
          setShowReviewForm(false)
          setShowProductSelection(true)
        } else {
          // All products reviewed - go back to order list
          setShowReviewForm(false)
          setShowProductSelection(false)
          setSelectedProductId(null)
          setSelectedOrder(null)
          setOrderDetail(null)
        }
      } else {
        setShowReviewForm(false)
        setShowProductSelection(false)
        setSelectedProductId(null)
      }
      
      // Refresh orders to update review status from backend
      fetchOrders()
    } catch (error: any) {
      console.error('Review submission error:', error)
      const errorMessage = error?.message || error?.detail || t('product.reviewSubmitError')
      toast.error(errorMessage)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleAddPayment = async () => {
    if (!newPayment.cardNumber.trim() || !newPayment.expiryDate.trim() || !newPayment.cvv.trim()) {
      toast.error(t('validation.fillCardData'))
      return
    }

    const sanitizedNumber = newPayment.cardNumber.replace(/\s/g, "")
    if (sanitizedNumber.length < 13) {
      toast.error(t('validation.invalidCardNumber'))
      return
    }

    const [monthRaw, yearRaw] = newPayment.expiryDate.split("/")
    if (!monthRaw || !yearRaw) {
      toast.error(t('validation.invalidExpiryFormat'))
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

  const sidebarItems = useMemo(() => [
    { id: "profile", label: t('profile.myProfile'), icon: User },
    { id: "orders", label: t('profile.orders'), icon: Package },
    { id: "addresses", label: t('profile.addresses'), icon: MapPin },
    { id: "payments", label: t('profile.payments'), icon: CreditCard },
    { id: "settings", label: t('profile.settings'), icon: Settings },
  ], [t])

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


  const mobileTabItems = useMemo(() => [
    { id: "profile", label: t('profile.myProfile') },
    { id: "orders", label: t('profile.orders') },
    { id: "addresses", label: t('profile.addresses') },
    { id: "payments", label: t('profile.payments') },
    { id: "settings", label: t('profile.settings') },
  ], [t])

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      
      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex overflow-x-auto px-4">
          {mobileTabItems.map((item) => {
            const Icon = sidebarItems.find(si => si.id === item.id)?.icon || User
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === item.id
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8 py-0 md:py-4 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block w-64">
            <div className="bg-white rounded-lg p-6">
              <h1 className="text-2xl font-bold text-black mb-6">{t('profile.title')}</h1>
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
          <div className="flex-1 bg-white md:bg-transparent">
            {activeTab === "profile" && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6 lg:p-8">
                {/* Profile Header */}
                <div className="flex items-start md:items-center space-x-4 md:space-x-6 mb-6 md:mb-8">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleProfileImageButtonClick}
                      disabled={isUploadingImage}
                      className="absolute bottom-0 right-0 w-7 h-7 md:w-9 md:h-9 bg-brand rounded-full flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-70"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 text-white animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3 md:w-4 md:h-4 text-white" />
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
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-2xl font-semibold text-gray-900 mb-1">{userName}</h2>
                    <p className="text-sm md:text-lg text-gray-600 mb-3">{phoneNumber}</p>
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile || !userName.trim()}
                      className="bg-brand/40 md:bg-transparent text-brand md:text-brand border-brand/40 md:border-brand hover:bg-brand/50 md:hover:bg-brand hover:text-white transition-colors text-xs md:text-sm"
                    >
                      {isUpdatingProfile ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                          {t('profile.updating')}
                        </span>
                      ) : (
                        t('profile.update')
                      )}
                    </Button>
                    {pendingProfileImage && (
                      <p className="text-xs text-gray-500 mt-2">{t('profile.imageWillUpdate')}</p>
                    )}
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-3">{t('profile.fullName')}</label>
                    <Input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full h-11 md:h-12 text-base md:text-lg border-gray-300 focus:border-brand focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 md:mb-3">
                      {t('profile.phoneCannotChange')}
                    </label>
                    <Input 
                      type="tel" 
                      value={phoneNumber} 
                      disabled 
                      className="w-full h-11 md:h-12 text-base md:text-lg bg-gray-50 border-gray-200 text-gray-500" 
                    />
                  </div>

                  {/* Logout Button */}
                  <div className="pt-6 md:pt-8 border-t border-gray-200">
                    <Button
                      onClick={handleLogoutClick}
                      variant="outline"
                      className="w-full h-11 md:h-12 flex items-center justify-center gap-2 md:gap-3 text-pink-600 md:text-red-600 border-pink-200 md:border-red-200 bg-pink-50/50 md:bg-transparent hover:bg-pink-50 md:hover:bg-red-50 hover:border-pink-300 md:hover:border-red-300 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                      <span className="text-base md:text-lg font-medium">{t('profile.logout')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && !selectedOrder && !showReviewForm && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t('orders.title')}</h2>
                    <p className="text-gray-600">{activeOrdersCount} {t('profile.itemsCount')}</p>
                  </div>
                </div>

                <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      orderFilter === "active" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t('orders.active')}
                  </button>
                  <button
                    onClick={() => setOrderFilter("archive")}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      orderFilter === "archive" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t('orders.archive')}
                  </button>
                </div>

                <div className="space-y-6">
                  {filteredOrders.map((order, index) => (
                    <div key={`${order.id}-${index}`} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <div className="flex items-center space-x-4 mb-3 md:mb-0">
                          <span className="text-lg font-semibold text-gray-900">{t('orders.orderNumber')}{order.orderNumber}</span>
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
                          <div className="text-sm text-gray-500 mb-2">{t('orders.delivery')} {order.deliveryDate}</div>
                          <div className="text-xl font-semibold text-gray-900">{order.totalLabel}</div>
                        </div>
                        <div className="flex space-x-3 mt-4 md:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              setSelectedOrder(order)
                              // Fetch order detail to get latest has_review status
                              try {
                                const orderDetail = await profileApi.getOrderDetail(order.id)
                                if (orderDetail.order?.has_review !== undefined) {
                                  setSelectedOrder({
                                    ...order,
                                    hasReview: orderDetail.order.has_review,
                                    canReview: order.status === "delivered" && !orderDetail.order.has_review
                                  })
                                }
                              } catch (error) {
                                console.error('Failed to fetch order detail:', error)
                                // Still set the order even if detail fetch fails
                                setSelectedOrder(order)
                              }
                            }}
                            className="px-6 py-2 border-gray-300 hover:border-gray-400"
                          >
                            {t('orders.details')}
                          </Button>
                          {order.canReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-6 py-2 text-brand border-brand hover:bg-brand hover:text-white transition-colors"
                              onClick={async () => {
                                setSelectedOrder(order)
                                // Fetch order detail to get products
                                try {
                                  const orderDetail = await profileApi.getOrderDetail(order.id)
                                  if (orderDetail.order?.items && orderDetail.order.items.length > 0) {
                                    // Get unique product IDs (total products in order)
                                    const uniqueProductIds = new Set<number>()
                                    orderDetail.order.items.forEach((item: any) => {
                                      if (item.product_id) {
                                        uniqueProductIds.add(item.product_id)
                                      }
                                    })
                                    
                                    // Filter out reviewed products
                                    const reviewedIds = order.reviewedProductIds || []
                                    const unreviewedProducts = Array.from(uniqueProductIds).filter(id => !reviewedIds.includes(id))
                                    
                                    if (unreviewedProducts.length === 0) {
                                      toast.error(t('orders.allReviewed'))
                                      return
                                    } else if (uniqueProductIds.size >= 2) {
                                      // 2+ products in order - always show product selection
                                      setOrderDetail(orderDetail)
                                      setShowProductSelection(true)
                                      setShowReviewForm(false)
                                    } else {
                                      // Single product in order - go directly to review
                                      setSelectedProductId(unreviewedProducts[0])
                                      setShowProductSelection(false)
                                      setShowReviewForm(true)
                                    }
                                  } else {
                                    toast.error(t('orders.noItems'))
                                    return
                                  }
                                } catch (error) {
                                  console.error('Failed to fetch order detail:', error)
                                  toast.error(t('profile.fetchDetailError'))
                                  return
                                }
                              }}
                            >
                              {t('orders.writeReview')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "orders" && selectedOrder && !showReviewForm && !showProductSelection && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedOrder(null)
                    setOrderDetail(null)
                  }} className="p-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">{t('orders.orderNumber')}{orderDetail?.order_number || selectedOrder.id}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${selectedOrder.statusBadgeClass}`}>
                    {statusMeta[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>

                {isLoadingOrderDetail ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                    <span className="ml-2 text-gray-600">{t('common.loading')}</span>
                  </div>
                ) : orderDetail ? (
                  <>
                    {/* Order Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Order Date & Timeline */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.orderDate')}</h3>
                          <p className="text-base text-gray-900">{formatDate(orderDetail.order_date) || orderDetail.order_date}</p>
                        </div>
                        
                        {/* Status Timeline */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.statusHistory')}</h3>
                          <div className="space-y-2">
                            {orderDetail.order_date && (
                              <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">{t('orders.status.pending')}: {formatDate(orderDetail.order_date) || orderDetail.order_date}</span>
                              </div>
                            )}
                            {orderDetail.confirmed_date && (
                              <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">{t('orders.status.confirmed')}: {formatDate(orderDetail.confirmed_date)}</span>
                              </div>
                            )}
                            {orderDetail.shipped_date && (
                              <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">{t('orders.status.shipped')}: {formatDate(orderDetail.shipped_date)}</span>
                              </div>
                            )}
                            {orderDetail.delivered_date && (
                              <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-brand rounded-full mr-2"></div>
                                <span className="text-gray-600">{t('orders.status.delivered')}: {formatDate(orderDetail.delivered_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery & Payment Info */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.deliveryAddress')}</h3>
                          <div className="text-base text-gray-900 space-y-1">
                            {orderDetail.delivery_address && (
                              <p className="font-medium">{orderDetail.delivery_address}</p>
                            )}
                            {/* Full Address Breakdown */}
                            {(orderDetail.delivery_city || orderDetail.delivery_state || orderDetail.delivery_postal_code || orderDetail.delivery_country) && (
                              <div className="text-sm text-gray-600 space-y-0.5">
                                {orderDetail.delivery_city && <p>{t('addresses.city')}: {orderDetail.delivery_city}</p>}
                                {orderDetail.delivery_state && <p>{t('addresses.state')}: {orderDetail.delivery_state}</p>}
                                {orderDetail.delivery_postal_code && <p>{t('addresses.postalCode')}: {orderDetail.delivery_postal_code}</p>}
                                {orderDetail.delivery_country && <p>{t('orders.country')}: {orderDetail.delivery_country}</p>}
                              </div>
                            )}
                            {!orderDetail.delivery_address && !orderDetail.delivery_city && (
                              <p className="text-gray-500">{t('orders.noAddress')}</p>
                            )}
                          </div>
                        </div>
                        
                        {orderDetail.customer_phone && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.contactPhone')}</h3>
                            <p className="text-base text-gray-900">{orderDetail.customer_phone}</p>
                          </div>
                        )}

                        {orderDetail.additional_phone && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.additionalPhone')}</h3>
                            <p className="text-base text-gray-900">{orderDetail.additional_phone}</p>
                          </div>
                        )}

                        {orderDetail.delivery_notes && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.deliveryNotes')}</h3>
                            <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {orderDetail.delivery_notes}
                            </p>
                          </div>
                        )}

                        {orderDetail.payment_method && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('orders.paymentMethod')}</h3>
                            <p className="text-base text-gray-900">
                              {orderDetail.payment_method === 'card' ? t('payments.card') : 
                               orderDetail.payment_method === 'cash_on_delivery' ? t('payments.cashOnDelivery') :
                               orderDetail.payment_method}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.items')}</h3>
                      <div className="space-y-4">
                        {(orderDetail.items || selectedOrder.items).map((item: any, index: number) => (
                          <div key={item.id || index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                            <img
                              src={getImageUrl(item.image_url || item.image) || "/images/product_placeholder_adobe.png"}
                              alt={item.product_name || item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{item.product_name || item.name}</h3>
                              {item.size && (
                                <p className="text-sm text-gray-500">{t('orders.size')}: {item.size}</p>
                              )}
                              {item.color && (
                                <p className="text-sm text-gray-500">{t('orders.color')}: {item.color}</p>
                              )}
                              {item.quantity && (
                                <p className="text-sm text-gray-500">{t('orders.quantity')}: {item.quantity}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {item.subtotal && (
                                <p className="text-base font-semibold text-gray-900">
                                  {(() => {
                                    const orderKey = orderDetail?.id || orderDetail?.order_number || selectedOrder?.id || 'default'
                                    const itemId = item.id || 0
                                    const formatted = formattedOrderPrices[orderKey]?.itemPrices[itemId]?.subtotal
                                    return formatted || (isCurrencyLoading ? `${item.subtotal} ${orderDetail?.currency || currency?.symbol || 'сом'}` : `${item.subtotal} ${orderDetail?.currency || currency?.symbol || 'сом'}`)
                                  })()}
                                </p>
                              )}
                              {item.price && item.quantity && (
                                <p className="text-sm text-gray-500">
                                  {(() => {
                                    const orderKey = orderDetail?.id || orderDetail?.order_number || selectedOrder?.id || 'default'
                                    const itemId = item.id || 0
                                    const formatted = formattedOrderPrices[orderKey]?.itemPrices[itemId]?.price
                                    return formatted || (isCurrencyLoading ? `${item.price} ${orderDetail?.currency || currency?.symbol || 'сом'}` : `${item.price} ${orderDetail?.currency || currency?.symbol || 'сом'}`)
                                  })()} × {item.quantity}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4 space-y-3">
                      {orderDetail.subtotal !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('cart.subtotal')}</span>
                          <span className="text-gray-900">
                            {(() => {
                              const orderKey = orderDetail?.id || orderDetail?.order_number || selectedOrder?.id || 'default'
                              const formatted = formattedOrderPrices[orderKey]?.subtotal
                              return formatted || (isCurrencyLoading ? `${orderDetail.subtotal} ${orderDetail.currency || currency?.symbol || 'сом'}` : `${orderDetail.subtotal} ${orderDetail.currency || currency?.symbol || 'сом'}`)
                            })()}
                          </span>
                        </div>
                      )}
                      {orderDetail.shipping_cost !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('cart.delivery')}</span>
                          <span className="text-gray-900">
                            {(() => {
                              const orderKey = orderDetail?.id || orderDetail?.order_number || selectedOrder?.id || 'default'
                              const formatted = formattedOrderPrices[orderKey]?.shipping
                              return formatted || (isCurrencyLoading ? `${orderDetail.shipping_cost} ${orderDetail.currency || currency?.symbol || 'сом'}` : `${orderDetail.shipping_cost} ${orderDetail.currency || currency?.symbol || 'сом'}`)
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-lg font-semibold text-gray-900">{t('cart.total')}</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {(() => {
                            const orderKey = orderDetail?.id || orderDetail?.order_number || selectedOrder?.id || 'default'
                            const formatted = formattedOrderPrices[orderKey]?.total
                            return formatted || (isCurrencyLoading ? `${orderDetail.total_amount || selectedOrder.totalLabel} ${orderDetail.currency || currency?.symbol || 'сом'}` : `${orderDetail.total_amount || selectedOrder.totalLabel} ${orderDetail.currency || currency?.symbol || 'сом'}`)
                          })()}
                        </span>
                      </div>
                      {selectedOrder.deliveryDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{t('orders.estimatedDelivery')}</span>
                          <span className="text-sm text-gray-500">{selectedOrder.deliveryDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Review Button */}
                    {selectedOrder.canReview && !selectedOrder.hasReview && (
                      <div className="mt-6">
                        <Button
                          className="w-full bg-brand hover:bg-brand-hover text-white"
                          onClick={async () => {
                            try {
                              if (orderDetail.items && orderDetail.items.length > 0) {
                                // Get unique product IDs (total products in order)
                                const uniqueProductIds = new Set<number>()
                                orderDetail.items.forEach((item: any) => {
                                  if (item.product_id) {
                                    uniqueProductIds.add(item.product_id)
                                  }
                                })
                                
                                // Filter out reviewed products
                                const reviewedIds = selectedOrder?.reviewedProductIds || []
                                const unreviewedProducts = Array.from(uniqueProductIds).filter(id => !reviewedIds.includes(id))
                                
                                if (unreviewedProducts.length === 0) {
                                  toast.error(t('orders.allReviewed'))
                                  return
                                } else if (uniqueProductIds.size >= 2) {
                                  // 2+ products in order - always show product selection
                                  setShowProductSelection(true)
                                  setShowReviewForm(false)
                                } else {
                                  // Single product in order - go directly to review
                                  setSelectedProductId(unreviewedProducts[0])
                                  setShowProductSelection(false)
                                  setShowReviewForm(true)
                                }
                              } else {
                                toast.error(t('orders.noItems'))
                                return
                              }
                            } catch (error) {
                              console.error('Failed to process review:', error)
                              toast.error(t('orders.reviewError'))
                              return
                            }
                          }}
                        >
                          {t('orders.writeReview')}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback to basic order info if detail not loaded */
                  <>
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
                            {item.size && <p className="text-sm text-gray-500">{t('orders.size')}: {item.size}</p>}
                            {item.color && <p className="text-sm text-gray-500">{t('orders.color')}: {item.color}</p>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">{t('cart.total')}: {selectedOrder.totalLabel}</span>
                        {selectedOrder.deliveryDate && (
                          <span className="text-sm text-gray-500">{t('orders.estimatedDelivery')}: {selectedOrder.deliveryDate}</span>
                        )}
                      </div>

                      {selectedOrder.canReview && !selectedOrder.hasReview && (
                        <Button
                          className="bg-brand hover:bg-brand-hover text-white"
                          onClick={async () => {
                            try {
                              const detail = await profileApi.getOrderDetail(selectedOrder.id)
                              if (detail.order?.items && detail.order.items.length > 0) {
                                // Get unique product IDs (total products in order)
                                const uniqueProductIds = new Set<number>()
                                detail.order.items.forEach((item: any) => {
                                  if (item.product_id) {
                                    uniqueProductIds.add(item.product_id)
                                  }
                                })
                                
                                // Filter out reviewed products
                                const reviewedIds = selectedOrder?.reviewedProductIds || []
                                const unreviewedProducts = Array.from(uniqueProductIds).filter(id => !reviewedIds.includes(id))
                                
                                if (unreviewedProducts.length === 0) {
                                  toast.error(t('orders.allReviewed'))
                                  return
                                } else if (uniqueProductIds.size >= 2) {
                                  // 2+ products in order - always show product selection
                                  setOrderDetail(detail)
                                  setShowProductSelection(true)
                                  setShowReviewForm(false)
                                } else {
                                  // Single product in order - go directly to review
                                  setSelectedProductId(unreviewedProducts[0])
                                  setShowProductSelection(false)
                                  setShowReviewForm(true)
                                }
                              } else {
                                toast.error(t('orders.noItems'))
                                return
                              }
                            } catch (error) {
                              console.error('Failed to fetch order detail:', error)
                              toast.error(t('orders.reviewError'))
                              return
                            }
                          }}
                        >
                          {t('orders.writeReview')}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Product Selection View */}
            {activeTab === "orders" && showProductSelection && selectedOrder && orderDetail && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setShowProductSelection(false)
                    setSelectedProductId(null)
                  }} className="p-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">{t('orders.orderNumber')}{selectedOrder.orderNumber}</h2>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">{t('orders.selectProductToReview')}</p>
                  
                  {/* Get unique unreviewed products */}
                  {(() => {
                    const uniqueProducts = new Map<number, any>()
                    const reviewedIds = selectedOrder.reviewedProductIds || []
                    
                    orderDetail.order?.items?.forEach((item: any) => {
                      if (item.product_id && !reviewedIds.includes(item.product_id) && !uniqueProducts.has(item.product_id)) {
                        uniqueProducts.set(item.product_id, item)
                      }
                    })
                    
                    const unreviewedProducts = Array.from(uniqueProducts.values())
                    
                    if (unreviewedProducts.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-gray-500">{t('orders.allProductsReviewed')}</p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                              setShowProductSelection(false)
                              setSelectedOrder(null)
                              setOrderDetail(null)
                            }}
                          >
                            {t('common.back')}
                          </Button>
                        </div>
                      )
                    }
                    
                    return (
                      <div className="space-y-3">
                        {unreviewedProducts.map((item: any) => (
                          <button
                            key={item.product_id}
                            onClick={() => {
                              setSelectedProductId(item.product_id)
                              setShowProductSelection(false)
                              setShowReviewForm(true)
                            }}
                            className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-brand hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={getImageUrl(item.image_url) || "/images/product_placeholder_adobe.png"}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.product_name}</p>
                              {item.size && (
                                <p className="text-sm text-gray-500">{t('orders.size')}: {item.size}</p>
                              )}
                              {item.color && (
                                <p className="text-sm text-gray-500">{t('orders.color')}: {item.color}</p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {activeTab === "orders" && showReviewForm && selectedOrder && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => {
                    // Check if there are more products to review
                    if (orderDetail?.order?.items && selectedOrder) {
                      const uniqueProductIds = new Set<number>()
                      orderDetail.order.items.forEach((item: any) => {
                        if (item.product_id) {
                          uniqueProductIds.add(item.product_id)
                        }
                      })
                      const reviewedIds = selectedOrder.reviewedProductIds || []
                      const unreviewedProducts = Array.from(uniqueProductIds).filter(id => !reviewedIds.includes(id))
                      
                      if (unreviewedProducts.length > 1 || (unreviewedProducts.length === 1 && unreviewedProducts[0] !== selectedProductId)) {
                        // More products to review - go back to product selection
                        setShowReviewForm(false)
                        setShowProductSelection(true)
                        setSelectedProductId(null)
                      } else {
                        // No more products - go back to order detail
                        setShowReviewForm(false)
                        setShowProductSelection(false)
                        setSelectedProductId(null)
                      }
                    } else {
                      setShowReviewForm(false)
                      setShowProductSelection(false)
                      setSelectedProductId(null)
                    }
                  }} className="p-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">{t('orders.orderNumber')}{selectedOrder.orderNumber}</h2>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product.reviewRatingPrompt')}
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
                    {t('product.reviewTextPrompt')}
                  </label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t('product.reviewTextPlaceholder')}
                    className="w-full h-24"
                  />
                </div>

                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('product.reviewPhotoPrompt')}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">{t('product.reviewPhotoUploadText')}</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer text-brand hover:text-purple-700">
                        {t('product.reviewSelectFiles')}
                      </label>
                      {reviewPhotos.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          {t('product.reviewPhotosUploaded', { count: reviewPhotos.length })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Uploaded Photos */}
                  {reviewPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                      {reviewPhotos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={getImageUrl(photo.url) || "/images/product_placeholder_adobe.png"}
                            alt={t('product.reviewPhotoAlt')}
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
                  disabled={reviewRating === 0 || isSubmittingReview || !selectedProductId}
                >
                  {isSubmittingReview ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('common.sending')}
                    </span>
                  ) : (
                    t('product.submitReview')
                  )}
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
                  <p className="text-sm text-gray-500 mt-2">{t('orders.delivery')} {selectedOrder.deliveryDate}</p>
                  <p className="text-sm text-brand cursor-pointer hover:underline">{t('orders.writeReview')}</p>
                </div>
              </div>
            )}

            {activeTab === "addresses" && !showAddressForm && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t('addresses.title')}</h2>
                  <p className="text-gray-600">{backendAddresses.length} {t('addresses.count', { count: backendAddresses.length })}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {backendAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">{address.title || t('addresses.defaultTitle')}</p>
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
                  {t('addresses.addAddress')}
                </Button>
              </div>
            )}

            {activeTab === "addresses" && showAddressForm && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6">
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
                    {editingAddress ? t('addresses.editAddress') : t('addresses.addAddress')}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.addressName')}</label>
                    <Input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder={t('addresses.addressNamePlaceholder')}
                      className="w-full"
                    />
                  </div>

                  {isUSLocation ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.streetAddress')} *</label>
                        <Input
                          type="text"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          placeholder={t('addresses.streetAddressPlaceholder')}
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.fullAddress')} ({t('common.optional')})</label>
                        <Input
                          type="text"
                          value={newAddress.fullAddress}
                          onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                          placeholder={t('addresses.fullAddressPlaceholder')}
                          className="w-full"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* KG User Address Form - Matching mobile design */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.city')} *</label>
                        <Input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder={t('addresses.cityPlaceholder')}
                          className="w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.street')} *</label>
                        <Input
                          type="text"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          placeholder={t('addresses.streetPlaceholder')}
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.building')} *</label>
                          <Input
                            type="text"
                            value={newAddress.building}
                            onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                            placeholder={t('addresses.buildingPlaceholder')}
                            className="w-full"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.apartment')}</label>
                          <Input
                            type="text"
                            value={newAddress.apartment}
                            onChange={(e) => setNewAddress({ ...newAddress, apartment: e.target.value })}
                            placeholder={t('addresses.apartmentPlaceholder')}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.entrance')}</label>
                          <Input
                            type="text"
                            value={newAddress.entrance}
                            onChange={(e) => setNewAddress({ ...newAddress, entrance: e.target.value })}
                            placeholder={t('addresses.entrancePlaceholder')}
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.floor')}</label>
                          <Input
                            type="text"
                            value={newAddress.floor}
                            onChange={(e) => setNewAddress({ ...newAddress, floor: e.target.value })}
                            placeholder={t('addresses.floorPlaceholder')}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {isUSLocation && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.city')} *</label>
                        <Input
                          type="text"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          placeholder={t('addresses.cityPlaceholderUS')}
                          className="w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.state')} *</label>
                        <Input
                          type="text"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          placeholder={t('addresses.statePlaceholder')}
                          className="w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('addresses.postalCode')} *</label>
                        <Input
                          type="text"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          placeholder={t('addresses.postalCodePlaceholder')}
                          className="w-full"
                          required
                        />
                      </div>
                    </>
                  )}


                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white"
                      disabled={
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
                      {editingAddress ? t('common.saveChanges') : t('addresses.addAddress')}
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
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && !showPaymentForm && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t('payments.title')}</h2>
                  <p className="text-gray-600">{backendPaymentMethods.length} {t('payments.count', { count: backendPaymentMethods.length })}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {backendPaymentMethods.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">
                          {payment.payment_type === "card" ? t('payments.card') : payment.payment_type}
                        </p>
                        <p className="text-gray-600">
                          {payment.card_type ? payment.card_type.toUpperCase() : t('payments.card')}{" "}
                          {payment.card_number_masked || ""}
                        </p>
                        {payment.is_default && (
                          <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                            {t('payments.defaultMethod')}
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
                  {t('payments.addPayment')}
                </Button>
              </div>
            )}

            {activeTab === "payments" && showPaymentForm && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPaymentForm(false)
                      setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
                    }}
                    className="p-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-black">
                    {t('payments.addPayment')}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.cardNumber')} *</label>
                    <Input
                      type="text"
                      value={newPayment.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 16)
                        const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ")
                        setNewPayment({ ...newPayment, cardNumber: formatted })
                      }}
                      placeholder={t('payments.cardNumberPlaceholder')}
                      className="w-full"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.expiryDate')} *</label>
                      <Input
                        type="text"
                        value={newPayment.expiryDate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                          const formatted = value.replace(/(\d{2})(?=\d)/, "$1/")
                          setNewPayment({ ...newPayment, expiryDate: formatted })
                        }}
                        placeholder={t('payments.expiryDatePlaceholder')}
                        className="w-full"
                        maxLength={5}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.cvv')} *</label>
                      <Input
                        type="text"
                        value={newPayment.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 3)
                          setNewPayment({ ...newPayment, cvv: value })
                        }}
                        placeholder={t('payments.cvvPlaceholder')}
                        className="w-full"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('payments.cardholderName')}</label>
                    <Input
                      type="text"
                      value={newPayment.cardholderName}
                      onChange={(e) => setNewPayment({ ...newPayment, cardholderName: e.target.value })}
                      placeholder={t('payments.cardholderNamePlaceholder')}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={handleAddPayment}
                      className="flex-1 bg-brand hover:bg-brand-hover text-white"
                      disabled={
                        !newPayment.cardNumber.trim() || !newPayment.expiryDate.trim() || !newPayment.cvv.trim()
                      }
                    >
                      {t('payments.addCard')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPaymentForm(false)
                        setNewPayment({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" })
                      }}
                      className="flex-1"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white md:bg-white rounded-lg p-4 md:p-6 lg:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t('settings.title')}</h2>
                  <p className="text-gray-600">{t('settings.subtitle')}</p>
                </div>

                <div className="space-y-6">
                  {/* Language Selection */}
                  <div>
                    <h3 className="text-lg font-medium text-black mb-4 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-brand" />
                      {t('settings.language')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          setLanguage('ru')
                          toast.success(t('languages.changedTo', { language: t('languages.russian') }))
                        }}
                        className={`flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-lg transition-colors ${
                          language === 'ru'
                            ? 'border-brand bg-brand/5 hover:bg-brand/10'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">🇷🇺</span>
                        <span className="font-medium text-gray-900">{t('languages.russian')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('ky')
                          toast.success(t('languages.changedTo', { language: t('languages.kyrgyz') }))
                        }}
                        className={`flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-lg transition-colors ${
                          language === 'ky'
                            ? 'border-brand bg-brand/5 hover:bg-brand/10'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">🇰🇬</span>
                        <span className="font-medium text-gray-900">{t('languages.kyrgyz')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('en')
                          toast.success(t('languages.changedTo', { language: t('languages.english') }))
                        }}
                        className={`flex items-center justify-center gap-3 px-6 py-4 border-2 rounded-lg transition-colors ${
                          language === 'en'
                            ? 'border-brand bg-brand/5 hover:bg-brand/10'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">🇬🇧</span>
                        <span className="font-medium text-gray-900">{t('languages.english')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-black mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-brand" />
                      {t('settings.notifications')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-black">{t('settings.orderUpdates')}</p>
                          <p className="text-xs text-gray-500">{t('settings.orderUpdatesDesc')}</p>
                        </div>
                        <button
                          onClick={() =>
                            setNotificationSettings((prev) => ({ ...prev, orderUpdates: !prev.orderUpdates }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationSettings.orderUpdates ? "bg-brand" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings.orderUpdates ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-black">{t('settings.salesPromotions')}</p>
                          <p className="text-xs text-gray-500">{t('settings.salesPromotionsDesc')}</p>
                        </div>
                        <button
                          onClick={() =>
                            setNotificationSettings((prev) => ({ ...prev, salesPromotions: !prev.salesPromotions }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationSettings.salesPromotions ? "bg-brand" : "bg-gray-200"
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
                  <h4 className="font-semibold text-gray-300 mb-4">{t('footer.popularCategories')}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="hover:text-white cursor-pointer transition-colors">{t('footer.men')}</div>
                    <div className="hover:text-white cursor-pointer transition-colors">{t('footer.women')}</div>
                    <div className="hover:text-white cursor-pointer transition-colors">{t('footer.kids')}</div>
                    <div className="hover:text-white cursor-pointer transition-colors">{t('footer.sport')}</div>
                    <div className="hover:text-white cursor-pointer transition-colors">{t('footer.shoes')}</div>
                    <div className="hover:text-white cursor-pointer transition-colors">{t('footer.accessories')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-4">{t('footer.brands')}</h4>
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
            <div className="hover:text-white cursor-pointer transition-colors">{t('footer.privacyPolicy')}</div>
            <div className="hover:text-white cursor-pointer transition-colors">{t('footer.termsOfUse')}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
