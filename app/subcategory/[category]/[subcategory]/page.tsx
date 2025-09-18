"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

const subcategoryData = {
  "futbolki-i-polo": {
    title: "Футболки и поло",
    category: "Мужчинам",
  },
}

const products = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: "Футболка спорт. из хлопка",
  price: 2999,
  sold: 23,
  image: "/images/black-tshirt.jpg",
}))

const filters = {
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: ["Чёрный", "Белый", "Серый", "Синий"],
  brands: ["Ecco", "Vans", "Mango", "H&M", "Lime"],
  seasons: ["Весна", "Лето", "Осень", "Зима"],
  materials: ["Хлопок", "Полиэстер", "Шерсть"],
  styles: ["Casual", "Sport", "Classic"],
}

const sortOptions = [
  { value: "newest", label: "новизне" },
  { value: "popular", label: "Популярное" },
  { value: "price-low", label: "Сначала дешёвые" },
  { value: "price-high", label: "Сначала дорогие" },
  { value: "rating", label: "По рейтингу" },
  { value: "discount", label: "По размеру скидки" },
  { value: "name", label: "По алфавиту" },
]

export default function SubcategoryPage({
  params,
}: {
  params: { category: string; subcategory: string }
}) {
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const subcategory = subcategoryData[params.subcategory as keyof typeof subcategoryData]
  const itemsPerPage = 9
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage)

  if (!subcategory) {
    return <div>Subcategory not found</div>
  }

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: checked
        ? [...(prev[filterType] || []), value]
        : (prev[filterType] || []).filter((v) => v !== value),
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-bold text-gray-900">MARQUE</div>
            <Button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg">📋 Каталог</Button>
            <div className="relative">
              <input
                type="text"
                placeholder="Товар, бренд или артикул"
                className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
              <Heart className="w-5 h-5" />
              <span>Избранные</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
              <ShoppingCart className="w-5 h-5" />
              <span>Корзина</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
              <User className="w-5 h-5" />
              <span>Войти</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-gray-600">
          <Link href={`/category/${params.category}`} className="hover:text-gray-900">
            {subcategory.category}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{subcategory.title}</span>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 bg-white rounded-lg p-6 h-fit">
            <h3 className="font-bold text-lg mb-6">Фильтры</h3>

            {/* Size Filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Размер</h4>
              <div className="flex flex-wrap gap-2">
                {filters.sizes.map((size) => (
                  <button
                    key={size}
                    className="px-3 py-1 border border-gray-300 rounded hover:border-purple-500 hover:text-purple-600 text-sm"
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button className="text-purple-600 text-sm mt-2">Показать все ▼</button>
            </div>

            {/* Color Filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Цвет (Цвет)</h4>
              <div className="space-y-2">
                {filters.colors.map((color) => (
                  <label key={color} className="flex items-center gap-2">
                    <Checkbox onCheckedChange={(checked) => handleFilterChange("colors", color, checked as boolean)} />
                    <span className="text-sm">{color}</span>
                  </label>
                ))}
              </div>
              <button className="text-purple-600 text-sm mt-2">Показать все ▼</button>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Бренд</h4>
              <div className="space-y-2">
                {filters.brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2">
                    <Checkbox onCheckedChange={(checked) => handleFilterChange("brands", brand, checked as boolean)} />
                    <span className="text-sm">{brand}</span>
                  </label>
                ))}
              </div>
              <button className="text-purple-600 text-sm mt-2">Показать все ▼</button>
            </div>

            {/* Additional Filters */}
            <div className="space-y-4">
              <div>
                <button className="flex items-center justify-between w-full text-left font-medium">
                  Сезон <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div>
                <button className="flex items-center justify-between w-full text-left font-medium">
                  Основной материал <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div>
                <button className="flex items-center justify-between w-full text-left font-medium">
                  Стиль <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and Title */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{subcategory.title}</h1>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-purple-500"
                >
                  сортировать по: {sortOptions.find((opt) => opt.value === sortBy)?.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value)
                          setShowSortDropdown(false)
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {currentProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 font-bold">{product.price} сом</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Продано {product.sold}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? "bg-purple-500 text-white"
                        : "border border-gray-300 hover:border-purple-500"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {totalPages > 5 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-2 rounded-lg border border-gray-300 hover:border-purple-500"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-6">MARQUE</h3>
              <div className="space-y-4">
                <h4 className="font-semibold">Популярные категории</h4>
                <div className="space-y-2 text-gray-300">
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
              <div className="space-y-4">
                <h4 className="font-semibold">Бренды</h4>
                <div className="space-y-2 text-gray-300">
                  <div>Ecco</div>
                  <div>Vans</div>
                  <div>MANGO</div>
                  <div>H&M</div>
                  <div>LIME</div>
                  <div>GUCCI</div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex justify-between text-gray-400">
            <div>Политика конфиденциальности</div>
            <div>Условия пользования</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
