"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, ArrowLeft, Package, TrendingUp, ShoppingBag, Calendar, Settings, Moon, Sun, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getImageUrl } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { MarketIndicator, MarketIndicatorCompact, type Market } from "@/components/admin/MarketIndicator"
import { storeManagerApi, ApiError } from "@/lib/api"
import { toast } from "@/lib/toast"
// Map backend status to frontend display status
const mapBackendStatusToFrontend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'В ожидании',
    'confirmed': 'ОФОРМЛЕН',
    'processing': 'В ПУТИ',
    'shipped': 'В ПУТИ',
    'delivered': 'ДОСТАВЛЕН',
    'cancelled': 'ОТМЕНЕН',
    'refunded': 'ОТМЕНЕН',
  }
  return statusMap[status] || status
}

// Map frontend display status to backend status
const mapFrontendStatusToBackend = (status: string): string => {
  const statusMap: Record<string, string> = {
    'В ожидании': 'pending',
    'pending': 'pending',
    'ОФОРМЛЕН': 'confirmed',
    'confirmed': 'confirmed',
    'В ПУТИ': 'processing',
    'processing': 'processing',
    'shipped': 'shipped',
    'ДОСТАВЛЕН': 'delivered',
    'delivered': 'delivered',
    'ОТМЕНЕН': 'cancelled',
    'cancelled': 'cancelled',
  }
  return statusMap[status] || status.toLowerCase()
}

// Map backend status to frontend display status for status update modal
const mapBackendStatusForModal = (status: string): string => {
  // For status update modal, we want to show frontend display names
  if (status === 'pending' || status === 'В ожидании') return 'В ожидании'
  if (status === 'confirmed' || status === 'ОФОРМЛЕН') return 'ОФОРМЛЕН'
  if (status === 'processing' || status === 'shipped' || status === 'В ПУТИ') return 'В ПУТИ'
  if (status === 'delivered' || status === 'ДОСТАВЛЕН') return 'ДОСТАВЛЕН'
  if (status === 'cancelled' || status === 'ОТМЕНЕН') return 'ОТМЕНЕН'
  return 'В ожидании'
}

