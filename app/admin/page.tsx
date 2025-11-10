"use client"

import { useState, useEffect } from "react"
import { Search, ArrowLeft, Package, TrendingUp, ShoppingBag, Calendar, Settings, Moon, Sun } from "lucide-react"
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

export default function AdminDashboard() {
  const auth = useAuth()
  const router = useRouter()
  
  // Market management
  const [currentMarket, setCurrentMarket] = useState<Market>("kg")
  
  // Initialize market from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMarket = localStorage.getItem("admin_market") as Market | null
      if (savedMarket && (savedMarket === "kg" || savedMarket === "us")) {
        setCurrentMarket(savedMarket)
      } else {
        // Default to KG market
        localStorage.setItem("admin_market", "kg")
      }
    }
  }, [])
  
  // Handle market change
  const handleMarketChange = (newMarket: Market) => {
    setCurrentMarket(newMarket)
    localStorage.setItem("admin_market", newMarket)
    console.log(`📊 Admin market switched to: ${newMarket.toUpperCase()}`)
    // TODO: Reload orders from new market's API
    // For now, just show a notification that data would be reloaded
  }
  
  const [currentView, setCurrentView] = useState<
    "dashboard" | "orders" | "order-detail" | "all-orders" | "revenue" | "settings"
  >("dashboard")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderFilter, setOrderFilter] = useState("Все")
  const [searchQuery, setSearchQuery] = useState("")
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("")
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState("25.10.2025")
  const [dateTo, setDateTo] = useState("08.12.2025")
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

  const orders = [
    {
      id: "#1024",
      date: "15.07.2025",
      phone: "+996 700 123 456",
      address: "мкр Джал, дом 7, кв. 21",
      amount: "1 250 KGS",
      status: "В ПУТИ",
      statusColor: "bg-yellow-100 text-yellow-800",
      delivery: "21.07.2025",
      orderDate: "06.08.2025, 11:12",
      items: [
        {
          name: "Футболка спорт из хлопка",
          image: "/black-t-shirt.png",
          size: "42",
          color: "Чёрный",
          price: "2999 сом",
        },
        {
          name: "Футболка спорт из хлопка",
          image: "/beige-t-shirt.jpg",
          size: "42",
          color: "Чёрный",
          price: "2999 сом",
        },
      ],
    },
    {
      id: "#1023",
      date: "15.07.2025",
      phone: "+996 505 23 12 55",
      address: "мкр Джал 7",
      amount: "1 423 KGS",
      status: "ДОСТАВЛЕН",
      statusColor: "bg-purple-100 text-purple-800",
      delivery: "21.07.2025",
      orderDate: "06.08.2025, 11:12",
      items: [
        { name: "Футболка", image: "/black-t-shirt.png" },
        { name: "Майка", image: "/beige-t-shirt.jpg" },
        { name: "Джинсы", image: "/black-t-shirt.png" },
        { name: "Куртка", image: "/beige-t-shirt.jpg" },
      ],
    },
    {
      id: "#1022",
      date: "15.07.2025",
      phone: "+996 505 23 12 55",
      address: "ул. Чуйкова 17",
      amount: "2 543 KGS",
      status: "ДОСТАВЛЕН",
      statusColor: "bg-purple-100 text-purple-800",
      delivery: "21.07.2025",
      orderDate: "06.08.2025, 11:12",
      items: [
        { name: "Футболка", image: "/black-t-shirt.png" },
        { name: "Майка", image: "/beige-t-shirt.jpg" },
        { name: "Джинсы", image: "/black-t-shirt.png" },
        { name: "Куртка", image: "/beige-t-shirt.jpg" },
        { name: "Свитер", image: "/black-t-shirt.png" },
        { name: "Брюки", image: "/beige-t-shirt.jpg" },
        { name: "Рубашка", image: "/black-t-shirt.png" },
        { name: "Кроссовки", image: "/beige-t-shirt.jpg" },
        { name: "Шапка", image: "/black-t-shirt.png" },
        { name: "Перчатки", image: "/beige-t-shirt.jpg" },
      ],
    },
    {
      id: "#1021",
      date: "15.07.2025",
      phone: "+996 505 23 12 55",
      address: "ул. Ибраимова 153",
      amount: "530 KGS",
      status: "ДОСТАВЛЕН",
      statusColor: "bg-purple-100 text-purple-800",
      delivery: "21.07.2025",
      orderDate: "06.08.2025, 11:12",
      items: [
        { name: "Футболка", image: "/black-t-shirt.png" },
        { name: "Майка", image: "/beige-t-shirt.jpg" },
      ],
    },
    {
      id: "#1020",
      date: "15.07.2025",
      phone: "+996 505 23 12 55",
      address: "ул. Чуй дом 39, кв 6",
      amount: "8 234 KGS",
      status: "ОТМЕНЕН",
      statusColor: "bg-red-100 text-red-800",
      delivery: "21.07.2025",
      orderDate: "06.08.2025, 11:12",
      items: [
        { name: "Футболка", image: "/black-t-shirt.png" },
        { name: "Майка", image: "/beige-t-shirt.jpg" },
      ],
    },
    {
      id: "#1019",
      date: "15.07.2025",
      phone: "+996 505 23 12 55",
      address: "ул. Манаса 174",
      amount: "2 543 KGS",
      status: "ДОСТАВЛЕН",
      statusColor: "bg-purple-100 text-purple-800",
      delivery: "21.07.2025",
      orderDate: "06.08.2025, 11:12",
      items: [
        { name: "Футболка", image: "/black-t-shirt.png" },
        { name: "Майка", image: "/beige-t-shirt.jpg" },
      ],
    },
  ]

  const revenueData = {
    totalRevenue: "7 150 KGS",
    revenueChange: "+17% чем вчера",
    totalOrders: 5,
    ordersChange: "-2 чем вчера",
    averageOrder: "1 430 KGS",
    averageChange: "+4% чем вчера",
    hourlyRevenue: [
      { time: "07:00", amount: "3 100 KGS" },
      { time: "08:00", amount: "3 100 KGS" },
      { time: "09:00", amount: "3 100 KGS", isHighlighted: true },
      { time: "12:00", amount: "3 100 KGS" },
    ],
    recentOrders: [
      {
        id: "#1024",
        status: "В ожидании",
        statusColor: "bg-yellow-100 text-yellow-800",
        phone: "+996 505 23 12 55",
        address: "ул. Иманова 24",
        amount: "1 250 KGS",
      },
      {
        id: "#1023",
        status: "В пути",
        statusColor: "bg-blue-100 text-blue-800",
        phone: "+996 505 23 12 55",
        address: "мкр Джал 7",
        amount: "1 423 KGS",
      },
    ],
  }

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      orderFilter === "Все" ||
      (orderFilter === "Ожидание" && order.status === "ОФОРМЛЕН") ||
      (orderFilter === "В пути" && order.status === "В ПУТИ") ||
      (orderFilter === "Доставлено" && order.status === "ДОСТАВЛЕН")

    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.address.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const activeOrdersCount = orders.filter((order) => order.status === "ОФОРМЛЕН" || order.status === "В ПУТИ").length

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order)
    setSelectedOrderStatus(order.status)
    setCurrentView("order-detail")
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Updating order ${orderId} to status: ${newStatus}`)
    setIsStatusModalOpen(false)
  }

  const handleCancelOrder = () => {
    console.log(`Cancelling order ${selectedOrder?.id}`)
    setIsCancelConfirmOpen(false)
    if (selectedOrder) {
      selectedOrder.status = "ОТМЕНЕН"
      selectedOrder.statusColor = "bg-red-100 text-red-800"
    }
  }

  const handleResumeOrder = () => {
    console.log(`Resuming order ${selectedOrder?.id}`)
    setIsResumeConfirmOpen(false)
    if (selectedOrder) {
      selectedOrder.status = "В ПУТИ"
      selectedOrder.statusColor = "bg-yellow-100 text-yellow-800"
    }
  }

  const handleDateRangeApply = () => {
    console.log(`Filtering orders from ${dateFrom} to ${dateTo}`)
    setIsDateRangeOpen(false)
  }

  const adminProfile = {
    name: "Азамат Токтосунов",
    phone: "+996 700 123 456",
  }

  const handleLogout = () => {
    auth.handleLogout()
    setIsLogoutConfirmOpen(false)
    router.push('/')
  }

  const handleNotificationToggle = (setting: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }))
  }

  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Добро пожаловать,</h1>
              <p className="text-2xl font-bold text-black">Нуртилек</p>
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
                    {activeOrdersCount}
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
                  <div className="text-lg font-bold text-gray-900">1238</div>
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
        </div>
      </div>
    )
  }

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
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{revenueData.totalRevenue}</h3>
                    <p className="text-sm text-green-600">{revenueData.revenueChange}</p>
                    <p className="text-sm text-gray-500">Доход за сегодня</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{revenueData.totalOrders}</h3>
                    <p className="text-sm text-red-600">{revenueData.ordersChange}</p>
                    <p className="text-sm text-gray-500">Кол-во заказов</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{revenueData.averageOrder}</h3>
                    <p className="text-sm text-green-600">{revenueData.averageChange}</p>
                    <p className="text-sm text-gray-500">Средний чек</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Сегодняшний доход по часам</h3>
            <div className="space-y-2">
              {revenueData.hourlyRevenue.map((hour, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    hour.isHighlighted ? "bg-purple-500 text-white" : "bg-white"
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
              {revenueData.recentOrders.map((order, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">Заказ {order.id}</h4>
                          <Badge className={`${order.statusColor} text-xs`}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          13:11 • {order.phone} • {order.address}
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
        </div>
      </div>
    )
  }

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
                <p className="text-sm text-gray-500">{activeOrdersCount} заказа</p>
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
                      <h3 className="font-semibold text-gray-900">Заказ {order.id}</h3>
                      <Badge className={`${order.statusColor} text-xs`}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.date} • {order.phone}
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
                      src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ))}
                  {order.items.length > 8 && (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{order.items.length - 8}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500">Доставка {order.delivery}</p>
              </CardContent>
            </Card>
          ))}
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
                  type="text"
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
                  type="text"
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
                <p className="text-sm text-gray-500">1238 заказов</p>
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
                      <h3 className="font-semibold text-gray-900">Заказ {order.id}</h3>
                      <Badge className={`${order.statusColor} text-xs`}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.date} • {order.phone}
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
                      src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ))}
                  {order.items.length > 8 && (
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{order.items.length - 8}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500">Доставка {order.delivery}</p>
              </CardContent>
            </Card>
          ))}
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
                  type="text"
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
                  type="text"
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
                <h1 className="text-lg font-semibold text-gray-900">Заказ {selectedOrder.id}</h1>
                <p className="text-sm text-gray-500">{selectedOrder.orderDate}</p>
              </div>
            </div>
            <MarketIndicatorCompact currentMarket={currentMarket} />
          </div>
        </header>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Состав заказа</h3>
            <div className="space-y-4">
              {selectedOrder.items.map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <img
                    src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                    alt={item.name}
                    className="w-15 h-15 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.size && <p className="text-sm text-gray-500">Размер {item.size}</p>}
                    {item.color && <p className="text-sm text-gray-500">Цвет {item.color}</p>}
                    {item.price && <p className="text-sm font-medium text-gray-900">{item.price}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Телефон</span>
              <span className="font-medium">{selectedOrder.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Адрес</span>
              <span className="font-medium">{selectedOrder.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Дата и время</span>
              <span className="font-medium">{selectedOrder.orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Статус</span>
              <Badge className={`${selectedOrder.statusColor} text-xs`}>{selectedOrder.status}</Badge>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              onClick={() => setIsStatusModalOpen(true)}
            >
              Изменить статус
            </Button>

            {selectedOrder.status === "ОТМЕНЕН" ? (
              <Button
                variant="outline"
                className="w-full text-purple-600 border-purple-600 hover:bg-purple-50 bg-transparent"
                onClick={() => setIsResumeConfirmOpen(true)}
              >
                Возобновить заказ
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                onClick={() => setIsCancelConfirmOpen(true)}
              >
                Отменить заказ
              </Button>
            )}
          </div>
        </div>

        <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Статус заказа</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <RadioGroup value={selectedOrderStatus} onValueChange={setSelectedOrderStatus}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="В ожидании" id="waiting" />
                  <Label htmlFor="waiting">В ожидании</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="В ПУТИ" id="in-transit" />
                  <Label htmlFor="in-transit">В пути</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ДОСТАВЛЕН" id="delivered" />
                  <Label htmlFor="delivered">Доставлено</Label>
                </div>
              </RadioGroup>
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
                >
                  Отмена
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCancelOrder}>
                  Отменить
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
                >
                  Отмена
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleResumeOrder}>
                  Отменить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

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
                <h3 className="font-semibold text-gray-900">{adminProfile.name}</h3>
                <p className="text-sm text-gray-500">{adminProfile.phone}</p>
              </div>
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
              <p className="text-sm text-gray-500">{activeOrdersCount} заказа</p>
            </div>
          </div>
          <MarketIndicatorCompact currentMarket={currentMarket} />
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
                    <h3 className="font-semibold text-gray-900">Заказ {order.id}</h3>
                    <Badge className={`${order.statusColor} text-xs`}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {order.date} • {order.phone}
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
                    src={getImageUrl(item.image) || "/images/product_placeholder_adobe.png"}
                    alt={item.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                ))}
                {order.items.length > 8 && (
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">+{order.items.length - 8}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">Доставка {order.delivery}</p>
            </CardContent>
          </Card>
        ))}
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
                type="text"
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
                type="text"
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
