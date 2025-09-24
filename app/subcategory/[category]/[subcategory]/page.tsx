"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Heart, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Header } from "@/components/Header"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { allProducts, Product } from "@/lib/products"

const subcategoryData = {
  "futbolki-i-polo": {
    title: "Футболки и поло",
    category: "Мужчинам",
  },
}

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
  const auth = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const subcategory = subcategoryData[params.subcategory as keyof typeof subcategoryData]
  const itemsPerPage = 9
  const totalPages = Math.ceil(allProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentProducts = allProducts.slice(startIndex, startIndex + itemsPerPage)

  if (!subcategory) {
    return <div>Subcategory not found</div>
  }

  const handleWishlistClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    auth.requireAuth(() => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id)
      } else {
        addToWishlist(product)
      }
    })
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
      <AuthModals {...auth} />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Header />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-brand">
            Главная
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href={`/category/${params.category}`} className="text-gray-600 hover:text-brand">
            {subcategory.category}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-black">{subcategory.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-80 bg-white rounded-lg p-6 h-fit">
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
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and Title */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-black">{subcategory.title}</h1>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-brand text-sm"
                >
                  Сортировать по: <span className="font-medium">{sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
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
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {currentProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`} className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group">
                  <div className="relative mb-3">
                    <div className="absolute top-2 right-2 z-10">
                      <button onClick={(e) => handleWishlistClick(e, product)} className="p-1.5 bg-gray-100/80 rounded-full">
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={product.image || "/images/black-tshirt.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase font-medium">{product.brand}</div>
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">{product.name}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">{product.price} сом</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">{product.originalPrice} сом</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Продано {product.salesCount}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? "bg-brand text-white"
                        : "border border-gray-300 hover:border-brand"
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
                    className="px-3 py-2 rounded-lg border border-gray-300 hover:border-brand text-sm"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
            <div>Пользовательское соглашение</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
