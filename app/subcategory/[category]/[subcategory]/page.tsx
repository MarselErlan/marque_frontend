"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Heart, ChevronLeft, ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { API_CONFIG } from "@/lib/config"
import { useCatalog } from "@/contexts/CatalogContext"
import { getImageUrl } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { useCurrency } from "@/hooks/useCurrency"

export default function SubcategoryPage({
  params,
}: {
  params: { category: string; subcategory: string }
}) {
  const auth = useAuth()
  const router = useRouter()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { openCatalog } = useCatalog()
  const { t } = useLanguage()
  const { format, currency, isLoading: isCurrencyLoading } = useCurrency()
  
  // Store formatted prices
  const [formattedProductPrices, setFormattedProductPrices] = useState<Record<string, { price: string; originalPrice?: string }>>({})
  
  const sortOptions = [
    { value: "popular", label: t('search.sortPopular') },
    { value: "newest", label: t('search.sortNewest') },
    { value: "price_asc", label: t('search.sortPriceAsc') },
    { value: "price_desc", label: t('search.sortPriceDesc') },
    { value: "rating", label: t('search.sortRating') },
  ]
  
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
  const [selectedGender, setSelectedGender] = useState<string>('')
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
  const [showColorSelectionModal, setShowColorSelectionModal] = useState(false)
  const [showBrandSelectionModal, setShowBrandSelectionModal] = useState(false)
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
          // Categories API not available, will use data from product API
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
            // Subcategories API not available, will use data from product API
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

  // Format prices when products or currency changes
  useEffect(() => {
    const formatAllPrices = async () => {
      if (!products.length || isCurrencyLoading || !currency) return
      
      const formattedPrices: Record<string, { price: string; originalPrice?: string }> = {}
      await Promise.all(
        products.map(async (product: any) => {
          const productCurrency = product.currency?.code || 'KGS'
          const price = await format(product.price_min || product.price || 0, productCurrency)
          let originalPrice: string | undefined
          if (product.original_price_min || product.original_price) {
            originalPrice = await format(product.original_price_min || product.original_price, productCurrency)
          }
          formattedPrices[product.id] = { price, originalPrice }
        })
      )
      setFormattedProductPrices(formattedPrices)
    }
    
    formatAllPrices()
  }, [products, currency, isCurrencyLoading, format])

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">{t('search.loading')}</p>
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('category.notFound')}</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/">
            <Button className="bg-brand hover:bg-brand-hover text-white">
              {t('common.goToHome')}
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb - Desktop */}
        <div className="hidden md:flex items-center gap-2 mb-4 text-sm">
          <button 
            onClick={openCatalog}
            className="text-gray-600 hover:text-brand cursor-pointer"
          >
            {category?.name || params.category}
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-black">{subcategory?.name || params.subcategory}</span>
        </div>

        {/* Mobile: Back Button with Category Name */}
        <div className="md:hidden flex items-center gap-2 mb-3">
          <button 
            onClick={() => router.back()}
            className="p-1 -ml-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-base font-bold text-black">{category?.name || params.category}</span>
        </div>

        {/* Title and Count */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">{subcategory?.name || t('search.products')} <span className="text-gray-500 font-normal text-lg">{total} {t('category.products')}</span></h1>
        </div>

        {/* Mobile: Simplified Filter Bar - Only 2 buttons */}
        <div className="md:hidden mb-4 flex items-center gap-2 relative">
          {/* Sort Button with X to clear */}
          <div className="relative">
            <button
              onClick={() => {
                if (sortBy !== "popular") {
                  setSortBy("popular")
                  setCurrentPage(1)
                } else {
                  setShowSortDropdown(!showSortDropdown)
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            >
              <span>{sortOptions.find((opt) => opt.value === sortBy)?.label || t('search.sortPopular')}</span>
              {sortBy !== "popular" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSortBy("popular")
                    setCurrentPage(1)
                  }}
                  className="ml-1"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {sortBy === "popular" && (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {showSortDropdown && sortBy === "popular" && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
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
              </>
            )}
          </div>

          {/* All Filters Button */}
          <button 
            onClick={() => setShowAllFiltersModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t('search.allFilters')}
          </button>
        </div>

        {/* Desktop: Full Filter Bar */}
        <div className="hidden md:flex flex-wrap items-center gap-3 mb-6">
          {/* Sort Dropdown - Desktop */}
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

          {/* All Filters Button - Desktop */}
          <button 
            onClick={() => setShowAllFiltersModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t('search.allFilters')}
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
                <span>{category?.name || t('product.male')}</span>
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
                <span>{subcategory?.name || t('search.products')}</span>
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
                <span>{t('search.size')}</span>
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
                <span>{t('search.price')}</span>
                {(priceRange.min || priceRange.max) && (
                  <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    1
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPriceDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[280px]">
                  <h4 className="font-medium mb-3 text-sm">{t('search.price')} ({t('common.currency')})</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('search.from')}
                      value={priceRange.min || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                    />
                    <input
                      type="number"
                      placeholder={t('search.to')}
                      value={priceRange.max || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('search.from')} {Math.floor(filters.price_range.min)} {t('search.to')} {Math.ceil(filters.price_range.max)} {t('common.currency')}
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
                <span>{t('search.color')}</span>
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
                  setSelectedGender('')
                  setCurrentPage(1)
                }}
              className="px-4 py-2 text-brand hover:text-brand-hover text-sm font-medium"
            >
              {t('search.reset')}
                      </button>
                )}
            </div>

        {/* Products Grid (Full Width) */}
            {isLoading && currentPage === 1 ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mr-3"></div>
                <p className="text-gray-600">{t('search.loading')}</p>
              </div>
            ) : products.length > 0 ? (
              <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-1 gap-y-0.5 md:gap-6 mb-8">
                  {products.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.slug || product.id}`} 
                      className="bg-white rounded-md p-1 md:p-2 cursor-pointer hover:shadow-md transition-all block group border border-gray-100"
                    >
                      <div className="relative mb-0.5 md:mb-2">
                    {(product.discount_percentage || product.discount_percent) && (
                          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
                        -{product.discount_percentage || product.discount_percent}%
                          </div>
                        )}
                        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10">
                          <button onClick={(e) => handleWishlistClick(e, product)}>
                            <Heart className={`w-5 h-5 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                          </button>
                        </div>
                        <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100">
                          <img
                            src={getImageUrl(product.main_image || product.image) || "/images/product_placeholder_adobe.png"}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/images/product_placeholder_adobe.png'
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-0">
                        <div className="text-xs text-gray-500 uppercase font-medium leading-tight">
                          {product.brand_name || 'MARQUE'}
                        </div>
                        <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                          {product.title}
                        </h3>
                        <div className="flex items-baseline space-x-2 mt-0.5 md:mt-0">
                      <span className="text-base font-bold text-brand">
                        {formattedProductPrices[product.id]?.price || 
                         (isCurrencyLoading ? `${product.price || product.price_min} ${currency?.symbol || 'сом'}` : 
                          `${product.price || product.price_min} ${currency?.symbol || 'сом'}`)}
                      </span>
                      {formattedProductPrices[product.id]?.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formattedProductPrices[product.id].originalPrice}
                        </span>
                          )}
                        </div>
                        {product.sold_count > 0 && (
                          <div className="text-xs text-gray-500 leading-tight">{t('product.sold')} {product.sold_count}</div>
                        )}
                    {product.in_stock === false && (
                          <div className="text-xs text-red-500">{t('product.outOfStock')}</div>
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
                <p className="text-gray-500 mb-4">{t('search.noProductsFound')}</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedFilters({ sizes: [], colors: [], brands: [] })
                    setPriceRange({})
                    setSelectedGender('')
                    setCurrentPage(1)
                  }}
                >
                  {t('search.resetFilters')}
                </Button>
              </div>
            )}
      </main>

      {/* All Filters Modal */}
      {showAllFiltersModal && (
        <>
          {/* Mobile: Full Screen Overlay */}
          <div className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
            {/* Top Bar with 3 buttons */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <button
                onClick={() => {
                  setSelectedFilters({ sizes: [], colors: [], brands: [] })
                  setPriceRange({})
                  setSelectedGender('')
                  setCurrentPage(1)
                }}
                className="text-sm text-gray-600"
              >
                {t('search.reset')}
              </button>
              <h2 className="text-base font-bold text-black">{t('search.filters')}</h2>
              <button 
                onClick={() => setShowAllFiltersModal(false)}
                className="text-sm text-gray-600"
              >
                {t('common.close')}
              </button>
            </div>

            {/* Mobile Filters Content */}
            <div className="px-4 py-4 space-y-4">
              {/* Size Filter */}
              {filters.available_sizes && filters.available_sizes.length > 0 && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-base font-normal text-black">{t('product.size')}</span>
                    <button className="text-sm text-gray-500">{t('search.showAll')}</button>
                  </div>
                  <div className="overflow-x-auto pb-2 -mx-4 px-4">
                    <div className="flex gap-2 min-w-max">
                      {filters.available_sizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => {
                            const checked = !selectedFilters.sizes?.includes(size)
                            handleFilterChange("sizes", size, checked)
                          }}
                          className={`px-4 py-2 border rounded-lg text-sm whitespace-nowrap ${
                            selectedFilters.sizes?.includes(size)
                              ? 'border-brand bg-brand text-white'
                              : 'border-gray-300 text-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Price Filter */}
              {filters.price_range && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-base font-normal text-black">{t('search.price')}</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder={t('search.from')}
                        value={priceRange.min || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                      />
                      <span className="text-xs text-gray-500 mt-1 block">сом</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder={t('search.to')}
                        value={priceRange.max || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                      />
                      <span className="text-xs text-gray-500 mt-1 block">сом</span>
                    </div>
                  </div>
                </>
              )}

              {/* Gender Filter */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-base font-normal text-black">{t('product.gender')}</span>
              </div>
              <div className="flex gap-2 pb-3 border-b border-gray-100">
                <button
                  onClick={() => setSelectedGender(selectedGender === 'women' ? '' : 'women')}
                  className={`px-4 py-2 border rounded-lg text-sm ${
                    selectedGender === 'women'
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {t('product.forWomen')}
                </button>
                <button
                  onClick={() => setSelectedGender(selectedGender === 'men' ? '' : 'men')}
                  className={`px-4 py-2 border rounded-lg text-sm ${
                    selectedGender === 'men'
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {t('product.forMen')}
                </button>
                <button
                  onClick={() => setSelectedGender(selectedGender === 'boys' ? '' : 'boys')}
                  className={`px-4 py-2 border rounded-lg text-sm ${
                    selectedGender === 'boys'
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-300 text-black'
                  }`}
                >
                  {t('product.forBoys')}
                </button>
              </div>

              {/* Category Filter */}
              {category && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-base font-normal text-black">{t('search.category')}</span>
                  <button 
                    onClick={openCatalog}
                    className="flex items-center gap-1 text-sm text-black"
                  >
                    {category.name} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Subcategory Filter */}
              {subcategory && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-base font-normal text-black">{t('search.subcategory')}</span>
                  <button 
                    onClick={openCatalog}
                    className="flex items-center gap-1 text-sm text-black"
                  >
                    {subcategory.name} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Color Filter */}
              {filters.available_colors && filters.available_colors.length > 0 && (
                <button
                  onClick={() => setShowColorSelectionModal(true)}
                  className="w-full flex items-center justify-between py-3 border-b border-gray-100"
                >
                  <span className="text-base font-normal text-black">Цвет</span>
                  <div className="flex items-center gap-1 text-sm text-black">
                    {selectedFilters.colors && selectedFilters.colors.length > 0 
                      ? `${selectedFilters.colors.length} ${t('search.selected')}`
                      : t('search.all')
                    } <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Brand Filter */}
              {filters.available_brands && filters.available_brands.length > 0 && (
                <button
                  onClick={() => setShowBrandSelectionModal(true)}
                  className="w-full flex items-center justify-between py-3 border-b border-gray-100"
                >
                    <span className="text-base font-normal text-black">{t('search.brand')}</span>
                  <div className="flex items-center gap-1 text-sm text-black">
                    {selectedFilters.brands && selectedFilters.brands.length > 0 
                      ? `${selectedFilters.brands.length} ${t('search.selected')}`
                      : t('search.all')
                    } <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Desktop: Left Sidebar (unchanged) */}
          <div className="hidden md:block">
            {/* Light backdrop - click to close */}
            <div 
              className="fixed inset-0 bg-transparent z-30"
              onClick={() => setShowAllFiltersModal(false)}
            />
            
            {/* Left Sidebar */}
            <div className="fixed inset-y-0 left-0 w-80 bg-white z-40 overflow-y-auto shadow-2xl border-r border-gray-200">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('search.allFilters')}</h2>
                <button 
                  onClick={() => setShowAllFiltersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Desktop Filters Content */}
              <div className="p-6 space-y-6">
              {/* Category Filter - Dynamic from API */}
              {allCategories.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">{t('search.category')}</h3>
                  <div className="space-y-2">
                    <Link 
                      href="/"
                      className="block px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      {t('search.allCategories')}
                    </Link>
                    {allCategories.map((cat) => (
                      <Link 
                        key={cat.slug}
                        href={`/subcategory/${cat.slug}/${params.subcategory}`}
                        className={`block px-4 py-2 rounded-lg ${category?.slug === cat.slug ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategory Filter - Dynamic from API */}
              {allSubcategories.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">{t('search.subcategory')}</h3>
                  <div className="space-y-2">
                    <Link 
                      href={`/subcategory/${category?.slug || params.category}`}
                      className="block px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      {t('search.allSubcategories')}
                    </Link>
                    {allSubcategories.map((subcat: any) => (
                      <Link 
                        key={subcat.slug}
                        href={`/subcategory/${category?.slug || params.category}/${subcat.slug}`}
                        className={`block px-4 py-2 rounded-lg ${subcategory?.slug === subcat.slug ? 'bg-brand text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        {subcat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Filter */}
              {filters.available_brands && filters.available_brands.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">{t('search.brand')}</h3>
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
                  <h3 className="font-medium mb-3">{t('search.price')} ({t('common.currency')})</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('search.from')}
                      value={priceRange.min || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                    />
                    <input
                      type="number"
                      placeholder={t('search.to')}
                      value={priceRange.max || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('search.from')} {Math.floor(filters.price_range.min)} {t('search.to')} {Math.ceil(filters.price_range.max)} {t('common.currency')}
                  </p>
                </div>
              )}

              {/* Size Filter */}
              {filters.available_sizes && filters.available_sizes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">{t('product.size')}</h3>
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
                  <h3 className="font-medium mb-3">{t('product.color')}</h3>
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

              {/* Desktop Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedFilters({ sizes: [], colors: [], brands: [] })
                    setPriceRange({})
                    setSelectedGender('')
                    setCurrentPage(1)
                  }}
                >
                  {t('search.reset')}
                </Button>
                <Button
                  className="flex-1 bg-brand hover:bg-brand-hover text-white"
                  onClick={() => setShowAllFiltersModal(false)}
                >
                  {t('search.apply')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Color Selection Modal - Mobile */}
      {showColorSelectionModal && (
        <div className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
            <button
              onClick={() => {
                setSelectedFilters(prev => ({ ...prev, colors: [] }))
              }}
              className="text-sm text-gray-600"
            >
              {t('search.reset')}
            </button>
            <h2 className="text-base font-bold text-black">{t('product.color')}</h2>
            <button 
              onClick={() => setShowColorSelectionModal(false)}
              className="text-sm text-gray-600"
            >
              {t('common.close')}
            </button>
          </div>

          {/* Color Options */}
          <div className="px-4 py-4">
            {filters.available_colors && filters.available_colors.length > 0 ? (
              <div className="space-y-2">
                {filters.available_colors.map((color: string) => (
                  <label 
                    key={color} 
                    className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer"
                  >
                    <span className="text-base text-black capitalize">{color}</span>
                    <Checkbox 
                      checked={selectedFilters.colors?.includes(color)}
                      onCheckedChange={(checked) => handleFilterChange("colors", color, checked as boolean)} 
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">{t('search.noColorsAvailable')}</div>
            )}
          </div>
        </div>
      )}

      {/* Brand Selection Modal - Mobile */}
      {showBrandSelectionModal && (
        <div className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
            <button
              onClick={() => {
                setSelectedFilters(prev => ({ ...prev, brands: [] }))
              }}
              className="text-sm text-gray-600"
            >
              {t('search.reset')}
            </button>
            <h2 className="text-base font-bold text-black">{t('search.brand')}</h2>
            <button 
              onClick={() => setShowBrandSelectionModal(false)}
              className="text-sm text-gray-600"
            >
              {t('common.close')}
            </button>
          </div>

          {/* Brand Options */}
          <div className="px-4 py-4">
            {filters.available_brands && filters.available_brands.length > 0 ? (
              <div className="space-y-2">
                {filters.available_brands.map((brand: any) => (
                  <label 
                    key={brand.slug} 
                    className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer"
                  >
                    <span className="text-base text-black">{brand.name}</span>
                    <Checkbox 
                      checked={selectedFilters.brands?.includes(brand.slug)}
                      onCheckedChange={(checked) => handleFilterChange("brands", brand.slug, checked as boolean)} 
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">{t('search.noBrandsAvailable')}</div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6">MARQUE</h3>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 mb-4">{t('footer.popularCategories')}</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>{t('footer.men')}</div>
                  <div>{t('footer.women')}</div>
                  <div>{t('footer.kids')}</div>
                  <div>{t('footer.sport')}</div>
                  <div>{t('footer.shoes')}</div>
                  <div>{t('footer.accessories')}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-4">{t('footer.brands')}</h4>
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
            <div>{t('footer.privacyPolicy')}</div>
            <div>{t('footer.termsOfUse')}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