export default function AdminDashboard() {
  const auth = useAuth()
  const router = useRouter()
  
  // Manager status
  const [managerStatus, setManagerStatus] = useState<{
    is_manager: boolean
    manager_id: number | null
    role: string | null
    accessible_markets: string[]
    can_manage_kg: boolean
    can_manage_us: boolean
    is_active: boolean
  } | null>(null)
  const [isCheckingManagerStatus, setIsCheckingManagerStatus] = useState(false)
  const [managerStatusError, setManagerStatusError] = useState<string | null>(null)
  
  // Market management
  const [currentMarket, setCurrentMarket] = useState<Market>("kg")
  const marketUpper = currentMarket.toUpperCase() as "KG" | "US"
  
  // Loading states
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false)
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [isResumingOrder, setIsResumingOrder] = useState(false)
  
  // Error states
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [revenueError, setRevenueError] = useState<string | null>(null)
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<{
    today_orders_count: number
    all_orders_count: number
    active_orders_count: number
  } | null>(null)
  
  const [orders, setOrders] = useState<Array<{
    id: number
    order_number: string
    status: string
    status_display: string
    status_color: string
    customer_name: string
    customer_phone: string
    delivery_address: string
    delivery_city: string | null
    total_amount: number
    currency: string
    amount: string
    order_date: string
    date: string
    order_date_formatted: string
    items_count: number
    items: Array<{
      id: number
      product_name: string
      product_brand: string
      size: string
      color: string
      price: number
      quantity: number
      subtotal: number
      image_url: string | null
    }>
  }>>([])
  
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [ordersHasMore, setOrdersHasMore] = useState(false)
  const [ordersOffset, setOrdersOffset] = useState(0)
  const ordersOffsetRef = useRef(0)
  const ordersLimit = 20
  
  // Refs to prevent infinite loops
  const hasRedirectedRef = useRef(false)
  const isCheckingManagerRef = useRef(false)
  const hasCheckedOnMountRef = useRef(false)
  const managerStatusSetRef = useRef(false)
  
  const [revenueData, setRevenueData] = useState<{
    total_revenue: string
    revenue_change: string
    total_orders: number
    orders_change: string
    average_order: string
    average_change: string
    currency: string
    currency_code: string
    hourly_revenue: Array<{
      time: string
      amount: string
      is_highlighted?: boolean
    }>
    recent_orders: Array<{
      id: string
      order_number: string
      status: string
      status_color: string
      phone: string
      address: string
      amount: string
      created_at: string
      time: string
      date: string
    }>
  } | null>(null)
  
  // View and filter states
  const [currentView, setCurrentView] = useState<
    "dashboard" | "orders" | "order-detail" | "all-orders" | "revenue" | "settings"
  >("dashboard")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderFilter, setOrderFilter] = useState("Все")
  const [searchQuery, setSearchQuery] = useState("")
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("")
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isResumeConfirmOpen, setIsResumeConfirmOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("Русский")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    newOrders: true,
    statusChanges: true,
    dailyReport: true,
    deliveryErrors: false,
  })

  // Real-time updates (polling)
  const [enablePolling, setEnablePolling] = useState(true)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const POLLING_INTERVAL = 30000 // 30 seconds
  
  // Initialize market from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMarket = localStorage.getItem("admin_market") as Market | null
      if (savedMarket && (savedMarket === "kg" || savedMarket === "us")) {
        setCurrentMarket(savedMarket)
      } else {
        localStorage.setItem("admin_market", "kg")
      }
    }
  }, [])
  
  // Sync ref with state when ordersOffset changes
  useEffect(() => {
    ordersOffsetRef.current = ordersOffset
  }, [ordersOffset])
  
  // Track last checked auth state to prevent redundant checks
  const lastCheckedAuthStateRef = useRef<{ isLoading: boolean; isLoggedIn: boolean } | null>(null)
  const authStateRef = useRef({ isLoading: auth.isLoading, isLoggedIn: auth.isLoggedIn })
  const hasCheckedOnceRef = useRef(false)
  
  // Update auth state ref whenever it changes
  useEffect(() => {
    authStateRef.current = { isLoading: auth.isLoading, isLoggedIn: auth.isLoggedIn }
  }, [auth.isLoading, auth.isLoggedIn])
  
  // Check manager status - use refs to avoid dependency issues
  const checkManagerStatus = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingManagerRef.current) {
      console.log('⚠️ checkManagerStatus: Already checking, skipping...')
      return
    }
    
    // Read current auth state from ref
    const { isLoggedIn, isLoading } = authStateRef.current
    
    if (!isLoggedIn || isLoading) {
      console.log('⚠️ checkManagerStatus: User not logged in or still loading, skipping...', { isLoggedIn, isLoading })
      setIsCheckingManagerStatus(false)
      setManagerStatus(null)
      hasCheckedOnceRef.current = false
      return
    }
    
    console.log('✅ checkManagerStatus: Starting manager status check...')
    isCheckingManagerRef.current = true
    setIsCheckingManagerStatus(true)
    setManagerStatusError(null)
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isCheckingManagerRef.current) {
        console.error('❌ checkManagerStatus: Timeout after 10 seconds')
        setIsCheckingManagerStatus(false)
        isCheckingManagerRef.current = false
        setManagerStatusError('Таймаут проверки статуса. Попробуйте обновить страницу.')
        hasCheckedOnceRef.current = false
      }
    }, 10000) // 10 second timeout
    
    try {
      console.log('📡 checkManagerStatus: Calling API...')
      const data = await storeManagerApi.checkManagerStatus()
      clearTimeout(timeoutId)
      console.log('✅ checkManagerStatus: API response received', data)
      
      // Use startTransition or setTimeout to batch state updates and avoid React error #300
      // This ensures state updates happen after the current render cycle
      Promise.resolve().then(() => {
        setManagerStatus(data)
        managerStatusSetRef.current = true
        
        if (!data.is_manager) {
          setManagerStatusError('Вы не являетесь менеджером магазина')
        } else if (!data.is_active) {
          setManagerStatusError('Ваш аккаунт менеджера неактивен')
        }
      })
      
      // Only mark as checked after successful completion
      hasCheckedOnceRef.current = true
    } catch (error) {
      clearTimeout(timeoutId)
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка проверки статуса менеджера'
      setManagerStatusError(errorMessage)
      console.error('❌ checkManagerStatus: Error occurred', error)
      // If error is "Authentication required", user is not logged in
      if (error instanceof ApiError && error.message.includes('Authentication')) {
        setManagerStatus(null)
      }
      // Don't mark as checked if there was an error - allow retry
      hasCheckedOnceRef.current = false
    } finally {
      console.log('🏁 checkManagerStatus: Finished, clearing flags')
      setIsCheckingManagerStatus(false)
      isCheckingManagerRef.current = false
    }
  }, []) // No dependencies - reads from ref
  
  // Check manager status on mount and when auth changes - ONLY ONCE per auth state change
  useEffect(() => {
    console.log('🔄 useEffect: Manager status check effect running', {
      isCheckingManagerRef: isCheckingManagerRef.current,
      isCheckingManagerStatus,
      authIsLoading: auth.isLoading,
      authIsLoggedIn: auth.isLoggedIn,
      hasCheckedOnce: hasCheckedOnceRef.current
    })
    
    // Skip if already checking or if checking status
    if (isCheckingManagerRef.current || isCheckingManagerStatus) {
      console.log('⏭️ useEffect: Skipping - already checking')
      return
    }
    
    const currentAuthState = { isLoading: auth.isLoading, isLoggedIn: auth.isLoggedIn }
    const lastState = lastCheckedAuthStateRef.current
    
    // Check if auth state has actually changed (deep comparison)
    const authStateChanged = !lastState || 
      lastState.isLoading !== currentAuthState.isLoading || 
      lastState.isLoggedIn !== currentAuthState.isLoggedIn
    
    console.log('🔍 useEffect: Auth state check', {
      authStateChanged,
      lastState,
      currentAuthState
    })
    
    // If auth state hasn't changed, do nothing
    if (!authStateChanged) {
      console.log('⏭️ useEffect: Skipping - auth state unchanged')
      return
    }
    
    // Update the last checked state
    lastCheckedAuthStateRef.current = currentAuthState
    
    // Handle logout case
    if (!auth.isLoading && !auth.isLoggedIn) {
      console.log('👋 useEffect: User logged out, resetting state')
      setManagerStatus(null)
      hasCheckedOnceRef.current = false
      return
    }
    
    // Handle login case - only check if auth is loaded and user is logged in and we haven't checked yet
    if (!auth.isLoading && auth.isLoggedIn && !hasCheckedOnceRef.current) {
      console.log('✅ useEffect: Conditions met, calling checkManagerStatus')
      checkManagerStatus()
    } else {
      console.log('⏭️ useEffect: Conditions not met', {
        isLoading: auth.isLoading,
        isLoggedIn: auth.isLoggedIn,
        hasCheckedOnce: hasCheckedOnceRef.current
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoading, auth.isLoggedIn]) // isCheckingManagerStatus and checkManagerStatus intentionally omitted
  
  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    if (!auth.isLoggedIn || !managerStatus?.is_manager) return
    
    setIsLoadingDashboard(true)
    setDashboardError(null)
    try {
      const data = await storeManagerApi.getDashboardStats(marketUpper)
      setDashboardStats({
        today_orders_count: data.today_orders_count,
        all_orders_count: data.all_orders_count,
        active_orders_count: data.active_orders_count,
      })
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка загрузки статистики'
      setDashboardError(errorMessage)
      toast.error(errorMessage)
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoadingDashboard(false)
    }
  }, [auth.isLoggedIn, marketUpper, managerStatus])
  
  // Fetch orders
  const fetchOrders = useCallback(async (reset = false, statusOverride?: string) => {
    if (!auth.isLoggedIn || !managerStatus?.is_manager) return
    
    setIsLoadingOrders(true)
    setOrdersError(null)
    try {
      // Use reset to determine offset - if reset, use 0, otherwise use ref value
      const currentOffset = reset ? 0 : ordersOffsetRef.current
      
      // Determine status filter
      let statusFilter = orderFilter
      if (statusOverride) {
        statusFilter = statusOverride
      } else if (currentView === "orders") {
        // For "today's orders" view, show active orders (pending, confirmed, processing, shipped)
        // Backend maps "Ожидание" to pending/confirmed and "В пути" to processing/shipped
        // So we'll fetch all and filter on frontend, or use "Все" and filter client-side
        statusFilter = orderFilter === "Все" ? "Все" : orderFilter
      }
      
      const data = await storeManagerApi.getOrders({
        market: marketUpper,
        status: statusFilter === "Все" ? undefined : statusFilter,
        search: searchQuery || undefined,
        limit: ordersLimit,
        offset: currentOffset,
      })
      
      if (reset) {
        setOrders(data.orders)
        setOrdersOffset(data.orders.length)
        ordersOffsetRef.current = data.orders.length
      } else {
        setOrders(prev => [...prev, ...data.orders])
        setOrdersOffset(prev => {
          const newOffset = prev + data.orders.length
          ordersOffsetRef.current = newOffset
          return newOffset
        })
      }
      setOrdersTotal(data.total)
      setOrdersHasMore(data.has_more)
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка загрузки заказов'
      setOrdersError(errorMessage)
      toast.error(errorMessage)
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [auth.isLoggedIn, marketUpper, orderFilter, searchQuery, ordersLimit, currentView, managerStatus])
  
  // Fetch order detail
  const fetchOrderDetail = useCallback(async (orderId: number) => {
    if (!auth.isLoggedIn || !managerStatus?.is_manager) return
    
    setIsLoadingOrderDetail(true)
    try {
      const data = await storeManagerApi.getOrderDetail(orderId, marketUpper)
      setSelectedOrder(data.order)
      // Set initial status for modal (use backend status value for API call)
      setSelectedOrderStatus(data.order.status || 'pending')
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка загрузки заказа'
      toast.error(errorMessage)
      console.error('Error fetching order detail:', error)
    } finally {
      setIsLoadingOrderDetail(false)
    }
  }, [auth.isLoggedIn, marketUpper, managerStatus])
  
  // Fetch revenue analytics
  const fetchRevenueAnalytics = useCallback(async () => {
    if (!auth.isLoggedIn || !managerStatus?.is_manager) return
    
    setIsLoadingRevenue(true)
    setRevenueError(null)
    try {
      const data = await storeManagerApi.getRevenueAnalytics(marketUpper)
      setRevenueData(data)
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка загрузки аналитики'
      setRevenueError(errorMessage)
      toast.error(errorMessage)
      console.error('Error fetching revenue analytics:', error)
    } finally {
      setIsLoadingRevenue(false)
    }
  }, [auth.isLoggedIn, marketUpper, managerStatus])
  
  // Load data when view changes or manager status becomes available
  useEffect(() => {
    // Skip if checking manager status or manager status not available
    if (isCheckingManagerStatus || !managerStatus?.is_manager || !auth.isLoggedIn) {
      return
    }
    
    // Use Promise.resolve().then() to defer to next microtask
    // This ensures the effect runs after state updates are batched
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      
      if (currentView === "dashboard") {
        fetchDashboardStats()
      } else if (currentView === "orders") {
        // For "today's orders", fetch active orders only
        fetchOrders(true)
      } else if (currentView === "all-orders") {
        // For "all orders", fetch all orders
        fetchOrders(true)
      } else if (currentView === "revenue") {
        fetchRevenueAnalytics()
      }
    })
    
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, auth.isLoggedIn, managerStatus?.is_manager])
  
  // Reload data when market changes
  useEffect(() => {
    if (!auth.isLoggedIn || currentView === "settings" || currentView === "order-detail") return
    
    if (currentView === "dashboard") {
      fetchDashboardStats()
    } else if (currentView === "orders" || currentView === "all-orders") {
      fetchOrders(true)
    } else if (currentView === "revenue") {
      fetchRevenueAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketUpper])
  
  // Reload orders when filter or search changes (with debounce for search)
  useEffect(() => {
    if ((currentView === "orders" || currentView === "all-orders") && auth.isLoggedIn) {
      const timeoutId = setTimeout(() => {
        fetchOrders(true)
      }, searchQuery ? 500 : 0) // Debounce search by 500ms
      
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderFilter, searchQuery])
  
  // Setup polling for real-time updates
  useEffect(() => {
    if (!enablePolling || !auth.isLoggedIn) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }
    
    // Don't poll if we're on settings or order detail view
    if (currentView === "settings" || currentView === "order-detail") {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }
    
    const poll = () => {
      if (currentView === "dashboard") {
        fetchDashboardStats()
      } else if (currentView === "orders" || currentView === "all-orders") {
        // Only refresh, don't append
        fetchOrders(true)
      } else if (currentView === "revenue") {
        fetchRevenueAnalytics()
      }
    }
    
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL)
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enablePolling, auth.isLoggedIn, currentView])
  
  // Handle market change
  const handleMarketChange = (newMarket: Market) => {
    setCurrentMarket(newMarket)
    localStorage.setItem("admin_market", newMarket)
    console.log(`📊 Admin market switched to: ${newMarket.toUpperCase()}`)
    // Data will reload automatically via useEffect
  }
  
  // Handle order click
  const handleOrderClick = async (order: any) => {
    setCurrentView("order-detail")
    await fetchOrderDetail(order.id)
  }
  
  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedOrder || !selectedOrderStatus) return
    
    setIsUpdatingStatus(true)
    try {
      // selectedOrderStatus is already a backend status value (pending, confirmed, etc.)
      await storeManagerApi.updateOrderStatus(selectedOrder.id, selectedOrderStatus)
      toast.success('Статус заказа обновлен')
    setIsStatusModalOpen(false)
      // Reload order detail
      await fetchOrderDetail(selectedOrder.id)
      // Reload orders list if we're on that view
      if (currentView === "orders" || currentView === "all-orders") {
        await fetchOrders(true)
      }
      // Reload dashboard stats if we're on dashboard
      if (currentView === "dashboard") {
        await fetchDashboardStats()
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка обновления статуса'
      toast.error(errorMessage)
      console.error('Error updating order status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }
  
  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    
    setIsCancellingOrder(true)
    try {
      await storeManagerApi.cancelOrder(selectedOrder.id)
      toast.success('Заказ отменен')
    setIsCancelConfirmOpen(false)
      // Reload order detail
      await fetchOrderDetail(selectedOrder.id)
      // Reload orders list if we're on that view
      if (currentView === "orders" || currentView === "all-orders") {
        await fetchOrders(true)
      }
      // Reload dashboard stats if we're on dashboard
      if (currentView === "dashboard") {
        await fetchDashboardStats()
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка отмены заказа'
      toast.error(errorMessage)
      console.error('Error cancelling order:', error)
    } finally {
      setIsCancellingOrder(false)
    }
  }
  
  // Handle resume order
  const handleResumeOrder = async () => {
    if (!selectedOrder) return
    
    setIsResumingOrder(true)
    try {
      await storeManagerApi.resumeOrder(selectedOrder.id)
      toast.success('Заказ возобновлен')
    setIsResumeConfirmOpen(false)
      // Reload order detail
      await fetchOrderDetail(selectedOrder.id)
      // Reload orders list if we're on that view
      if (currentView === "orders" || currentView === "all-orders") {
        await fetchOrders(true)
      }
      // Reload dashboard stats if we're on dashboard
      if (currentView === "dashboard") {
        await fetchDashboardStats()
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Ошибка возобновления заказа'
      toast.error(errorMessage)
      console.error('Error resuming order:', error)
    } finally {
      setIsResumingOrder(false)
    }
  }
  
  // Handle date range apply
  const handleDateRangeApply = () => {
    console.log(`Filtering orders from ${dateFrom} to ${dateTo}`)
    setIsDateRangeOpen(false)
    // TODO: Implement date range filtering in backend
    toast.info('Фильтрация по датам будет доступна в следующей версии')
  }
  
  // Handle logout
  const handleLogout = () => {
    auth.handleLogout()
    setIsLogoutConfirmOpen(false)
    router.push('/')
  }

  // Handle notification toggle
  const handleNotificationToggle = (setting: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))
    // TODO: Save notification settings to backend
    toast.info('Настройки уведомлений будут сохранены в следующей версии')
  }
  
  // Filter orders locally
  // Note: Backend handles status filtering, but for "today's orders" view we filter active orders client-side
  const filteredOrders = orders.filter((order) => {
    // For "today's orders" view, only show active orders (pending, confirmed, processing, shipped)
    if (currentView === "orders") {
      const isActive = order.status === "pending" || 
                       order.status === "confirmed" || 
                       order.status === "processing" || 
                       order.status === "shipped"
      if (!isActive) return false
    }
    
    // Apply search filter (backend also searches, but we do client-side filtering for immediate feedback)
    const matchesSearch =
      !searchQuery ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })
  
  // Show loading state while checking manager status
  if (isCheckingManagerStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Проверка статуса менеджера...</p>
        </div>
      </div>
    )
  }
  
  // Redirect to login page if not logged in (only once)
  useEffect(() => {
    if (!auth.isLoading && !auth.isLoggedIn && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      router.push('/admin/login')
    }
    // Reset redirect flag if user logs in
    if (auth.isLoggedIn) {
      hasRedirectedRef.current = false
    }
  }, [auth.isLoading, auth.isLoggedIn]) // Removed router from deps to prevent loop
  
  // Show loading state while redirecting
  if (!auth.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Перенаправление на страницу входа...</p>
        </div>
      </div>
    )
  }
  
  // Show error if not a manager
  if (!managerStatus?.is_manager || managerStatusError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
            <p className="text-gray-600 mb-6">
              {managerStatusError || 'Вы не являетесь менеджером магазина. Обратитесь к администратору для получения доступа.'}
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={async () => {
                  await auth.handleLogout()
                  router.push('/admin/login')
                }}
              >
                Выйти и войти с другим аккаунтом
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
                onClick={() => router.push('/')}
              >
                Перейти на главную страницу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Dashboard View
  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Добро пожаловать,</h1>
              <p className="text-2xl font-bold text-black">Администратор</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView("settings")}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Market Indicator */}
          <div className="mt-3">
            <MarketIndicator
              currentMarket={currentMarket}
              onMarketChange={handleMarketChange}
              showSwitcher={true}
            />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {isLoadingDashboard ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : dashboardError ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p>{dashboardError}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView("orders")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Сегодняшние заказы</h3>
                    <p className="text-sm text-gray-500">Список заказов на последние 24 часа</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {dashboardStats?.active_orders_count || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setCurrentView("all-orders")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Управление заказами</h3>
                    <p className="text-sm text-gray-500">Список всех заказов за все время</p>
                  </div>
                </div>
                <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{dashboardStats?.all_orders_count || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView("revenue")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Доходы</h3>
                    <p className="text-sm text-gray-500">Информация о доходах за все время</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </div>
    )
  }

  // Revenue View
  if (currentView === "revenue") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Доходы</h1>
              </div>
            </div>
            <MarketIndicatorCompact currentMarket={currentMarket} />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {isLoadingRevenue ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : revenueError ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p>{revenueError}</p>
                </div>
              </CardContent>
            </Card>
          ) : revenueData ? (
            <>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                        <h3 className="text-2xl font-bold text-gray-900">{revenueData.total_revenue}</h3>
                        <p className={`text-sm ${revenueData.revenue_change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {revenueData.revenue_change}
                        </p>
                    <p className="text-sm text-gray-500">Доход за сегодня</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                        <h3 className="text-2xl font-bold text-gray-900">{revenueData.total_orders}</h3>
                        <p className={`text-sm ${revenueData.orders_change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {revenueData.orders_change}
                        </p>
                    <p className="text-sm text-gray-500">Кол-во заказов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                        <h3 className="text-2xl font-bold text-gray-900">{revenueData.average_order}</h3>
                        <p className={`text-sm ${revenueData.average_change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {revenueData.average_change}
                        </p>
                    <p className="text-sm text-gray-500">Средний чек</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Сегодняшний доход по часам</h3>
            <div className="space-y-2">
                  {revenueData.hourly_revenue.map((hour, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                        hour.is_highlighted ? "bg-purple-500 text-white" : "bg-white"
                  }`}
                >
                  <span className="font-medium">{hour.time}</span>
                  <span className="font-semibold">{hour.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Последние заказы</h3>
            <div className="space-y-3">
                  {revenueData.recent_orders.map((order, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">Заказ {order.id}</h4>
                              <Badge className={`${order.status_color} text-xs`}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                              {order.time} • {order.phone} • {order.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{order.amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  // Orders List View (Today's Orders)
  if (currentView === "orders") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Сегодняшние заказы</h1>
                <p className="text-sm text-gray-500">{dashboardStats?.active_orders_count || 0} заказа</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MarketIndicatorCompact currentMarket={currentMarket} />
              <Button variant="ghost" size="sm" onClick={() => setIsDateRangeOpen(true)}>
                <Calendar className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="№ заказа, номер телефона, адрес"
              className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex space-x-6">
            {["Все", "Ожидание", "В пути", "Доставлено"].map((filter) => (
              <button
                key={filter}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  orderFilter === filter
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setOrderFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isLoadingOrders && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : ordersError ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p>{ordersError}</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500">Заказы не найдены</p>
              </CardContent>
            </Card>
          ) : (
            <>
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOrderClick(order)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">Заказ {order.order_number}</h3>
                          <Badge className={`${order.status_color} text-xs`}>{order.status_display}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                          {order.date} • {order.customer_phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{order.amount}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  {order.items.slice(0, 8).map((item, index) => (
                    <img
                      key={index}
                          src={getImageUrl(item.image_url || "") || "/images/product_placeholder_adobe.png"}
                          alt={item.product_name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ))}
                  {order.items.length > 8 && (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{order.items.length - 8}</span>
                    </div>
                  )}
                </div>

                    <p className="text-sm text-gray-500">{order.delivery_address}</p>
              </CardContent>
            </Card>
          ))}
              
              {ordersHasMore && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchOrders(false)}
                  disabled={isLoadingOrders}
                >
                  {isLoadingOrders ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Загрузка...
                    </>
                  ) : (
                    'Загрузить еще'
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <Dialog open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Диапазон дат</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-from" className="text-sm font-medium text-gray-700">
                  От
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-sm font-medium text-gray-700">
                  До
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" onClick={handleDateRangeApply}>
                Применить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // All Orders View
  if (currentView === "all-orders") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Управление заказами</h1>
                <p className="text-sm text-gray-500">{ordersTotal} заказов</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MarketIndicatorCompact currentMarket={currentMarket} />
              <Button variant="ghost" size="sm" onClick={() => setIsDateRangeOpen(true)}>
                <Calendar className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="№ заказа, номер телефона, адрес"
              className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex space-x-6">
            {["Все", "Ожидание", "В пути", "Доставлено"].map((filter) => (
              <button
                key={filter}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  orderFilter === filter
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setOrderFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isLoadingOrders && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : ordersError ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p>{ordersError}</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-center text-gray-500">Заказы не найдены</p>
              </CardContent>
            </Card>
          ) : (
            <>
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOrderClick(order)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">Заказ {order.order_number}</h3>
                          <Badge className={`${order.status_color} text-xs`}>{order.status_display}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                          {order.date} • {order.customer_phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{order.amount}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  {order.items.slice(0, 8).map((item, index) => (
                    <img
                      key={index}
                          src={getImageUrl(item.image_url || "") || "/images/product_placeholder_adobe.png"}
                          alt={item.product_name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ))}
                  {order.items.length > 8 && (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{order.items.length - 8}</span>
                    </div>
                  )}
                </div>

                    <p className="text-sm text-gray-500">{order.delivery_address}</p>
              </CardContent>
            </Card>
          ))}
              
              {ordersHasMore && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchOrders(false)}
                  disabled={isLoadingOrders}
                >
                  {isLoadingOrders ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Загрузка...
                    </>
                  ) : (
                    'Загрузить еще'
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <Dialog open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Диапазон дат</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-from" className="text-sm font-medium text-gray-700">
                  От
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-sm font-medium text-gray-700">
                  До
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" onClick={handleDateRangeApply}>
                Применить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Order Detail View
  if (currentView === "order-detail" && selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("orders")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Заказ {selectedOrder?.order_number}</h1>
                <p className="text-sm text-gray-500">{selectedOrder?.order_date_formatted || selectedOrder?.order_date}</p>
              </div>
            </div>
            <MarketIndicatorCompact currentMarket={currentMarket} />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {isLoadingOrderDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : selectedOrder ? (
            <>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Состав заказа</h3>
            <div className="space-y-4">
                  {selectedOrder.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <img
                        src={getImageUrl(item.image_url || "") || "/images/product_placeholder_adobe.png"}
                        alt={item.product_name}
                    className="w-15 h-15 object-cover rounded"
                  />
                  <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                    {item.size && <p className="text-sm text-gray-500">Размер {item.size}</p>}
                    {item.color && <p className="text-sm text-gray-500">Цвет {item.color}</p>}
                        <p className="text-sm font-medium text-gray-900">
                          {item.price} {selectedOrder.currency} x {item.quantity} = {item.subtotal} {selectedOrder.currency}
                        </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Телефон</span>
                  <span className="font-medium">{selectedOrder.customer_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Адрес</span>
                  <span className="font-medium">{selectedOrder.delivery_address}</span>
            </div>
                {selectedOrder.delivery_city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Город</span>
                    <span className="font-medium">{selectedOrder.delivery_city}</span>
                  </div>
                )}
            <div className="flex justify-between">
              <span className="text-gray-600">Дата и время</span>
                  <span className="font-medium">{selectedOrder.order_date_formatted || selectedOrder.order_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Статус</span>
                  <Badge className={`${selectedOrder.status_color} text-xs`}>{selectedOrder.status_display}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Сумма</span>
                  <span className="font-medium">{selectedOrder.amount || `${selectedOrder.total_amount} ${selectedOrder.currency}`}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              onClick={() => setIsStatusModalOpen(true)}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Обновление...
                    </>
                  ) : (
                    'Изменить статус'
                  )}
            </Button>

                {(selectedOrder.status === "cancelled" || selectedOrder.status_display === "ОТМЕНЕН") ? (
              <Button
                variant="outline"
                className="w-full text-purple-600 border-purple-600 hover:bg-purple-50 bg-transparent"
                onClick={() => setIsResumeConfirmOpen(true)}
                    disabled={isResumingOrder}
                  >
                    {isResumingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Возобновление...
                      </>
                    ) : (
                      'Возобновить заказ'
                    )}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                onClick={() => setIsCancelConfirmOpen(true)}
                    disabled={isCancellingOrder || selectedOrder.status === "delivered"}
                  >
                    {isCancellingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Отмена...
                      </>
                    ) : (
                      'Отменить заказ'
                    )}
              </Button>
            )}
          </div>
            </>
          ) : null}
        </div>

        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Статус заказа</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <RadioGroup value={selectedOrderStatus} onValueChange={setSelectedOrderStatus}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pending" id="pending" />
                  <Label htmlFor="pending">В ожидании (Pending)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="confirmed" id="confirmed" />
                  <Label htmlFor="confirmed">Оформлен (Confirmed)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="processing" id="processing" />
                  <Label htmlFor="processing">В обработке (Processing)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shipped" id="shipped" />
                  <Label htmlFor="shipped">Отправлен (Shipped)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivered" id="delivered" />
                  <Label htmlFor="delivered">Доставлен (Delivered)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cancelled" id="cancelled" />
                  <Label htmlFor="cancelled">Отменен (Cancelled)</Label>
                </div>
              </RadioGroup>
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={handleStatusChange}
                disabled={isUpdatingStatus || !selectedOrderStatus}
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Обновление...
                  </>
                ) : (
                  'Сохранить'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Вы действительно хотите отменить заказ?</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  disabled={isCancellingOrder}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleCancelOrder}
                  disabled={isCancellingOrder}
                >
                  {isCancellingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Отмена...
                    </>
                  ) : (
                    'Отменить'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isResumeConfirmOpen} onOpenChange={setIsResumeConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Вы действительно хотите возобновить заказ?</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsResumeConfirmOpen(false)}
                  disabled={isResumingOrder}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleResumeOrder}
                  disabled={isResumingOrder}
                >
                  {isResumingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Возобновление...
                    </>
                  ) : (
                    'Возобновить'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Settings View
  if (currentView === "settings") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView("dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Настройки</h1>
              </div>
            </div>
            <MarketIndicatorCompact currentMarket={currentMarket} />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Администратор</h3>
                <p className="text-sm text-gray-500">
                  {managerStatus?.role === 'admin' ? 'Администратор' : managerStatus?.role === 'manager' ? 'Менеджер' : 'Просмотр'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Updates Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Обновления в реальном времени</span>
                </div>
                <Switch checked={enablePolling} onCheckedChange={setEnablePolling} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Автоматическое обновление данных каждые 30 секунд
              </p>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <div>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {["Русский", "Кыргызча", "English"].map((language) => (
                <button
                  key={language}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedLanguage === language
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setSelectedLanguage(language)}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isDarkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
                  <span className="font-medium text-gray-900">Тёмная тема</span>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Уведомления</h3>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Получать уведомления о новых заказах</span>
                    <Switch
                      checked={notificationSettings.newOrders}
                      onCheckedChange={(value) => handleNotificationToggle("newOrders", value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Уведомления о смене статуса заказов</span>
                    <Switch
                      checked={notificationSettings.statusChanges}
                      onCheckedChange={(value) => handleNotificationToggle("statusChanges", value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Ежедневный отчёт о доходах на Email</span>
                    <Switch
                      checked={notificationSettings.dailyReport}
                      onCheckedChange={(value) => handleNotificationToggle("dailyReport", value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Уведомления об ошибках доставки</span>
                    <Switch
                      checked={notificationSettings.deliveryErrors}
                      onCheckedChange={(value) => handleNotificationToggle("deliveryErrors", value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
              onClick={() => setIsLogoutConfirmOpen(true)}
            >
              Выйти из аккаунта
            </Button>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Выйти из аккаунта?</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                >
                  Отмена
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleLogout}>
                  Выйти
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}
