"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Heart, X, Package, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  const clearFilters = () => {
    setSelectedFilters({ sizes: [], colors: [], brands: [] })
    setSelectedCategory('')
    setSelectedSubcategory('')
    setPriceRange({})
    setCurrentPage(1)
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
      
      {/* Store Profile Section */}
      {store && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
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
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {/* Sort by Popularity */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg border ${
                  sortBy !== 'popular' ? 'border-brand' : 'border-gray-300'
                } text-sm font-medium whitespace-nowrap`}
              >
                {hasActiveFilters && <X className="w-4 h-4" />}
                {sortOptions.find(opt => opt.value === sortBy)?.label || t('search.sortPopular')}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortDropdown(false)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        sortBy === option.value ? 'bg-brand/10 text-brand' : ''
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
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300 text-sm font-medium whitespace-nowrap"
            >
              <span>=</span>
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
                  onClick={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg border ${
                    selectedSubcategory ? 'border-brand' : 'border-gray-300'
                  } text-sm font-medium whitespace-nowrap`}
                >
                  {selectedSubcategory || t('store.subcategory')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSubcategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showSubcategoryDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedSubcategory('')
                        setShowSubcategoryDropdown(false)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        !selectedSubcategory ? 'bg-brand/10 text-brand' : ''
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
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                          selectedSubcategory === subcat.slug ? 'bg-brand/10 text-brand' : ''
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
                  onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg border ${
                    selectedFilters.sizes.length > 0 ? 'border-brand' : 'border-gray-300'
                  } text-sm font-medium whitespace-nowrap`}
                >
                  {t('store.size')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSizeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showSizeDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px] max-h-60 overflow-y-auto p-2">
                    <div className="flex flex-wrap gap-2">
                      {filters.sizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => toggleFilter('sizes', size)}
                          className={`px-3 py-1 rounded border ${
                            selectedFilters.sizes.includes(size)
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-gray-300'
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

            {/* Price Filter */}
            <div className="relative">
              <button
                onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg border ${
                  priceRange.min !== undefined || priceRange.max !== undefined ? 'border-brand' : 'border-gray-300'
                } text-sm font-medium whitespace-nowrap`}
              >
                {t('store.price')}
                <ChevronDown className={`w-4 h-4 transition-transform ${showPriceDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showPriceDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4 min-w-[300px]">
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
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 bg-white rounded-lg border ${
                    selectedFilters.colors.length > 0 ? 'border-brand' : 'border-gray-300'
                  } text-sm font-medium whitespace-nowrap`}
                >
                  {t('store.color')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showColorDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showColorDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px] max-h-60 overflow-y-auto p-2">
                    <div className="flex flex-wrap gap-2">
                      {filters.colors.map((color: any) => (
                        <button
                          key={color.name}
                          onClick={() => toggleFilter('colors', color.name)}
                          className={`px-3 py-1 rounded border ${
                            selectedFilters.colors.includes(color.name)
                              ? 'border-brand bg-brand/10 text-brand'
                              : 'border-gray-300'
                          }`}
                        >
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('store.noProducts')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-square bg-white rounded-t-lg overflow-hidden">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {product.discount}%
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        if (isInWishlist(product.id.toString())) {
                          removeFromWishlist(product.id.toString())
                        } else {
                          addToWishlist(product.id.toString())
                        }
                      }}
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                    </button>
                  </div>
                  <div className="p-3 bg-white rounded-b-lg">
                    <p className="text-xs text-gray-500 mb-1">{product.brand?.name || 'MARQUE'}</p>
                    <h3 className="text-sm font-medium text-black mb-2 line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-brand">
                        {isCurrencyLoading ? '...' : format(product.price_min)}
                      </span>
                      {product.original_price_min && product.original_price_min > product.price_min && (
                        <span className="text-sm text-gray-400 line-through">
                          {isCurrencyLoading ? '...' : format(product.original_price_min)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t('product.sold')} {product.sold_count || 0}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {total > itemsPerPage && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  {t('common.page')} {currentPage} {t('common.of')} {Math.ceil(total / itemsPerPage)}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasMore}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

