"use client"
import { useState, useEffect } from "react"
import { Star, ArrowRight, Check, Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { productsApi } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { useCart } from "@/hooks/useCart"
import { Header } from "@/components/Header"
import { toast } from "@/lib/toast"
import { useCatalog } from "@/contexts/CatalogContext"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const auth = useAuth()
  const { isLoggedIn } = auth
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItemCount } = useWishlist()
  const { addToCart, cartItemCount } = useCart()
  const { openCatalog } = useCatalog()
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  
  // API state
  const [product, setProduct] = useState<any>(null)
  const [similarProducts, setSimilarProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load product data from API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get product slug from params (could be slug or id)
        const slug = params.id as string
        
        const productData = await productsApi.getDetail(slug)
        setProduct(productData)
        
        // Set similar products
        if (productData.similar_products) {
          setSimilarProducts(productData.similar_products)
        }
        
        // Set default size and color
        if (productData.available_sizes && productData.available_sizes.length > 0) {
          setSelectedSize(productData.available_sizes[0])
        }
        if (productData.available_colors && productData.available_colors.length > 0) {
          setSelectedColor(productData.available_colors[0])
        }
      } catch (err: any) {
        console.error('Failed to load product:', err)
        setError(err.message || 'Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (params.id) {
      loadProduct()
    }
  }, [params.id])

  // Load client state on component mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleAddToCart = async () => {
    // Validate size and color selection
    if (!selectedSize) {
      toast.error('Пожалуйста, выберите размер')
      return
    }
    if (!selectedColor) {
      toast.error('Пожалуйста, выберите цвет')
      return
    }
    
    setIsAddingToCart(true)
    
    try {
      // Prepare cart item
      const cartItem = {
        id: product.id,
        name: product.title,
        price: product.price_min,
        originalPrice: product.original_price_min,
        brand: product.brand?.name || 'MARQUE',
        image: product.images?.[0]?.url || '/images/black-tshirt.jpg',
        size: selectedSize,
        color: selectedColor,
        sku_id: product.selected_sku_id // You might need to determine this based on size/color
      }
      
      // Add to cart using the hook
      await addToCart(cartItem)
      
      // Show success state
      setIsAddedToCart(true)
      
      // Reset success state after 2 seconds
      setTimeout(() => setIsAddedToCart(false), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleCompare = () => {
    console.log("Added to compare:", product.id)
  }

  const handleWishlist = () => {
    auth.requireAuth(() => {
      const productId = product.id as string
      if (isInWishlist(productId)) {
        removeFromWishlist(productId)
      } else {
        addToWishlist(product as any)
      }
    })
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
    setTimeout(() => setShowSearchSuggestions(false), 200)
  }

  // New handler for header login button
  const handleHeaderLoginClick = () => {
    auth.requireAuth(() => {
      router.push('/profile')
    })
  }

  const handleGoToCart = () => {
    router.push('/cart')
  }

  if (!isClient) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <Header />
        </header>
        <main className="max-w-7xl mx-auto lg:px-8 py-20">
          <div className="flex items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">Загружаем товар...</p>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <Header />
        </header>
        <main className="max-w-7xl mx-auto lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Товар не найден</h1>
          <p className="text-gray-600 mb-8">{error || 'Запрошенный товар не существует'}</p>
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
      {/* The full header is now managed by the Header component */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Header />
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto lg:px-8 py-4 lg:py-8">
        {/* Breadcrumb - Hidden on Mobile */}
        <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 mb-8 px-4">
          <Link href="/" className="hover:text-brand">
            Главная
          </Link>
          {/* Category Link - Opens Catalog Sidebar */}
          {product.category && (
            <>
              <span>›</span>
              <button 
                onClick={openCatalog}
                className="hover:text-brand cursor-pointer"
              >
                {product.category.name}
              </button>
            </>
          )}
          {/* Subcategory Link - Goes to Product Listing */}
          {product.subcategory && (
            <>
              <span>›</span>
              <Link 
                href={`/subcategory/${product.category?.slug || 'men'}/${product.subcategory.slug}`} 
                className="hover:text-brand"
              >
                {product.subcategory.name}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="text-gray-900">{product.title}</span>
        </nav>

        {/* Product Section */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image Carousel - Mobile */}
            <div className="lg:hidden relative">
              <div className="aspect-square bg-white overflow-hidden">
                <img
                  src={product.images?.[selectedImageIndex]?.url || "/images/black-tshirt.jpg"}
                  alt={product.images?.[selectedImageIndex]?.alt_text || product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {product.images.map((_: any, index: number) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full ${selectedImageIndex === index ? 'bg-brand' : 'bg-gray-300'}`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
              <button 
                onClick={handleWishlist}
                className="absolute top-4 right-4 p-2 bg-white/80 rounded-full"
              >
                <Heart className={`w-6 h-6 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
              </button>
            </div>
            
            {/* Main Image - Desktop */}
            <div className="hidden lg:block aspect-square bg-white rounded-lg overflow-hidden">
              <img
                src={product.images?.[selectedImageIndex]?.url || "/images/black-tshirt.jpg"}
                alt={product.images?.[selectedImageIndex]?.alt_text || product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images - Desktop */}
            {product.images && product.images.length > 1 && (
              <div className="hidden lg:flex space-x-2 px-4 lg:px-0">
                {product.images.map((image: any, index: number) => (
                  <button
                    key={image.id || index}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? "border-brand" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image.url || "/images/black-tshirt.jpg"}
                      alt={image.alt_text || `${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 px-4 lg:px-0 mt-4 lg:mt-0">
            <div>
              <p className="text-sm text-gray-500">{product.brand?.name || 'MARQUE'}</p>
              <h1 className="text-xl lg:text-3xl font-bold text-black mb-2">{product.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Продано {product.sold_count || 0}</span>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating_avg || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {product.rating_avg?.toFixed(1) || '0.0'} ({product.rating_count || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            {product.available_sizes && product.available_sizes.length > 0 && (
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-black mb-3">Размер</h3>
                <div className="flex flex-wrap gap-2">
                  {product.available_sizes.map((size: string) => (
                    <button
                      key={size}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size
                          ? "border-brand bg-brand-50 text-brand font-semibold"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.available_colors && product.available_colors.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base lg:text-lg font-semibold text-black">Цвет</h3>
                  <span className="text-sm text-gray-600 capitalize">{selectedColor || 'Выберите цвет'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.available_colors.map((color: string) => (
                    <button
                      key={color}
                      className={`px-4 py-2 border rounded-lg capitalize ${
                        selectedColor === color
                          ? "border-brand bg-brand-50 text-brand font-semibold"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Price */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-brand">
                  {product.price_min} сом
                </span>
                {product.skus?.some((sku: any) => sku.original_price) && (
                  <span className="text-lg text-gray-400 line-through">
                    {product.skus.find((sku: any) => sku.original_price)?.original_price} сом
                  </span>
                )}
              </div>
              {product.price_min !== product.price_max && (
                <p className="text-sm text-gray-500 mt-1">
                  Цена варьируется от {product.price_min} до {product.price_max} сом в зависимости от размера и цвета
                </p>
              )}
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:flex space-x-4">
              {isAddedToCart ? (
                <div className="flex space-x-2">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
                    disabled
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Добавлено в корзину
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-3 rounded-lg border-brand text-brand hover:bg-brand-50"
                    onClick={handleGoToCart}
                  >
                    Перейти в корзину
                  </Button>
                </div>
              ) : (
                <Button
                  className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-lg disabled:opacity-50"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? "Добавляем..." : "Добавить в корзину"}
                </Button>
              )}
              
              {!isAddedToCart && (
                <>
                  <Button variant="outline" className="px-6 py-3 rounded-lg bg-transparent hidden" onClick={handleCompare}>
                    Сравнить товар
                  </Button>
                  <Button variant="outline" size="icon" className="p-3 rounded-lg bg-transparent" onClick={handleWishlist}>
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id as string) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <section className="mb-12 px-4 lg:px-0">
            <h2 className="text-xl lg:text-2xl font-bold text-black mb-4">О товаре</h2>
            <p className="text-gray-700 leading-relaxed mb-6 text-sm">{product.description}</p>

            {/* Specifications Table */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="bg-white rounded-lg p-4 lg:p-6">
                <h3 className="font-semibold text-black mb-4">Характеристики</h3>
                <div className="space-y-3 text-sm">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600">{key}</span>
                      <span className="text-black font-medium">{value as string}</span>
                    </div>
                  ))}
                  {/* Add category and subcategory info */}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Категория</span>
                    <span className="text-black font-medium">{product.category?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-600">Подкатегория</span>
                    <span className="text-black font-medium">{product.subcategory?.name}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <section className="mb-12 px-4 lg:px-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-black">
                Отзывы ({product.rating_count || product.reviews.length})
              </h2>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:mx-0 lg:px-0">
              {product.reviews.slice(0, 3).map((review: any) => (
                <div key={review.id} className="bg-white rounded-lg p-4 flex-shrink-0 w-80 lg:w-auto">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center">
                      <span className="text-brand font-bold">★</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">Покупатель</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {review.text && (
                    <p className="text-gray-700 text-sm line-clamp-4">{review.text}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <section className="mb-12 px-4 lg:px-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-black">Похожие товары</h2>
              {product.subcategory?.slug && (
                <Link href={`/subcategory/${product.category?.slug}/${product.subcategory.slug}`}>
                  <Button variant="ghost" className="text-brand hover:text-purple-700 text-sm">
                    ВСЕ ТОВАРЫ
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {similarProducts.map((similarProduct) => (
                <Link
                  key={similarProduct.id}
                  href={`/product/${similarProduct.slug}`}
                  className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group"
                >
                  <div className="relative mb-3">
                    <div className="absolute top-2 right-2 z-10">
                      <button 
                        className="p-1.5 bg-gray-100/80 rounded-full"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          auth.requireAuth(() => {
                            const productId = similarProduct.id.toString()
                            if (isInWishlist(productId)) {
                              removeFromWishlist(productId)
                            } else {
                              addToWishlist(similarProduct)
                            }
                          })
                        }}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(similarProduct.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={similarProduct.image || "/images/black-tshirt.jpg"}
                        alt={similarProduct.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">{similarProduct.title}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">{similarProduct.price_min} сом</span>
                    </div>
                    {similarProduct.rating_avg > 0 && (
                      <div className="text-xs text-gray-500">
                        ★ {similarProduct.rating_avg.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Footer for Mobile */}
      <footer className="lg:hidden sticky bottom-0 bg-white border-t p-4 z-40">
        <div className="flex space-x-4">
          <Button
            className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-lg text-base"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddedToCart ? (
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 mr-2" /> Добавлено
              </div>
            ) : (
              isAddingToCart ? "Добавляем..." : "Добавить в корзину"
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 py-3 rounded-lg bg-brand-50 border-brand-light text-brand"
            onClick={handleGoToCart}
          >
            Оформить заказ
          </Button>
        </div>
      </footer>

      {/* Footer */}
      <footer className="hidden lg:block bg-gray-900 text-white py-12">
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
