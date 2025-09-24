"use client"
import { useState, useEffect } from "react"
import { Star, ArrowRight, Check, Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { allProducts, getProductsBySales, Product as ProductType } from "@/lib/products"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { useCart } from "@/hooks/useCart"
import { Header } from "@/components/Header"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const auth = useAuth()
  const { isLoggedIn } = auth
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItemCount } = useWishlist()
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)

  // Mock product data - in real app this would come from API
  const product = {
    id: params.id,
    name: "Футболка спорт из хлопка",
    price: "2999 сом",
    rating: 4.4,
    reviewCount: 20,
    sold: 120,
    images: [
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "black", label: "Чёрный", color: "#000000" },
      { name: "white", label: "Белый", color: "#FFFFFF" },
    ],
    description: `В нем сочетается, что мы ценим в спортивной одежде: быстро сохнущий, с легким охлаждающим эффектом, эластичный и дышащий. Эта футболка обеспечивает максимальный комфорт во время тренировок. Футболка обладает отличной посадкой, высоким качеством материалов, отличным качеством пошива и стильным дизайном.`,
    specifications: {
      Пол: "Мужской/Женский",
      Цвет: "Чёрный",
      Материал: "100% хлопок, 180г/м²",
      Сезон: "Мужской",
      Страна: "Турция",
      Бренд: "Турция",
    },
  }

  const reviews = [
    {
      id: 1,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
    {
      id: 2,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
    {
      id: 3,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
  ]

  const similarProducts = [
    {
      id: 1,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
    {
      id: 2,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
    {
      id: 3,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
    {
      id: 4,
      name: "Футболка спорт из хлопка",
      price: "2999 сом",
      image: "/images/black-tshirt.jpg",
      sold: 23,
    },
  ]

  // Country codes for phone input
  const countryCodes = [
    { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
    { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
  ]

  // Load cart count from localStorage
  const loadCartCount = () => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const totalItems = existingCart.reduce((total: number, item: any) => total + item.quantity, 0)
      setCartItemCount(totalItems)
    } catch (error) {
      console.error('Error loading cart count:', error)
      setCartItemCount(0)
    }
  }

  // Load cart count on component mount
  useEffect(() => {
    setIsClient(true)
    loadCartCount()
  }, [])

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add item to cart (in real app, this would be stored in context/state management)
    const cartItem = {
      id: Date.now(), // Generate unique ID
      productId: product.id,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      price: parseInt(product.price.replace(/\D/g, '')), // Extract numeric price
      image: product.images[0]
    }
    
    // Store in localStorage for demo purposes
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItemIndex = existingCart.findIndex(
      (item: any) => item.productId === product.id && item.size === selectedSize && item.color === selectedColor
    )
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantity
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    setIsAddingToCart(false)
    setIsAddedToCart(true)
    
    // Update cart count
    loadCartCount()
    
    // Reset success state after 2 seconds
    setTimeout(() => setIsAddedToCart(false), 2000)
    
    console.log("Added to cart:", cartItem)
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
    return null // or a loading spinner
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
          <Link href="/category/мужчинам" className="hover:text-brand">
            Мужчинам
          </Link>
          <span>›</span>
          <Link href="/subcategory/мужчинам/футболки-и-поло" className="hover:text-brand">
            Футболки и поло
          </Link>
          <span>›</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image Carousel - Mobile */}
            <div className="lg:hidden relative">
              <div className="aspect-square bg-white overflow-hidden">
                <img
                  src={product.images[selectedImageIndex] || "/images/black-tshirt.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${selectedImageIndex === index ? 'bg-brand' : 'bg-gray-300'}`}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </div>
              <button 
                onClick={handleWishlist}
                className="absolute top-4 right-4 p-2 bg-white/80 rounded-full"
              >
                <Heart className={`w-6 h-6 ${isInWishlist(product.id as string) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
              </button>
            </div>
            
            {/* Main Image - Desktop */}
            <div className="hidden lg:block aspect-square bg-white rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImageIndex] || "/images/black-tshirt.jpg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images - Desktop */}
            <div className="hidden lg:flex space-x-2 px-4 lg:px-0">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-brand" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image || "/images/black-tshirt.jpg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6 px-4 lg:px-0 mt-4 lg:mt-0">
            <div>
              <p className="text-sm text-gray-500">H&M</p>
              <h1 className="text-xl lg:text-3xl font-bold text-black mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Продано {product.sold}</span>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-black mb-3">Размер</h3>
              <div className="flex space-x-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-4 py-2 border rounded-lg flex-1 justify-center ${
                      selectedSize === size
                        ? "border-brand bg-brand-50 text-brand font-semibold"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    <span className="text-xs text-gray-400">RUS</span> {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base lg:text-lg font-semibold text-black">Цвет</h3>
                <span className="text-sm text-gray-600">Чёрный</span>
              </div>
              <div className="flex space-x-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-10 h-10 rounded-full border-2 ${
                      selectedColor === color.name ? "border-brand" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.color }}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.label}
                  />
                ))}
              </div>
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
        <section className="mb-12 px-4 lg:px-0">
          <h2 className="text-xl lg:text-2xl font-bold text-black mb-4">О товаре</h2>
          <p className="text-gray-700 leading-relaxed mb-6 text-sm">{product.description}</p>

          {/* Specifications Table */}
          <div className="bg-white rounded-lg p-4 lg:p-6">
            <div className="space-y-3 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600">{key}</span>
                  <span className="text-black font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-12 px-4 lg:px-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-black">Отзывы</h2>
            <Button variant="ghost" className="text-brand hover:text-purple-700 text-sm">
              ВСЕ ОТЗЫВЫ
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:mx-0 lg:px-0">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-4 flex-shrink-0 w-80 lg:w-auto">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center">
                    <img src={review.images[0]} alt="author" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">{review.author}</h4>
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
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-4">{review.text}</p>

                <div className="flex space-x-2">
                  {review.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image || "/images/black-tshirt.jpg"}
                      alt={`Review ${index + 1}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Products */}
        <section className="mb-12 px-4 lg:px-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-black">Похожие товары</h2>
            <Button variant="ghost" className="text-brand hover:text-purple-700 text-sm">
              ВСЕ ТОВАРЫ
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {similarProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
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
                          const productId = product.id.toString()
                          if (isInWishlist(productId)) {
                            removeFromWishlist(productId)
                          } else {
                            addToWishlist(product as any)
                          }
                        })
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
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
                  <div className="text-xs text-gray-500 uppercase font-medium">H&M</div>
                  <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-base font-bold text-brand">{product.price}</span>
                  </div>
                  <div className="text-xs text-gray-500">Продано {product.sold}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
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
