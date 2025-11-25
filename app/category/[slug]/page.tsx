"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { categoriesApi, productsApi } from "@/lib/api"
import { getImageUrl } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { useCurrency } from "@/hooks/useCurrency"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const auth = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { t } = useLanguage()
  const { format, currency, isLoading: isCurrencyLoading } = useCurrency()
  
  // Store formatted prices
  const [formattedProductPrices, setFormattedProductPrices] = useState<Record<string, { price: string; originalPrice?: string }>>({})
  
  const [category, setCategory] = useState<any>(null)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load category data from API
  useEffect(() => {
    const loadCategory = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Try to load category details, but fallback gracefully if it fails
        try {
          const categoryData = await categoriesApi.getDetail(params.slug)
          setCategory(categoryData.category)
          setSubcategories(categoryData.subcategories || [])
        } catch (categoryErr) {
          console.error('Failed to load category details:', categoryErr)
          // Fallback: create a basic category object
          setCategory({
            id: params.slug,
            name: params.slug === 'men' ? 'Мужчинам' : params.slug,
            slug: params.slug
          })
          // Fallback: load subcategories from categories API
          try {
            const categoriesData = await categoriesApi.getAll()
            const matchingCategory = categoriesData.categories?.find((cat: any) => cat.slug === params.slug)
            if (matchingCategory) {
              setCategory(matchingCategory)
              // Try to get subcategories
              const subcatsData = await categoriesApi.getSubcategories(params.slug)
              setSubcategories(subcatsData.subcategories || [])
            }
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr)
            // Set basic info so page doesn't crash
            setCategory({
              id: params.slug,
              name: params.slug === 'men' ? 'Мужчинам' : params.slug,
              slug: params.slug
            })
          }
        }
        
        // Load recommended products (best sellers from any category)
        const products = await productsApi.getBestSellers(8)
        setRecommendedProducts(products)
      } catch (err: any) {
        console.error('Failed to load category:', err)
        setError(err.message || 'Failed to load category')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (params.slug) {
      loadCategory()
    }
  }, [params.slug])

  // Format prices when products or currency changes
  useEffect(() => {
    const formatAllPrices = async () => {
      if (!recommendedProducts.length || isCurrencyLoading || !currency) return
      
      const formattedPrices: Record<string, { price: string; originalPrice?: string }> = {}
      await Promise.all(
        recommendedProducts.map(async (product: any) => {
          const productCurrency = product.currency?.code || 'KGS'
          const price = await format(product.price_min || product.price || 0, productCurrency)
          let originalPrice: string | undefined
          if (product.original_price_min) {
            originalPrice = await format(product.original_price_min, productCurrency)
          }
          formattedPrices[product.id] = { price, originalPrice }
        })
      )
      setFormattedProductPrices(formattedPrices)
    }
    
    formatAllPrices()
  }, [recommendedProducts, currency, isCurrencyLoading, format])

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
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">{t('category.loading')}</p>
          </div>
        </main>
      </div>
    )
  }
  
  // Error state
  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('category.notFound')}</h1>
          <p className="text-gray-600 mb-8">{error || t('category.notExists')}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-gray-600 hover:text-brand">
            {t('product.home')}
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-black">{category.name}</span>
        </div>

        {/* Subcategories Grid */}
        {subcategories && subcategories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/subcategory/${params.slug}/${subcategory.slug}`}
                className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow group flex items-center gap-4"
              >
                <img
                  src={getImageUrl(subcategory.image_url) || "/images/product_placeholder_adobe.png"}
                  alt={subcategory.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "/images/product_placeholder_adobe.png"
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-black group-hover:text-brand">{subcategory.name}</h3>
                  <p className="text-gray-500 text-sm">{subcategory.product_count} {t('category.products')}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('catalog.noSubcategories')}</p>
          </div>
        )}

        {/* Recommended Products */}
        {recommendedProducts && recommendedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">{t('category.recommended')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.slug || product.id}`} 
                  className="bg-white rounded-md p-2 cursor-pointer hover:shadow-md transition-all block group border border-gray-100"
                >
                  <div className="relative mb-2">
                    <div className="absolute top-2 right-2 z-10">
                      <button onClick={(e) => handleWishlistClick(e, product)}>
                        <Heart className={`w-5 h-5 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={getImageUrl(product.image) || "/images/product_placeholder_adobe.png"}
                        alt={product.title || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/images/product_placeholder_adobe.png"
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-500 uppercase font-medium">
                      {product.brand_name || product.brand || 'MARQUE'}
                    </div>
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight mb-1">
                      {product.title || product.name}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">
                        {formattedProductPrices[product.id]?.price || 
                         (isCurrencyLoading ? `${product.price_min || product.price} ${currency?.symbol || 'сом'}` : 
                          `${product.price_min || product.price} ${currency?.symbol || 'сом'}`)}
                      </span>
                      {formattedProductPrices[product.id]?.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formattedProductPrices[product.id].originalPrice}
                        </span>
                      )}
                    </div>
                    {product.sold_count !== undefined && (
                      <div className="text-xs text-gray-500">{t('product.sold')} {product.sold_count}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
