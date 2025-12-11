"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Heart, X, Package, Star, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { storesApi } from "@/lib/api"
import { getImageUrl } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { useCurrency } from "@/hooks/useCurrency"
import { toast } from "sonner"

export default function StorePage({
  params,
}: {
  params: { slug: string }
}) {
  const auth = useAuth()
  const router = useRouter()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { t } = useLanguage()
  const { format, currency, isLoading: isCurrencyLoading } = useCurrency()
  
  // Store formatted prices
  const [formattedProductPrices, setFormattedProductPrices] = useState<Record<string, { price: string; originalPrice?: string }>>({})
  
  // Store data
  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [filters, setFilters] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowingStore, setIsFollowingStore] = useState(false)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  
  // Filter & Sort State
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    sizes: [],
    colors: [],
    brands: [],
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({})
  const [sortBy, setSortBy] = useState("popular")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  
  // UI State
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showSizeDropdown, setShowSizeDropdown] = useState(false)
  const [showPriceDropdown, setShowPriceDropdown] = useState(false)
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false)
  const [showAllFiltersModal, setShowAllFiltersModal] = useState(false)
  
  const itemsPerPage = 20

  const sortOptions = [
    { value: "popular", label: t('search.sortPopular') },
    { value: "newest", label: t('search.sortNewest') },
    { value: "price_asc", label: t('search.sortPriceAsc') },
    { value: "price_desc", label: t('search.sortPriceDesc') },
    { value: "rating", label: t('search.sortRating') },
  ]

  // Load store detail
  useEffect(() => {
    const loadStore = async () => {
      try {
        const response = await storesApi.getStoreDetail(params.slug)
        if (response.success && response.store) {
          setStore(response.store)
          setIsFollowingStore(response.store.is_following || false)
        }
      } catch (err: any) {
        console.error('Failed to load store:', err)
        setError(err.message || 'Failed to load store')
      }
    }
    loadStore()
  }, [params.slug])

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        const offset = (currentPage - 1) * itemsPerPage
        const params_obj: any = {
          limit: itemsPerPage,
          offset,
          sort_by: sortBy,
        }

        if (selectedCategory) params_obj.category = selectedCategory
        if (selectedSubcategory) params_obj.subcategory = selectedSubcategory
        if (selectedFilters.sizes.length > 0) params_obj.sizes = selectedFilters.sizes.join(',')
        if (selectedFilters.colors.length > 0) params_obj.colors = selectedFilters.colors.join(',')
        if (selectedFilters.brands.length > 0) params_obj.brands = selectedFilters.brands.join(',')
        if (priceRange.min !== undefined) params_obj.price_min = priceRange.min
        if (priceRange.max !== undefined) params_obj.price_max = priceRange.max

        const response = await storesApi.getStoreProducts(params.slug, params_obj)
        if (response.success) {
          setProducts(response.products || [])
          setTotal(response.total || 0)
          setHasMore(response.has_more || false)
          const calculatedTotalPages = Math.ceil((response.total || 0) / itemsPerPage)
          setTotalPages(calculatedTotalPages)
          if (response.filters) {
            setFilters(response.filters)
          }
        }
      } catch (err: any) {
        console.error('Failed to load products:', err)
        setError(err.message || 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [params.slug, currentPage, sortBy, selectedCategory, selectedSubcategory, selectedFilters, priceRange])

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!auth.isLoggedIn) {
      auth.requireAuth()
      return
    }

    setIsTogglingFollow(true)
    try {
      const response = await storesApi.toggleFollow(params.slug)
      if (response.success) {
        setIsFollowingStore(response.is_following)
        toast.success(response.is_following ? t('store.followed') : t('store.unfollowed'))
      }
    } catch (err: any) {
      console.error('Failed to toggle follow:', err)
      toast.error(t('store.followError'))
    } finally {
      setIsTogglingFollow(false)
    }
  }

  // Handle filter changes
  const toggleFilter = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[filterType] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [filterType]: updated }
    })
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: checked
        ? [...(prev[filterType] || []), value]
        : (prev[filterType] || []).filter((v) => v !== value),
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedFilters({ sizes: [], colors: [], brands: [] })
    setSelectedCategory('')
    setSelectedSubcategory('')
    setPriceRange({})
    setCurrentPage(1)
  }

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowSortDropdown(false)
    setShowSizeDropdown(false)
    setShowPriceDropdown(false)
    setShowColorDropdown(false)
    setShowCategoryDropdown(false)
    setShowSubcategoryDropdown(false)
  }

  const handleWishlistClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    auth.requireAuth(() => {
      const productId = product.id.toString()
      if (isInWishlist(productId)) {
        removeFromWishlist(productId)
      } else {
        addToWishlist(productId)
      }
    })
  }

  const hasActiveFilters = 
    selectedFilters.sizes.length > 0 ||
    selectedFilters.colors.length > 0 ||
    selectedFilters.brands.length > 0 ||
    selectedCategory ||
    selectedSubcategory ||
    priceRange.min !== undefined ||
    priceRange.max !== undefined

  if (error && !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      
      {/* Store Page Container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 lg:pt-6">
        {/* Store Profile Section */}
        {store && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 lg:px-8 py-4 lg:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              {/* Left: Logo and Name */}
              <div className="flex items-center gap-4">
                {/* Store Logo - Match design size */}
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  {store.logo || store.logo_url ? (
                    <img
                      src={getImageUrl(store.logo || store.logo_url)}
                      alt={store.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/product_placeholder_adobe.png"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand/10">
                      <span className="text-brand font-bold text-2xl">
                        {store.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Store Name and Label */}
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-black mb-2">{store.name}</h1>
                  <p className="inline-block px-2 py-0.5 text-xs text-gray-600 border border-gray-300 rounded">{t('store.store')}</p>
                </div>
              </div>

              {/* Right: Stats and Follow Button */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8">
                {/* Stats */}
                <div className="flex items-center gap-4 lg:gap-6">
                  {/* Rating */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-lg font-semibold text-gray-900">
                        {Number(store.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 text-center">
                      {store.reviews_count || 0} {t('store.reviews')}
                    </span>
                  </div>

                  {/* Orders */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Package className="w-5 h-5 text-gray-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {store.orders_count || 0}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 text-center">{t('store.orders')}</span>
                  </div>

                  {/* Likes */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Heart className="w-5 h-5 text-gray-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {store.likes_count || 0}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 text-center">{t('store.likes')}</span>
                  </div>
                </div>

                {/* Follow Button */}
                <Button
                  onClick={handleFollow}
                  disabled={isTogglingFollow}
                  className="bg-brand hover:bg-brand-hover text-white px-6 py-2"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFollowingStore ? 'fill-current' : ''}`} />
                  {isTogglingFollow ? t('store.loading') : isFollowingStore ? t('store.unfollow') : t('store.follow')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="py-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  if (showSortDropdown) {
                    setShowSortDropdown(false)
                  } else {
                    closeAllDropdowns()
                    setShowSortDropdown(true)
                  }
                }}
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
              onClick={() => {
                closeAllDropdowns()
                setShowAllFiltersModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {t('store.allFilters')}
            </button>

            {/* Category Filter */}
            {filters.categories && filters.categories.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg border ${
                    selectedCategory ? 'border-brand' : 'border-gray-300'
                  } text-sm font-medium whitespace-nowrap`}
                >
                  {selectedCategory || t('store.category')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedCategory('')
                        setShowCategoryDropdown(false)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        !selectedCategory ? 'bg-brand/10 text-brand' : ''
                      }`}
                    >
                      {t('store.allCategories')}
                    </button>
                    {filters.categories.map((cat: any) => (
                      <button
                        key={cat.slug}
                        onClick={() => {
                          setSelectedCategory(cat.slug)
                          setShowCategoryDropdown(false)
                          setCurrentPage(1)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                          selectedCategory === cat.slug ? 'bg-brand/10 text-brand' : ''
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subcategory Filter */}
            {filters.subcategories && filters.subcategories.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (showSubcategoryDropdown) {
                      setShowSubcategoryDropdown(false)
                    } else {
                      closeAllDropdowns()
                      setShowSubcategoryDropdown(true)
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm ${
                    selectedSubcategory ? 'border-brand' : ''
                  }`}
                >
                  <span>{selectedSubcategory || t('store.subcategory')}</span>
                  {selectedSubcategory && (
                    <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      1
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSubcategoryDropdown && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedSubcategory('')
                        setShowSubcategoryDropdown(false)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-lg text-sm ${
                        !selectedSubcategory ? 'bg-gray-50 text-brand font-medium' : ''
                      }`}
                    >
                      {t('store.allSubcategories')}
                    </button>
                    {filters.subcategories.map((subcat: any) => (
                      <button
                        key={subcat.slug}
                        onClick={() => {
                          setSelectedSubcategory(subcat.slug)
                          setShowSubcategoryDropdown(false)
                          setCurrentPage(1)
                        }}
                        className={`block w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm ${
                          selectedSubcategory === subcat.slug ? 'bg-gray-50 text-brand font-medium' : ''
                        }`}
                      >
                        {subcat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Size Filter */}
            {filters.sizes && filters.sizes.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (showSizeDropdown) {
                      setShowSizeDropdown(false)
                    } else {
                      closeAllDropdowns()
                      setShowSizeDropdown(true)
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm ${
                    selectedFilters.sizes.length > 0 ? 'border-brand' : ''
                  }`}
                >
                  <span>{t('store.size')}</span>
                  {selectedFilters.sizes && selectedFilters.sizes.length > 0 && (
                    <span className="bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {selectedFilters.sizes.length}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSizeDropdown && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[220px]">
                    <div className="space-y-2">
                      {filters.sizes.map((size: string) => (
                        <label 
                          key={size} 
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => {
                            setTimeout(() => setShowSizeDropdown(false), 200)
                          }}
                        >
                          <Checkbox 
                            checked={selectedFilters.sizes?.includes(size)}
                            onCheckedChange={(checked) => handleFilterChange("sizes", size, checked as boolean)} 
                          />
                          <span className="text-sm">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  if (showPriceDropdown) {
                    setShowPriceDropdown(false)
                  } else {
                    closeAllDropdowns()
                    setShowPriceDropdown(true)
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm ${
                  priceRange.min !== undefined || priceRange.max !== undefined ? 'border-brand' : ''
                }`}
              >
                <span>{t('store.price')}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPriceDropdown && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[300px]">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('store.minPrice')}
                      value={priceRange.min || ''}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : undefined }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      placeholder={t('store.maxPrice')}
                      value={priceRange.max || ''}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : undefined }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setShowPriceDropdown(false)
                      setCurrentPage(1)
                    }}
                    className="w-full mt-2"
                  >
                    {t('store.apply')}
                  </Button>
                </div>
              )}
            </div>

            {/* Color Filter */}
            {filters.colors && filters.colors.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (showColorDropdown) {
                      setShowColorDropdown(false)
                    } else {
                      closeAllDropdowns()
                      setShowColorDropdown(true)
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-brand text-sm ${
                    selectedFilters.colors.length > 0 ? 'border-brand' : ''
                  }`}
                >
                  <span>{t('store.color')}</span>
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
                      {filters.colors.map((color: any) => (
                        <label 
                          key={color.name} 
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          onClick={() => {
                            setTimeout(() => setShowColorDropdown(false), 200)
                          }}
                        >
                          <Checkbox 
                            checked={selectedFilters.colors?.includes(color.name)}
                            onCheckedChange={(checked) => handleFilterChange("colors", color.name, checked as boolean)} 
                          />
                          <span className="text-sm capitalize">{color.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-brand hover:text-brand-hover text-sm font-medium"
            >
              {t('search.reset')}
            </button>
          )}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading && currentPage === 1 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mr-3"></div>
            <p className="text-gray-600">{t('search.loading')}</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-1 gap-y-0.5 md:gap-4 mb-8">
              {products.map((product, i) => (
                <Link
                  key={`${product.id}-${i}`}
                  href={`/product/${product.slug || product.id}`}
                  className="bg-white rounded-md p-1 md:p-2 cursor-pointer hover:shadow-md transition-all block group border border-gray-100"
                >
                  {/* Discount Badge */}
                  <div className="relative mb-0.5 md:mb-2">
                    {product.discount_percent && (
                      <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
                        -{product.discount_percent}%
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10">
                      <button onClick={(e) => handleWishlistClick(e, product)}>
                        <Heart className={`w-5 h-5 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={
                          product.images && product.images.length > 0 && product.images[0].url
                            ? getImageUrl(product.images[0].url)
                            : product.image && product.image.trim() !== ''
                            ? getImageUrl(product.image)
                            : '/images/product_placeholder_adobe.png'
                        }
                        alt={product.title || product.name || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/images/product_placeholder_adobe.png"
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="space-y-0">
                    <div className="text-xs text-gray-500 uppercase font-medium leading-tight">
                      {product.brand_name || product.brand?.name || product.brand || 'MARQUE'}
                    </div>
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                      {product.title || product.name}
                    </h3>
                    
                    {/* Price */}
                    <div className="flex items-baseline space-x-2 mt-0.5 md:mt-0">
                      <span className="text-base font-bold text-brand">
                        {(product.price_min || product.price) > 0 
                          ? (formattedProductPrices[product.id]?.price || 
                             (isCurrencyLoading ? `${product.price_min || product.price} ${currency?.symbol || 'сом'}` : 
                              `${product.price_min || product.price} ${currency?.symbol || 'сом'}`))
                          : t('product.priceOnRequest')
                        }
                      </span>
                      {product.original_price_min && formattedProductPrices[product.id]?.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formattedProductPrices[product.id].originalPrice}
                        </span>
                      )}
                    </div>
                    
                    {/* Sales Count */}
                    {product.sold_count && (
                      <div className="text-xs text-gray-500 leading-tight">{t('product.sold')} {product.sold_count}</div>
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
            <p className="text-gray-500 mb-4">{t('store.noProducts')}</p>
            <Button 
              variant="outline"
              onClick={clearFilters}
            >
              {t('search.resetFilters')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

