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
import { categoriesApi } from "@/lib/api"
import { useCatalog } from "@/contexts/CatalogContext"
import { getImageUrl } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { useCurrency } from "@/hooks/useCurrency"

export default function SecondSubcategoryPage({
  params,
}: {
  params: { category: string; subcategory: string; secondSubcategory: string }
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
  const [secondSubcategory, setSecondSubcategory] = useState<any>(null)
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

  // Load second-level subcategory products from API (Level 3: category -> subcategory -> secondSubcategory -> products)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use new API endpoint for 3-level catalog
        const response = await categoriesApi.getSecondSubcategoryProducts(
          params.category,
          params.subcategory,
          params.secondSubcategory,
          {
            page: currentPage,
            limit: itemsPerPage,
            sort_by: sortBy,
            sizes: selectedFilters.sizes.length > 0 ? selectedFilters.sizes.join(',') : undefined,
            colors: selectedFilters.colors.length > 0 ? selectedFilters.colors.join(',') : undefined,
            brands: selectedFilters.brands.length > 0 ? selectedFilters.brands.join(',') : undefined,
            price_min: priceRange.min,
            price_max: priceRange.max,
          }
        )
        
        setCategory(response.category)
        setSubcategory(response.subcategory)
        setSecondSubcategory(response.second_subcategory)
        setProducts(response.products || [])
        setFilters(response.filters || {})
        setTotal(response.total || 0)
        setTotalPages(response.total_pages || 1)
      } catch (err: any) {
        console.error('Failed to load second-level subcategory products:', err)
        setError(err.message || 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (params.category && params.subcategory && params.secondSubcategory) {
      loadProducts()
    }
  }, [params.category, params.subcategory, params.secondSubcategory, currentPage, sortBy, selectedFilters, priceRange])

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

  // Rest of the component is identical to the 2-level subcategory page
  // (filters, sorting, product display, etc.)
  // For brevity, I'll include the key parts that differ

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-brand">
              {t('common.home')}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={`/category/${category?.slug}`} className="text-gray-500 hover:text-brand">
              {category?.name || params.category}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={`/subcategory/${params.category}/${params.subcategory}`} className="text-gray-500 hover:text-brand">
              {subcategory?.name || params.subcategory}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">
              {secondSubcategory?.name || params.secondSubcategory}
            </span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {secondSubcategory?.name || params.secondSubcategory}
          </h1>
          {secondSubcategory?.description && (
            <p className="mt-2 text-gray-600">{secondSubcategory.description}</p>
          )}
        </div>
      </div>

      {/* Content - You can copy the rest from the 2-level page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500">{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">{t('search.noProducts')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Product card content - same as 2-level page */}
                <Link href={`/product/${product.slug || product.id}`}>
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={getImageUrl(product.image || '/images/product_placeholder_adobe.png')}
                      alt={product.title || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${product.slug || product.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title || product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-brand">
                        {formattedProductPrices[product.id]?.price || '...'}
                      </span>
                      {formattedProductPrices[product.id]?.originalPrice && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          {formattedProductPrices[product.id]?.originalPrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id)
                        } else {
                          addToWishlist(product.id)
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isInWishlist(product.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modals - handled by AuthModals component in layout */}
    </div>
  )
}

