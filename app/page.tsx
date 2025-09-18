"use client"

import type React from "react"

import { useState } from "react"
import { Search, Heart, ShoppingCart, User, LogIn, ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function MarquePage() {
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("+996 505-23-12-55")
  const [smsCode, setSmsCode] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("Мужчинам")

  const searchSuggestions = [
    "футболка",
    "футболка мужская",
    "футболка женская",
    "футболка из хлопка",
    "футболка чёрная",
  ]

  const handleWishlistClick = (productId: number) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true)
    } else {
      console.log(`Added product ${productId} to wishlist`)
    }
  }

  const handlePhoneSubmit = () => {
    setIsPhoneModalOpen(false)
    setIsSmsModalOpen(true)
  }

  const handleSmsVerification = () => {
    if (smsCode.length >= 6) {
      setIsSmsModalOpen(false)
      setIsLoggedIn(true)
      setSmsCode("")
      console.log("User logged in successfully with phone:", phoneNumber)
    }
  }

  const handleLoginClick = () => {
    setIsLoginModalOpen(false)
    setIsPhoneModalOpen(true)
  }

  const handleCatalogClick = () => {
    setShowCatalog(true)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSearchSuggestions(value.length > 0)
  }

  const handleSearchFocus = () => {
    if (searchQuery.length > 0) {
      setShowSearchSuggestions(true)
    }
  }

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSearchSuggestions(false), 200)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSearchSuggestions(false)
  }

  const removeSuggestion = (suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, you would remove this from user's search history
    console.log("Remove suggestion:", suggestion)
  }

  const catalogCategories = [
    { name: "Мужчинам", active: selectedCatalogCategory === "Мужчинам" },
    { name: "Женщинам", active: selectedCatalogCategory === "Женщинам" },
    { name: "Детям", active: selectedCatalogCategory === "Детям" },
    { name: "Спорт", active: selectedCatalogCategory === "Спорт" },
    { name: "Обувь", active: selectedCatalogCategory === "Обувь" },
    { name: "Аксессуары", active: selectedCatalogCategory === "Аксессуары" },
    { name: "Бренды", active: selectedCatalogCategory === "Бренды" },
  ]

  const menCategories = [
    { name: "Футболки и поло", count: 2352, image: "/images/black-tshirt.jpg" },
    { name: "Рубашки", count: 2375, image: "/images/black-tshirt.jpg" },
    { name: "Свитшоты и худи", count: 8533, image: "/images/black-tshirt.jpg" },
    { name: "Джинсы", count: 1254, image: "/images/black-tshirt.jpg" },
    { name: "Брюки и шорты", count: 643, image: "/images/black-tshirt.jpg" },
    { name: "Костюмы и пиджаки", count: 124, image: "/images/black-tshirt.jpg" },
    { name: "Верхняя одежда", count: 74, image: "/images/black-tshirt.jpg" },
    { name: "Спортивная одежда", count: 2362, image: "/images/black-tshirt.jpg" },
    { name: "Нижнее белье", count: 7634, image: "/images/black-tshirt.jpg" },
    { name: "Домашняя одежда", count: 23, image: "/images/black-tshirt.jpg" },
  ]

  const womenCategories = [
    { name: "Платья", count: 1852, image: "/images/black-tshirt.jpg" },
    { name: "Блузки и рубашки", count: 1275, image: "/images/black-tshirt.jpg" },
    { name: "Футболки и топы", count: 2533, image: "/images/black-tshirt.jpg" },
    { name: "Джинсы", count: 954, image: "/images/black-tshirt.jpg" },
    { name: "Брюки и леггинсы", count: 743, image: "/images/black-tshirt.jpg" },
    { name: "Юбки", count: 324, image: "/images/black-tshirt.jpg" },
    { name: "Верхняя одежда", count: 174, image: "/images/black-tshirt.jpg" },
    { name: "Спортивная одежда", count: 1362, image: "/images/black-tshirt.jpg" },
    { name: "Нижнее белье", count: 2634, image: "/images/black-tshirt.jpg" },
    { name: "Домашняя одежда", count: 123, image: "/images/black-tshirt.jpg" },
  ]

  const getCurrentCategories = () => {
    switch (selectedCatalogCategory) {
      case "Женщинам":
        return womenCategories
      case "Мужчинам":
      default:
        return menCategories
    }
  }

  // Show catalog page if catalog is open
  if (showCatalog) {
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
                <Button
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg"
                  onClick={() => setShowCatalog(false)}
                >
                  <X className="w-4 h-4 mr-2" />
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
                  <div className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                    <User className="w-5 h-5 mb-1" />
                    <span>Войти</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Catalog Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 bg-white rounded-lg p-6">
              <nav className="space-y-2">
                {catalogCategories.map((category, index) => (
                  <div
                    key={index}
                    className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                      category.active
                        ? "bg-purple-50 text-purple-600 border-l-4 border-purple-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCatalogCategory(category.name)}
                  >
                    {category.name}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black mb-8">{selectedCatalogCategory}</h1>
              <div className="grid grid-cols-2 gap-6">
                {getCurrentCategories().map((category, index) => (
                  <Link
                    key={index}
                    href={`/subcategory/${selectedCatalogCategory.toLowerCase()}/${category.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4"
                  >
                    <img
                      src={category.image || "/placeholder.svg?height=60&width=60&query=clothing item"}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-black mb-1">{category.name}</h3>
                      <span className="text-gray-500 text-sm">{category.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const categories = [
    {
      title: "Мужчинам",
      image: "/images/male-model-black.jpg",
      bgColor: "bg-gray-100",
      href: "/category/мужчинам",
    },
    {
      title: "Женщинам",
      image: "/images/female-model-olive.jpg",
      bgColor: "bg-purple-50",
      href: "/category/женщинам",
    },
    {
      title: "Детям",
      image: "/images/kids-yellow-blue.jpg",
      bgColor: "bg-yellow-50",
      href: "/category/детям",
    },
    {
      title: "Обувь",
      image: "/images/white-sneakers.jpg",
      bgColor: "bg-gray-50",
      href: "/category/обувь",
    },
    {
      title: "Спорт",
      image: "/images/male-model-hoodie.jpg",
      bgColor: "bg-gray-100",
      href: "/category/спорт",
    },
  ]

  const brandsRow1 = [
    { name: "ECCO", logo: "ecco" },
    { name: "VANS", logo: "vans" },
    { name: "MANGO", logo: "mango" },
    { name: "H&M", logo: "h&m" },
    { name: "LIME", logo: "lime" },
    { name: "GUCCI", logo: "gucci" },
  ]

  const brandsRow2 = [
    { name: "LV", logo: "lv" },
    { name: "PRADA", logo: "prada" },
    { name: "CHANEL", logo: "chanel" },
    { name: "Dior", logo: "dior" },
    { name: "NIKE", logo: "nike" },
    { name: "adidas", logo: "adidas" },
  ]

  const recommendedProducts = [
    {
      id: 1,
      name: "Мужская майка из хлопка",
      price: "2999 руб",
      originalPrice: null,
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 2,
      name: "Мужская майка из хлопка",
      price: "2999 руб",
      originalPrice: null,
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 3,
      name: "Мужская майка из хлопка",
      price: "2999 руб",
      originalPrice: null,
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 4,
      name: "Мужская майка из хлопка",
      price: "2999 руб",
      originalPrice: null,
      image: "/images/black-tshirt.jpg",
    },
  ]

  const discountProducts = [
    {
      id: 5,
      name: "Мужская майка из хлопка",
      price: "1999 руб",
      originalPrice: "2999 руб",
      discount: "33%",
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 6,
      name: "Мужская майка из хлопка",
      price: "2399 руб",
      originalPrice: "2999 руб",
      discount: "20%",
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 7,
      name: "Мужская майка из хлопка",
      price: "1999 руб",
      originalPrice: "2999 руб",
      discount: "33%",
      image: "/images/black-tshirt.jpg",
    },
    {
      id: 8,
      name: "Мужская майка из хлопка",
      price: "1999 руб",
      originalPrice: "2999 руб",
      discount: "33%",
      image: "/images/black-tshirt.jpg",
    },
  ]

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
              <Button
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg"
                onClick={handleCatalogClick}
              >
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
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                />
                {showSearchSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
                    {searchSuggestions
                      .filter((suggestion) => suggestion.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-center space-x-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{suggestion}</span>
                          </div>
                          <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={(e) => removeSuggestion(suggestion, e)}
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
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
        {/* Popular Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-8">Популярные категории</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={category.href}
                className={`${category.bgColor} rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-shadow block`}
              >
                <h3 className="text-lg font-semibold text-black mb-4">{category.title}</h3>
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Brands */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-black">Популярные бренды</h2>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              ВСЕ БРЕНДЫ →
            </Button>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {brandsRow1.map((brand, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow h-16"
                >
                  <span className="text-xl font-bold text-black">{brand.name}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {brandsRow2.map((brand, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow h-16"
                >
                  <span className="text-xl font-bold text-black">{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommendations section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-black">Рекомендуем</h2>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              ВСЕ ТОВАРЫ →
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative mb-4">
                  <img
                    src={product.image || "/placeholder.svg?height=200&width=200&query=black t-shirt"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault()
                      handleWishlistClick(product.id)
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-black mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-purple-600">{product.price}</span>
                  <span className="text-xs text-gray-500">Товар 01</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Big Discounts section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-black">Большие скидки</h2>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              ВСЕ ТОВАРЫ →
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {discountProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative mb-4">
                  <img
                    src={product.image || "/placeholder.svg?height=200&width=200&query=black t-shirt"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    onClick={(e) => {
                      e.preventDefault()
                      handleWishlistClick(product.id)
                    }}
                  >
                    <Heart className="w-4 h-4 text-gray-400" />
                  </button>
                  {product.discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{product.discount}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-black mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-purple-600">{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Товар 01</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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

      {/* Phone Verification Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">Введите номер</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">Мы отправим вам код подтверждения</p>
            <div className="space-y-4">
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-center text-lg py-3"
                placeholder="+996 505-23-12-55"
              />
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg"
                onClick={handlePhoneSubmit}
              >
                Продолжить
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Нажимая "Продолжить", вы соглашаетесь с{" "}
              <span className="text-purple-600 cursor-pointer">Политикой конфиденциальности</span> и{" "}
              <span className="text-purple-600 cursor-pointer">Пользовательским соглашением</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Verification Modal */}
      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 p-1"
                onClick={() => {
                  setIsSmsModalOpen(false)
                  setIsPhoneModalOpen(true)
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-center text-xl font-semibold">Код из СМС</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              Мы отправили вам код на номер
              <br />
              {phoneNumber}
            </p>
            <div className="space-y-4">
              <Input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="text-center text-lg py-3 tracking-widest"
                placeholder="233 512"
                maxLength={6}
              />
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg"
                onClick={handleSmsVerification}
                disabled={smsCode.length < 6}
              >
                Подтвердить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Required Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-black">Войдите чтобы добавить товар в избранное</h2>
            </div>
            <div className="flex space-x-3 w-full">
              <Button
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg"
                onClick={handleLoginClick}
              >
                Войти
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-3 rounded-lg bg-transparent"
                onClick={() => setIsLoginModalOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
