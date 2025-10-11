"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/Header"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { categoriesApi, productsApi } from "@/lib/api"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const auth = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  
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
        
        const categoryData = await categoriesApi.getDetail(params.slug)
        setCategory(categoryData.category)
        setSubcategories(categoryData.subcategories || [])
        
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <Header />
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">Загружаем категорию...</p>
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <Header />
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Категория не найдена</h1>
          <p className="text-gray-600 mb-8">{error || 'Запрошенная категория не существует'}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-gray-600 hover:text-brand">
            Главная
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
                  src={subcategory.image_url || "/images/black-tshirt.jpg"}
                  alt={subcategory.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-black group-hover:text-brand">{subcategory.name}</h3>
                  <p className="text-gray-500 text-sm">{subcategory.product_count} товаров</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Подкатегории не найдены</p>
          </div>
        )}

        {/* Recommended Products */}
        {recommendedProducts && recommendedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Рекомендуем из этой категории</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.map((product) => (
                <Link 
                  key={product.id} 
                  href={`/product/${product.slug || product.id}`} 
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group"
                >
                  <div className="relative mb-3">
                    <div className="absolute top-2 right-2 z-10">
                      <button onClick={(e) => handleWishlistClick(e, product)} className="p-1.5 bg-gray-100/80 rounded-full">
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={product.image || "/images/black-tshirt.jpg"}
                        alt={product.title || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 uppercase font-medium">
                      {product.brand_name || product.brand || 'MARQUE'}
                    </div>
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                      {product.title || product.name}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">
                        {product.price_min || product.price} сом
                      </span>
                      {product.original_price_min && (
                        <span className="text-xs text-gray-400 line-through">
                          {product.original_price_min} сом
                        </span>
                      )}
                    </div>
                    {product.sold_count !== undefined && (
                      <div className="text-xs text-gray-500">Продано {product.sold_count}</div>
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
