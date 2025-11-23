"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
import { useLanguage } from "@/contexts/LanguageContext"
// Map backend status to frontend display status - will be translated in component
const mapBackendStatusToFrontend = (status: string, t: (key: string) => string): string => {
  const statusMap: Record<string, string> = {
    'pending': t('admin.orders.status.pending'),
    'confirmed': t('admin.orders.status.confirmed'),
    'processing': t('admin.orders.status.processing'),
    'shipped': t('admin.orders.status.shipped'),
    'delivered': t('admin.orders.status.delivered'),
    'cancelled': t('admin.orders.status.cancelled'),
    'refunded': t('admin.orders.status.cancelled'),
  }
  return statusMap[status] || status
}

// Helper to format date string (YYYY-MM-DD) as local date (avoids timezone issues)
const formatDateString = (dateString: string | null | undefined, format: 'short' | 'long' = 'short'): string => {
  if (!dateString) return ''
  // Parse YYYY-MM-DD as local date to avoid timezone shift
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed in JS Date
  
  if (format === 'long') {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

// Map frontend display status to backend status - will use backend status directly
const mapFrontendStatusToBackend = (status: string): string => {
  // Status is already in backend format, just return it
  return status.toLowerCase()
}

// Map backend status to frontend display status for status update modal - will be translated in component
const mapBackendStatusForModal = (status: string, t: (key: string) => string): string => {
  // For status update modal, we want to show frontend display names
  if (status === 'pending') return t('admin.orders.status.pending')
  if (status === 'confirmed') return t('admin.orders.status.confirmed')
  if (status === 'processing' || status === 'shipped') return t('admin.orders.status.processing')
  if (status === 'delivered') return t('admin.orders.status.delivered')
  if (status === 'cancelled') return t('admin.orders.status.cancelled')
  return t('admin.orders.status.pending')
}

export default function AdminDashboard() {
  const auth = useAuth()
  const router = useRouter()
  const { t, language: currentLanguage, setLanguage } = useLanguage()
  
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
    total_users_count: number
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
    delivery_notes?: string | null
    total_amount: number
    currency: string
    amount: string
    order_date: string
    date: string
    order_date_formatted: string
    requested_delivery_date?: string | null
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
  const [orderFilter, setOrderFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("")
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isResumeConfirmOpen, setIsResumeConfirmOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  // Sync selectedLanguage with actual language from context
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  
  // Update selectedLanguage when language changes
  useEffect(() => {
    setSelectedLanguage(currentLanguage)
  }, [currentLanguage])
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
  
  const accessibleMarkets = useMemo<Market[] | undefined>(() => {
    if (!managerStatus?.accessible_markets) {
      return undefined
    }
    const normalized = managerStatus.accessible_markets
      .map((market) => {
        const lower = market?.toLowerCase()
        return lower === "kg" || lower === "us" ? (lower as Market) : undefined
      })
      .filter((market): market is Market => Boolean(market))
    return normalized.length ? normalized : undefined
  }, [managerStatus?.accessible_markets])
  
  // Redirect unauthenticated users before conditional returns
  useEffect(() => {
    if (!auth.isLoading && !auth.isLoggedIn && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      router.push('/store-manager/login')
    } else if (auth.isLoggedIn) {
      hasRedirectedRef.current = false
    }
  }, [auth.isLoading, auth.isLoggedIn, router])
  
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
  
  useEffect(() => {
    if (!accessibleMarkets || accessibleMarkets.length === 0) {
      return
    }
    if (!accessibleMarkets.includes(currentMarket)) {
      const fallbackMarket = accessibleMarkets[0]
      setCurrentMarket(fallbackMarket)
      localStorage.setItem("admin_market", fallbackMarket)
      toast.info(`${t('admin.info.marketSwitched')} ${fallbackMarket.toUpperCase()} — ${t('admin.errors.noMarketAccess')}`)
    }
  }, [accessibleMarkets, currentMarket])
  
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
        setManagerStatusError(t('admin.errors.timeout'))
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
          setManagerStatusError(t('admin.errors.notManager'))
        } else if (!data.is_active) {
          setManagerStatusError(t('admin.errors.inactiveAccount'))
        }
      })
      
      // Only mark as checked after successful completion
      hasCheckedOnceRef.current = true
    } catch (error) {
      clearTimeout(timeoutId)
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.checkStatusFailed')
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
        total_users_count: data.total_users_count || 0,
      })
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.loadStatsFailed')
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
      let statusFilter: string | undefined = orderFilter === "all" ? undefined : orderFilter
      if (statusOverride) {
        statusFilter = statusOverride === "all" ? undefined : statusOverride
      } else if (currentView === "orders") {
        // For "today's orders" view, show active orders (pending, confirmed, processing, shipped)
        // Map frontend filter to backend status
        if (orderFilter === "all") {
          statusFilter = undefined
        } else if (orderFilter === "pending") {
          statusFilter = "pending"
        } else if (orderFilter === "processing") {
          statusFilter = "processing"
        } else if (orderFilter === "delivered") {
          statusFilter = "delivered"
        } else {
          statusFilter = orderFilter === "all" ? undefined : orderFilter
        }
      }
      
      const data = await storeManagerApi.getOrders({
        market: marketUpper,
        status: statusFilter,
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
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.loadOrdersFailed')
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
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.loadOrderFailed')
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
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.loadAnalyticsFailed')
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
    if (accessibleMarkets && !accessibleMarkets.includes(newMarket)) {
      toast.error(t('admin.errors.noMarketAccess'))
      return
    }
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
      toast.success(t('admin.orders.statusUpdated'))
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
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.updateStatusFailed')
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
      toast.success(t('admin.orders.orderCancelled'))
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
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.cancelOrderFailed')
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
      toast.success(t('admin.orders.orderResumed'))
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
      const errorMessage = error instanceof ApiError ? error.message : t('admin.errors.resumeOrderFailed')
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
    toast.info(t('admin.info.dateFilterComingSoon'))
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
    toast.info(t('admin.info.notificationSettingsComingSoon'))
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
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-600">Проверка статуса менеджера...</p>
        </div>
      </div>
    )
  }
  
  // Show loading state while redirecting
  if (!auth.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.loading.redirecting')}</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.errors.accessDenied')}</h2>
            <p className="text-gray-600 mb-6">
              {managerStatusError || t('admin.errors.notManagerAccess')}
            </p>
            <div className="space-y-3">
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white"
                onClick={async () => {
                  await auth.handleLogout()
                  router.push('/store-manager/login')
                }}
              >
                {t('admin.actions.logoutAndLogin')}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
                onClick={() => router.push('/')}
              >
                {t('admin.actions.goToHome')}
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
              <h1 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.welcome')}</h1>
              <p className="text-2xl font-bold text-black">{t('admin.dashboard.administrator')}</p>
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
              accessibleMarkets={accessibleMarkets}
            />
          </div>
        </header>

        <div className="p-4 space-y-4">
          {isLoadingDashboard ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
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
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('admin.dashboard.todayOrders')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.dashboard.todayOrdersDesc')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold">
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
                    <h3 className="font-semibold text-gray-900">{t('admin.dashboard.allOrders')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.dashboard.allOrdersDesc')}</p>
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
                    <h3 className="font-semibold text-gray-900">{t('admin.dashboard.revenue')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.dashboard.revenueAllTime')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('admin.dashboard.users')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.dashboard.totalUsers')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{dashboardStats?.total_users_count || 0}</div>
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
                <h1 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.revenue')}</h1>
              </div>
            </div>
            <MarketIndicatorCompact currentMarket={currentMarket} />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {isLoadingRevenue ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
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
                    <p className="text-sm text-gray-500">{t('admin.dashboard.revenueToday')}</p>
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
                    <p className="text-sm text-gray-500">{t('admin.dashboard.ordersCount')}</p>
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
                    <p className="text-sm text-gray-500">{t('admin.dashboard.averageCheck')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('admin.dashboard.todayRevenueByHours')}</h3>
            <div className="space-y-2">
                  {revenueData.hourly_revenue.map((hour, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                        hour.is_highlighted ? "bg-brand text-white" : "bg-white"
                  }`}
                >
                  <span className="font-medium">{hour.time}</span>
                  <span className="font-semibold">{hour.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('admin.dashboard.recentOrders')}</h3>
            <div className="space-y-3">
                  {revenueData.recent_orders.map((order, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{t('admin.orders.order')} {order.id}</h4>
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
                <h1 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.todayOrders')}</h1>
                <p className="text-sm text-gray-500">{dashboardStats?.active_orders_count || 0} {t('admin.orders.count')}</p>
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
              placeholder={t('admin.orders.searchPlaceholder')}
              className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex space-x-6">
            {[
              { value: "all", label: t('admin.orders.filters.all') },
              { value: "pending", label: t('admin.orders.filters.pending') },
              { value: "processing", label: t('admin.orders.filters.processing') },
              { value: "delivered", label: t('admin.orders.filters.delivered') }
            ].map((filter) => (
              <button
                key={filter.value}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  orderFilter === filter.value
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setOrderFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isLoadingOrders && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
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
                <p className="text-center text-gray-500">{t('admin.orders.notFound')}</p>
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
                          <h3 className="font-semibold text-gray-900">{t('admin.orders.order')} {order.order_number}</h3>
                          <Badge className={`${order.status_color} text-xs`}>{order.status_display}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                          {order.date} • {order.customer_phone}
                    </p>
                    {order.requested_delivery_date && (
                      <p className="text-sm text-brand font-medium mt-1">
                        📅 {t('admin.orders.delivery')}: {formatDateString(order.requested_delivery_date, 'short')}
                      </p>
                    )}
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
                    {order.delivery_notes && (
                      <p className="text-sm text-brand font-medium mt-1">
                        💬 {order.delivery_notes}
                      </p>
                    )}
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
                      {t('common.loading')}
                    </>
                  ) : (
                    t('admin.orders.loadMore')
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <Dialog open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.orders.dateRange')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-from" className="text-sm font-medium text-gray-700">
                  {t('search.from')}
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
                  {t('search.to')}
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={handleDateRangeApply}>
                {t('search.apply')}
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
                <h1 className="text-lg font-semibold text-gray-900">{t('admin.dashboard.allOrders')}</h1>
                <p className="text-sm text-gray-500">{ordersTotal} {t('admin.orders.count')}</p>
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
              placeholder={t('admin.orders.searchPlaceholder')}
              className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex space-x-6">
            {[
              { value: "all", label: t('admin.orders.filters.all') },
              { value: "pending", label: t('admin.orders.filters.pending') },
              { value: "processing", label: t('admin.orders.filters.processing') },
              { value: "delivered", label: t('admin.orders.filters.delivered') }
            ].map((filter) => (
              <button
                key={filter.value}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  orderFilter === filter.value
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setOrderFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isLoadingOrders && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
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
                <p className="text-center text-gray-500">{t('admin.orders.notFound')}</p>
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
                          <h3 className="font-semibold text-gray-900">{t('admin.orders.order')} {order.order_number}</h3>
                          <Badge className={`${order.status_color} text-xs`}>{order.status_display}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                          {order.date} • {order.customer_phone}
                    </p>
                    {order.requested_delivery_date && (
                      <p className="text-sm text-brand font-medium mt-1">
                        📅 {t('admin.orders.delivery')}: {formatDateString(order.requested_delivery_date, 'short')}
                      </p>
                    )}
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
                    {order.delivery_notes && (
                      <p className="text-sm text-brand font-medium mt-1">
                        💬 {order.delivery_notes}
                      </p>
                    )}
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
                      {t('common.loading')}
                    </>
                  ) : (
                    t('admin.orders.loadMore')
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        <Dialog open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.orders.dateRange')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-from" className="text-sm font-medium text-gray-700">
                  {t('search.from')}
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
                  {t('search.to')}
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={handleDateRangeApply}>
                {t('search.apply')}
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
                <h1 className="text-lg font-semibold text-gray-900">{t('admin.orders.order')} {selectedOrder?.order_number}</h1>
                <p className="text-sm text-gray-500">{selectedOrder?.order_date_formatted || selectedOrder?.order_date}</p>
              </div>
            </div>
            <MarketIndicatorCompact currentMarket={currentMarket} />
          </div>
        </header>

        <div className="p-4 space-y-6">
          {isLoadingOrderDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : selectedOrder ? (
            <>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('admin.orders.orderItems')}</h3>
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
                    {item.size && <p className="text-sm text-gray-500">{t('admin.orders.size')} {item.size}</p>}
                    {item.color && <p className="text-sm text-gray-500">{t('admin.orders.color')} {item.color}</p>}
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
              <span className="text-gray-600">{t('admin.orders.phone')}</span>
                  <span className="font-medium">{selectedOrder.customer_phone}</span>
            </div>
            
            {/* Address Information Section */}
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.orders.deliveryAddress')}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('addresses.fullAddress')}</span>
                  <span className="font-medium text-right max-w-[60%]">{selectedOrder.delivery_address || t('common.notSpecified')}</span>
                </div>
                
                {/* Detailed address fields from shipping_address if available */}
                {selectedOrder.shipping_address && (
                  <>
                    {selectedOrder.shipping_address.street && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('addresses.street')}</span>
                        <span className="font-medium">{selectedOrder.shipping_address.street}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_address.building && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('addresses.building')}</span>
                        <span className="font-medium">{selectedOrder.shipping_address.building}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_address.apartment && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('addresses.apartment')}</span>
                        <span className="font-medium">{selectedOrder.shipping_address.apartment}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_address.entrance && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('addresses.entrance')}</span>
                        <span className="font-medium">{selectedOrder.shipping_address.entrance}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_address.floor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('addresses.floor')}</span>
                        <span className="font-medium">{selectedOrder.shipping_address.floor}</span>
                      </div>
                    )}
                  </>
                )}
                
                {selectedOrder.delivery_city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('addresses.city')}</span>
                    <span className="font-medium">{selectedOrder.delivery_city}</span>
                  </div>
                )}
                {selectedOrder.delivery_state && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('addresses.state')}</span>
                    <span className="font-medium">{selectedOrder.delivery_state}</span>
                  </div>
                )}
                {selectedOrder.delivery_postal_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('addresses.postalCode')}</span>
                    <span className="font-medium">{selectedOrder.delivery_postal_code}</span>
                  </div>
                )}
                {selectedOrder.delivery_country && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('orders.country')}</span>
                    <span className="font-medium">{selectedOrder.delivery_country}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">{t('admin.orders.dateTime')}</span>
                  <span className="font-medium">{selectedOrder.order_date_formatted || selectedOrder.order_date}</span>
            </div>
            {selectedOrder.requested_delivery_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('admin.orders.deliveryDate')}</span>
                <span className="font-medium text-brand">
                  {formatDateString(selectedOrder.requested_delivery_date, 'long')}
                </span>
              </div>
            )}
            {selectedOrder.delivery_notes && (
              <div className="flex flex-col">
                <span className="text-gray-600 mb-1">{t('admin.orders.orderComment')}</span>
                <span className="font-medium text-brand">{selectedOrder.delivery_notes}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">{t('admin.orders.status')}</span>
                  <Badge className={`${selectedOrder.status_color} text-xs`}>{selectedOrder.status_display}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('admin.orders.total')}</span>
                  <span className="font-medium">{selectedOrder.amount || `${selectedOrder.total_amount} ${selectedOrder.currency}`}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-brand hover:bg-brand-hover text-white"
              onClick={() => setIsStatusModalOpen(true)}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('admin.orders.updating')}
                    </>
                  ) : (
                    t('admin.orders.changeStatus')
                  )}
            </Button>

                {(selectedOrder.status === "cancelled" || selectedOrder.status_display === t('admin.orders.status.cancelled')) ? (
              <Button
                variant="outline"
                className="w-full text-brand border-brand hover:bg-brand-50 bg-transparent"
                onClick={() => setIsResumeConfirmOpen(true)}
                    disabled={isResumingOrder}
                  >
                    {isResumingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('admin.orders.resuming')}...
                      </>
                    ) : (
                      t('admin.orders.resumeOrder')
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
                        {t('common.cancel')}...
                      </>
                    ) : (
                      t('admin.orders.cancelOrder')
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
              <DialogTitle>{t('admin.orders.statusLabel')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <RadioGroup value={selectedOrderStatus} onValueChange={setSelectedOrderStatus}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pending" id="pending" />
                  <Label htmlFor="pending">{t('admin.orders.status.pending')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="confirmed" id="confirmed" />
                  <Label htmlFor="confirmed">{t('admin.orders.status.confirmed')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="processing" id="processing" />
                  <Label htmlFor="processing">{t('admin.orders.status.processing')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shipped" id="shipped" />
                  <Label htmlFor="shipped">{t('admin.orders.status.shipped')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivered" id="delivered" />
                  <Label htmlFor="delivered">{t('admin.orders.status.delivered')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cancelled" id="cancelled" />
                  <Label htmlFor="cancelled">{t('admin.orders.status.cancelled')}</Label>
                </div>
              </RadioGroup>
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white"
                onClick={handleStatusChange}
                disabled={isUpdatingStatus || !selectedOrderStatus}
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('admin.orders.updating')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.orders.confirmCancel')}</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsCancelConfirmOpen(false)}
                  disabled={isCancellingOrder}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleCancelOrder}
                  disabled={isCancellingOrder}
                >
                  {isCancellingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('common.cancel')}...
                    </>
                  ) : (
                    t('admin.orders.cancel')
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isResumeConfirmOpen} onOpenChange={setIsResumeConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.orders.confirmResume')}</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsResumeConfirmOpen(false)}
                  disabled={isResumingOrder}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleResumeOrder}
                  disabled={isResumingOrder}
                >
                  {isResumingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('admin.orders.resuming')}...
                    </>
                  ) : (
                    t('admin.orders.resume')
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
                <h1 className="text-lg font-semibold text-gray-900">{t('settings.title')}</h1>
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
                <h3 className="font-semibold text-gray-900">{t('admin.settings.administrator')}</h3>
                <p className="text-sm text-gray-500">
                  {managerStatus?.role === 'admin' ? t('admin.settings.role.admin') : managerStatus?.role === 'manager' ? t('admin.settings.role.manager') : t('admin.settings.role.viewer')}
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
                  <span className="font-medium text-gray-900">{t('admin.settings.realTimeUpdates')}</span>
                </div>
                <Switch checked={enablePolling} onCheckedChange={setEnablePolling} />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t('admin.settings.realTimeUpdatesDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <div>
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { code: "ru", label: t('languages.russian') },
                { code: "ky", label: t('languages.kyrgyz') },
                { code: "en", label: t('languages.english') }
              ].map((language) => (
                <button
                  key={language.code}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedLanguage === language.code
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => {
                    setLanguage(language.code as 'ru' | 'ky' | 'en')
                    toast.success(`${t('languages.changedTo')} ${language.label}`)
                  }}
                >
                  {language.label}
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
                  <span className="font-medium text-gray-900">{t('admin.settings.darkTheme')}</span>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('admin.settings.notifications')}</h3>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{t('admin.settings.notifyNewOrders')}</span>
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
                    <span className="text-gray-900">{t('admin.settings.notifyStatusChanges')}</span>
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
                    <span className="text-gray-900">{t('admin.settings.dailyReport')}</span>
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
                    <span className="text-gray-900">{t('admin.settings.notifyDeliveryErrors')}</span>
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
              {t('profile.logout')}
            </Button>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.settings.confirmLogout')}</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleLogout}>
                  {t('auth.logout')}
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
