"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Heart, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { API_CONFIG } from "@/lib/config"
import { useCatalog } from "@/contexts/CatalogContext"

const sortOptions = [
  { value: "popular", label: "Популярное" },
  { value: "newest", label: "Новинки" },
  { value: "price_asc", label: "Сначала дешёвые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "rating", label: "По рейтингу" },
]

export default function SubcategoryPage({
  params,
}: {
  params: { category: string; subcategory: string }
}) {
  const auth = useAuth()
  const router = useRouter()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { openCatalog } = useCatalog()
  
  // API State
  const [category, setCategory] = useState<any>(null)
  const [subcategory, setSubcategory] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [filters, setFilters] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter & Sort State
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    sizes: [],
    colors: [],
    brands: [],
  })
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({})
  const [sortBy, setSortBy] = useState("popular")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showSizeDropdown, setShowSizeDropdown] = useState(false)
  const [showPriceDropdown, setShowPriceDropdown] = useState(false)
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const [showAllFiltersModal, setShowAllFiltersModal] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false)
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [allSubcategories, setAllSubcategories] = useState<any[]>([])
  
  const itemsPerPage = 20

  // Load all categories and subcategories from API
  useEffect(() => {
    const loadCategoriesAndSubcategories = async () => {
      try {
        // Try to load categories from API first
        try {
          const categoriesResponse = await fetch(`${API_CONFIG.BASE_URL}/categories`)
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json()
            if (categoriesData.categories && categoriesData.categories.length > 0) {
              setAllCategories(categoriesData.categories)
            }
          }
        } catch (catError) {
          console.log('Categories API not available, will use data from product API')
        }
        
        // Try to load subcategories from API
        const categorySlug = category?.slug || params.category
        if (categorySlug) {
          try {
            const subcategoriesResponse = await fetch(`${API_CONFIG.BASE_URL}/categories/${categorySlug}/subcategories`)
            if (subcategoriesResponse.ok) {
              const subcategoriesData = await subcategoriesResponse.json()
              if (subcategoriesData.subcategories && subcategoriesData.subcategories.length > 0) {
                setAllSubcategories(subcategoriesData.subcategories)
              }
            }
          } catch (subError) {
            console.log('Subcategories API not available, will use data from product API')
          }
        }
      } catch (error) {
        console.error('Failed to load categories/subcategories:', error)
      }
    }
    loadCategoriesAndSubcategories()
  }, [category?.slug, params.category])
  
  // When product data loads, use it to populate categories/subcategories if not already loaded
  useEffect(() => {
    if (category && allCategories.length === 0) {
      // Add current category to list
      setAllCategories([category])
    }
  }, [category, allCategories.length])

  // Load subcategory products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Build API URL - using simpler subcategory endpoint
        const url = new URL(
          `${API_CONFIG.BASE_URL}/subcategories/${params.subcategory}/products`
        )
        
        // Add query parameters
        url.searchParams.append('page', currentPage.toString())
        url.searchParams.append('limit', itemsPerPage.toString())
        url.searchParams.append('sort_by', sortBy)
        
        // Add filters
        if (selectedFilters.sizes.length > 0) {
          url.searchParams.append('sizes', selectedFilters.sizes.join(','))
        }
        if (selectedFilters.colors.length > 0) {
          url.searchParams.append('colors', selectedFilters.colors.join(','))
        }
        if (selectedFilters.brands.length > 0) {
          url.searchParams.append('brands', selectedFilters.brands.join(','))
        }
        if (priceRange.min) {
          url.searchParams.append('price_min', priceRange.min.toString())
        }
        if (priceRange.max) {
          url.searchParams.append('price_max', priceRange.max.toString())
        }
        
        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error('Failed to load products')
        }
        
        const data = await response.json()
        
        setCategory(data.category)
        setSubcategory(data.subcategory)
        setProducts(data.products || [])
        setFilters(data.filters || {})
        setTotal(data.total || 0)
        setTotalPages(data.total_pages || 1)
      } catch (err: any) {
        console.error('Failed to load subcategory products:', err)
        setError(err.message || 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (params.category && params.subcategory) {
      loadProducts()
    }
  }, [params.category, params.subcategory, currentPage, sortBy, selectedFilters, priceRange])

  const handleWishlistClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    auth.requireAuth(() => {
      const productId = product.id.toString()
      if (isInWishlist(productId)) {
        removeFromWishlist(productId)
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
    setCurrentPage(1) // Reset to first page when filters change
  }
  
  // Loading state
  if (isLoading && !products.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <Header />
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">Загружаем товары...</p>
          </div>
        </main>
      </div>
    )
  }
  
  // Error state
  if (error && !products.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <Header />
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Категория не найдена</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/">
            <Button className="bg-brand hover:bg-brand-hover text-white">
              Вернуться на главную
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Header />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button 
            onClick={openCatalog}
            className="text-gray-600 hover:text-brand cursor-pointer"
          >
            {category?.name || params.category}
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-black">{subcategory?.name || params.subcategory}</span>
        </div>

        {/* Title and Count */}
              <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">{subcategory?.name || 'Товары'} <span className="text-gray-500 font-normal text-lg">{total} товаров</span></h1>
                </div>

        {/* Horizontal Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm"
            >
              <span>{sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showSortDropdown && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortDropdown(false)
                      setCurrentPage(1)
                    }}
                    className={`block w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-sm ${
                      sortBy === option.value ? 'bg-gray-50 text-brand font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* All Filters Button */}
          <button 
            onClick={() => setShowAllFiltersModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Все фильтры
          </button>

          {/* Category Dropdown */}
          {allCategories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>{category?.name || 'Мужчинам'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategoryDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                  {allCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        // Stay on same page, navigate to same subcategory under different category
                        router.push(`/subcategory/${cat.slug}/${params.subcategory}`)
                        setShowCategoryDropdown(false)
                      }}
                      className={`block w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-sm ${
                        category?.slug === cat.slug ? 'bg-gray-50 text-brand font-medium' : ''
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subcategory Dropdown */}
          {allSubcategories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm"
              >
                <span>{subcategory?.name || 'Футболки и поло'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSubcategoryDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[220px]">
                  {allSubcategories.map((subcat: any) => (
                    <Link
                      key={subcat.slug}
                      href={`/subcategory/${category?.slug || params.category}/${subcat.slug}`}
                      onClick={() => setShowSubcategoryDropdown(false)}
                      className={`block px-4 py-2.5 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-sm ${
                        subcategory?.slug === subcat.slug ? 'bg-gray-50 text-brand font-medium' : ''
                      }`}
                    >
                      {subcat.name}
                    </Link>
                  ))}
                </div>
              )}
              </div>
            )}

          {/* Size Filter Dropdown */}
            {filters.available_sizes && filters.available_sizes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm"
              >
                <span>Размер</span>
                {selectedFilters.sizes && selectedFilters.sizes.length > 0 && (
                  <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedFilters.sizes.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSizeDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[250px]">
                <div className="flex flex-wrap gap-2">
                  {filters.available_sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => {
                        const checked = !selectedFilters.sizes?.includes(size)
                        handleFilterChange("sizes", size, checked)
                      }}
                        className={`px-3 py-1.5 border rounded text-sm ${
                        selectedFilters.sizes?.includes(size)
                            ? 'border-brand bg-brand text-white'
                          : 'border-gray-300 hover:border-brand'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                </div>
              )}
            </div>
          )}

          {/* Price Filter Dropdown */}
          {filters.price_range && (
            <div className="relative">
              <button
                onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm"
              >
                <span>Цена</span>
                {(priceRange.min || priceRange.max) && (
                  <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    1
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPriceDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[280px]">
                  <h4 className="font-medium mb-3 text-sm">Цена (сом)</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="от"
                      value={priceRange.min || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                    />
                    <input
                      type="number"
                      placeholder="до"
                      value={priceRange.max || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    от {Math.floor(filters.price_range.min)} до {Math.ceil(filters.price_range.max)} сом
                  </p>
                </div>
              )}
              </div>
            )}

          {/* Color Filter Dropdown */}
            {filters.available_colors && filters.available_colors.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowColorDropdown(!showColorDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm"
              >
                <span>Цвет</span>
                {selectedFilters.colors && selectedFilters.colors.length > 0 && (
                  <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedFilters.colors.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showColorDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[220px]">
                <div className="space-y-2">
                  {filters.available_colors.map((color: string) => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <Checkbox 
                        checked={selectedFilters.colors?.includes(color)}
                        onCheckedChange={(checked) => handleFilterChange("colors", color, checked as boolean)} 
                      />
                      <span className="text-sm capitalize">{color}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
              </div>
            )}
            
          {/* Clear Filters Button */}
          {(selectedFilters.sizes?.length > 0 || selectedFilters.colors?.length > 0 || selectedFilters.brands?.length > 0 || priceRange.min || priceRange.max) && (
            <button
                onClick={() => {
                  setSelectedFilters({ sizes: [], colors: [], brands: [] })
                  setPriceRange({})
                  setCurrentPage(1)
                }}
              className="px-4 py-2 text-brand hover:text-brand-hover text-sm font-medium"
            >
              Сбросить
                      </button>
                )}
            </div>

        {/* Products Grid (Full Width) */}
            {isLoading && currentPage === 1 ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mr-3"></div>
                <p className="text-gray-600">Загружаем товары...</p>
              </div>
            ) : products.length > 0 ? (
              <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
                  {products.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.slug || product.id}`} 
                      className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group"
                    >
                      <div className="relative mb-3">
                    {(product.discount_percentage || product.discount_percent) && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
                        -{product.discount_percentage || product.discount_percent}%
                          </div>
                        )}
                        <div className="absolute top-2 right-2 z-10">
                          <button onClick={(e) => handleWishlistClick(e, product)} className="p-1.5 bg-gray-100/80 rounded-full">
                            <Heart className={`w-4 h-4 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                          </button>
                        </div>
                        <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                          <img
                        src={product.main_image || product.image || "/images/black-tshirt.jpg"}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                          {product.brand_name || 'MARQUE'}
                        </div>
                        <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                          {product.title}
                        </h3>
                        <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">{product.price || product.price_min} сом</span>
                      {(product.original_price || product.original_price_min) && (
                        <span className="text-xs text-gray-400 line-through">{product.original_price || product.original_price_min} сом</span>
                          )}
                        </div>
                        {product.sold_count > 0 && (
                          <div className="text-xs text-gray-500">Продано {product.sold_count}</div>
                        )}
                    {product.in_stock === false && (
                          <div className="text-xs text-red-500">Нет в наличии</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
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

                    {totalPages > 5 && currentPage < totalPages - 2 && (
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
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">Товары не найдены</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedFilters({ sizes: [], colors: [], brands: [] })
                    setPriceRange({})
                    setCurrentPage(1)
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            )}
      </main>

      {/* All Filters Sidebar */}
      {showAllFiltersModal && (
        <>
          {/* Light backdrop - click to close */}
          <div 
            className="fixed inset-0 bg-transparent z-30"
            onClick={() => setShowAllFiltersModal(false)}
          />
          
          {/* Left Sidebar */}
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-40 overflow-y-auto shadow-2xl border-r border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Все фильтры</h2>
              <button 
                onClick={() => setShowAllFiltersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters Content */}
            <div className="p-6 space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-medium mb-3">Категория</h3>
                <div className="space-y-2">
                  <Link 
                    href="/category/men"
                    className={`block px-4 py-2 rounded-lg ${category?.slug === 'men' ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    Мужчинам
                  </Link>
                  <Link 
                    href="/category/women"
                    className={`block px-4 py-2 rounded-lg ${category?.slug === 'women' ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    Женщинам
                  </Link>
                  <Link 
                    href="/category/kids"
                    className={`block px-4 py-2 rounded-lg ${category?.slug === 'kids' ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    Детям
                  </Link>
                </div>
              </div>

              {/* Subcategory Filter */}
              {category && (
                <div>
                  <h3 className="font-medium mb-3">Подкатегория</h3>
                  <div className="space-y-2">
                    <Link 
                      href={`/subcategory/${category.slug}/t-shirts`}
                      className={`block px-4 py-2 rounded-lg ${subcategory?.slug === 't-shirts' ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      Футболки
                    </Link>
                    <Link 
                      href={`/subcategory/${category.slug}/shirts`}
                      className={`block px-4 py-2 rounded-lg ${subcategory?.slug === 'shirts' ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      Рубашки
                    </Link>
                    <Link 
                      href={`/subcategory/${category.slug}/jeans`}
                      className={`block px-4 py-2 rounded-lg ${subcategory?.slug === 'jeans' ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      Джинсы
                    </Link>
                  </div>
                </div>
              )}

              {/* Brand Filter */}
              {filters.available_brands && filters.available_brands.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Бренд</h3>
                  <div className="space-y-2">
                    {filters.available_brands.map((brand: any) => (
                      <label key={brand.slug} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <Checkbox 
                          checked={selectedFilters.brands?.includes(brand.slug)}
                          onCheckedChange={(checked) => handleFilterChange("brands", brand.slug, checked as boolean)} 
                        />
                        <span className="text-sm">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              {filters.price_range && (
                <div>
                  <h3 className="font-medium mb-3">Цена (сом)</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="от"
                      value={priceRange.min || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                    />
                    <input
                      type="number"
                      placeholder="до"
                      value={priceRange.max || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    от {Math.floor(filters.price_range.min)} до {Math.ceil(filters.price_range.max)} сом
                  </p>
                </div>
              )}

              {/* Size Filter */}
              {filters.available_sizes && filters.available_sizes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Размер</h3>
                  <div className="flex flex-wrap gap-2">
                    {filters.available_sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => {
                          const checked = !selectedFilters.sizes?.includes(size)
                          handleFilterChange("sizes", size, checked)
                        }}
                        className={`px-3 py-1.5 border rounded text-sm ${
                          selectedFilters.sizes?.includes(size)
                            ? 'border-brand bg-brand text-white'
                            : 'border-gray-300 hover:border-brand'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {filters.available_colors && filters.available_colors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Цвет</h3>
                  <div className="space-y-2">
                    {filters.available_colors.map((color: string) => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <Checkbox 
                          checked={selectedFilters.colors?.includes(color)}
                          onCheckedChange={(checked) => handleFilterChange("colors", color, checked as boolean)} 
                        />
                        <span className="text-sm capitalize">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedFilters({ sizes: [], colors: [], brands: [] })
                  setPriceRange({})
                  setCurrentPage(1)
                }}
              >
                Сбросить
              </Button>
              <Button
                className="flex-1 bg-brand hover:bg-brand-hover text-white"
                onClick={() => setShowAllFiltersModal(false)}
              >
                Применить
              </Button>
            </div>
          </div>
        </>
      )}

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
