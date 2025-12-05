"use client"
import { useState, useEffect, useMemo } from "react"
import { Star, ArrowRight, Check, Heart, ArrowLeft } from "lucide-react"
import { SparklesIcon } from "@/components/SparklesIcon"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { productsApi } from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { API_CONFIG } from "@/lib/config"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { useCart } from "@/hooks/useCart"
import { useLanguage } from "@/contexts/LanguageContext"
import { toast } from "@/lib/toast"
import { useCatalog } from "@/contexts/CatalogContext"
import { getImageUrl } from "@/lib/utils"
import { useCurrency } from "@/hooks/useCurrency"

type GalleryImage = {
  src: string
  alt: string
  id: string
  type: "main" | "gallery" | "variant"
  size?: string | null
  color?: string | null
}

// Star Rating Component with partial fill support
const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => {
  const fullStars = Math.floor(rating)
  const hasPartialStar = rating % 1 !== 0
  const partialFill = rating % 1

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          // Fully filled star
          return (
            <Star
              key={i}
              className={`${size} text-yellow-400 fill-current`}
            />
          )
        } else if (i === fullStars && hasPartialStar) {
          // Partially filled star
          return (
            <div key={i} className={`${size} relative inline-block`}>
              {/* Background (empty) star */}
              <Star className={`${size} text-gray-300 absolute inset-0`} />
              {/* Partial fill using clip-path */}
              <div
                className="absolute inset-0"
                style={{
                  clipPath: `inset(0 ${100 - partialFill * 100}% 0 0)`,
                }}
              >
                <Star className={`${size} text-yellow-400 fill-current`} />
              </div>
            </div>
          )
        } else {
          // Empty star
          return (
            <Star
              key={i}
              className={`${size} text-gray-300`}
            />
          )
        }
      })}
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const auth = useAuth()
  const { isLoggedIn } = auth
  const { t } = useLanguage()
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItemCount } = useWishlist()
  const { addToCart, cartItemCount } = useCart()
  const { openCatalog } = useCatalog()
  const { format, currency, currencyCode, market, isLoading: isCurrencyLoading } = useCurrency()
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  // Swipe state for product images
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  
  // API state
  const [product, setProduct] = useState<any>(null)
  const [similarProducts, setSimilarProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Currency state
  const [formattedPrice, setFormattedPrice] = useState<string>('')
  const [formattedOriginalPrice, setFormattedOriginalPrice] = useState<string>('')
  const [formattedPriceRange, setFormattedPriceRange] = useState<string>('')
  
  // Load product data from API
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const slug = params.id as string
        const productData = await productsApi.getDetail(slug)
        setProduct(productData)
        
        // Format prices will be handled in separate useEffect when currency is loaded

        if (productData?.skus?.length) {
          const firstSkuWithOptions = productData.skus.find(
            (sku: any) => sku.size && sku.color
          )
          if (firstSkuWithOptions) {
            setSelectedSize(firstSkuWithOptions.size)
            setSelectedColor(firstSkuWithOptions.color)
          } else {
            if (productData.available_sizes?.length) {
              setSelectedSize(productData.available_sizes[0])
            }
            if (productData.available_colors?.length) {
              setSelectedColor(productData.available_colors[0])
            }
          }
        } else {
          if (productData.available_sizes?.length) {
            setSelectedSize(productData.available_sizes[0])
          }
          if (productData.available_colors?.length) {
            setSelectedColor(productData.available_colors[0])
          }
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

  // Format prices when product and currency are both loaded
  useEffect(() => {
    const updatePrices = async () => {
      if (!product) return
      
      // Wait for currency to load
      if (isCurrencyLoading || !currency) {
        console.log('⏳ Waiting for currency to load...', { isCurrencyLoading, currency, market })
        return
      }
      
      const productCurrency = product.currency?.code || 'KGS'
      console.log('💰 Formatting prices:', {
        productCurrency,
        priceMin: product.price_min,
        userCurrency: currency.code,
        currencySymbol: currency.symbol,
        market,
      })
      
      try {
        const priceMin = await format(product.price_min, productCurrency)
        console.log('💰 Formatted price:', priceMin)
        setFormattedPrice(priceMin)
        
        if (product.original_price_min) {
          const originalPrice = await format(product.original_price_min, productCurrency)
          setFormattedOriginalPrice(originalPrice)
        }
        
        if (product.price_min !== product.price_max) {
          const priceMax = await format(product.price_max, productCurrency)
          setFormattedPriceRange(`${priceMin} - ${priceMax}`)
        }
        
        // Format prices for similar products
        if (product.similar_products && product.similar_products.length > 0) {
          const formattedSimilar = await Promise.all(
            product.similar_products.map(async (p: any) => {
              const pCurrency = p.currency?.code || 'KGS'
              const formattedPrice = await format(p.price_min, pCurrency)
              return { ...p, formatted_price: formattedPrice }
            })
          )
          setSimilarProducts(formattedSimilar)
        }
      } catch (error) {
        console.error('Error formatting prices:', error)
        // Fallback to raw price with currency symbol
        setFormattedPrice(`${product.price_min} ${currency.symbol}`)
      }
    }
    
    updatePrices()
  }, [product, currency, isCurrencyLoading, market, format])

  // NEW: Find matching SKU based on selected size and color
  const getMatchingSKU = () => {
    if (!product || !product.skus || !selectedSize || !selectedColor) {
      return null
    }
    
    return product.skus.find((sku: any) => 
      sku.size === selectedSize && sku.color === selectedColor
    )
  }

  const galleryImages = useMemo<GalleryImage[]>(() => {
    if (!product) return []

    const images: GalleryImage[] = []

    if (product.image) {
      images.push({
        src: getImageUrl(product.image),
        alt: product.title,
        id: "main-image",
        type: "main",
      })
    }

    if (product.images?.length) {
      product.images.forEach((image: any, index: number) => {
        if (!image?.url) return
        images.push({
          src: getImageUrl(image.url),
          alt: image.alt_text || `${product.title} ${index + 1}`,
          id: `gallery-${image.id || index}`,
          type: "gallery",
        })
      })
    }

    if (product.skus?.length) {
      product.skus.forEach((sku: any, index: number) => {
        if (!sku.variant_image) return
        images.push({
          src: getImageUrl(sku.variant_image),
          alt: `${product.title} ${sku.size || ""} ${sku.color || ""}`.trim(),
          id: `variant-${sku.id || index}`,
          type: "variant",
          size: sku.size,
          color: sku.color,
        })
      })
    }

    if (!images.length) {
      images.push({
        src: "/images/product_placeholder_adobe.png",
        alt: product.title,
        id: "placeholder",
        type: "main",
      })
    }

    return images
  }, [product])

  const colorsForSelectedSize = useMemo(() => {
    if (!product) {
      return []
    }

    const colorMap = new Map<string, string | null | undefined>()

    if (product.skus?.length) {
      product.skus.forEach((sku: any) => {
        if (!sku.color) {
          return
        }

        if (!selectedSize || sku.size === selectedSize) {
          if (!colorMap.has(sku.color)) {
            colorMap.set(sku.color, sku.color_hex)
          }
        }
      })
    }

    if (!colorMap.size && product.available_colors?.length) {
      product.available_colors.forEach((color: string) => {
        if (!colorMap.has(color)) {
          colorMap.set(color, null)
        }
      })
    }

    return Array.from(colorMap.entries()).map(([name, hex]) => ({
      name,
      hex,
    }))
  }, [product, selectedSize])

  useEffect(() => {
    if (!product) return
    if (!selectedSize) return

    if (!colorsForSelectedSize.length) {
      setSelectedColor("")
      return
    }
    const availableNames = colorsForSelectedSize.map((color) => color.name)
    if (!availableNames.includes(selectedColor)) {
      setSelectedColor(availableNames[0] || "")
    }
  }, [product, selectedSize, colorsForSelectedSize, selectedColor])


  // NEW: Update display image when color changes
  const findVariantImageIndex = (size?: string, color?: string) => {
    if (!size || !color) return -1
    return galleryImages.findIndex(
      (image) =>
        image.type === "variant" &&
        image.size === size &&
        image.color === color
    )
  }

  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImageIndex(0)
      return
    }
    if (selectedImageIndex >= galleryImages.length) {
      setSelectedImageIndex(0)
    }
  }, [galleryImages, selectedImageIndex])

  useEffect(() => {
    const matchingSKU = getMatchingSKU()
    if (!matchingSKU) return

    const variantIndex = findVariantImageIndex(
      matchingSKU.size,
      matchingSKU.color
    )
    if (variantIndex !== -1) {
      setSelectedImageIndex(variantIndex)
    }
  }, [selectedSize, selectedColor, galleryImages])

  const getDisplayImage = (imageIndex: number = selectedImageIndex) => {
    return galleryImages[imageIndex]?.src || "/images/product_placeholder_adobe.png"
  }

  const handleAddToCart = async () => {
    // Validate size and color selection
    if (!selectedSize) {
      toast.error(t('product.selectSize'))
      return
    }
    if (!selectedColor) {
      toast.error(t('product.selectColor'))
      return
    }
    
    setIsAddingToCart(true)
    
    try {
      // Find matching SKU to get variant image and correct price
      const matchingSKU = getMatchingSKU()
      
      const fallbackImage =
        galleryImages[selectedImageIndex]?.src ||
        galleryImages[0]?.src ||
        "/images/product_placeholder_adobe.png"

      const variantIndex = findVariantImageIndex(
        matchingSKU?.size,
        matchingSKU?.color
      )

      const imageForCart =
        variantIndex !== -1
          ? galleryImages[variantIndex]?.src
          : fallbackImage

      // Prepare cart item
      const cartItem = {
        id: product.id,
        name: product.title,
        price: matchingSKU?.price || product.price_min,
        originalPrice: matchingSKU?.original_price || product.original_price_min,
        brand: product.brand?.name || 'MARQUE',
        image: imageForCart,
        size: selectedSize,
        color: selectedColor,
        sku_id: matchingSKU?.id // Use the actual SKU ID
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
    // Compare functionality to be implemented
  }

  const handleWishlist = () => {
    const productId = product.id as string
    
    if (isInWishlist(productId)) {
      // Remove from wishlist
      removeFromWishlist(productId)
    } else {
      // Add to wishlist
      if (isLoggedIn) {
        addToWishlist(product as any)
      } else {
        auth.requireAuth(() => {
          addToWishlist(product as any)
        })
      }
    }
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

  // Swipe handlers for product images
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && galleryImages.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length)
    }
    if (isRightSwipe && galleryImages.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
    }
  }

  // Mouse handlers for desktop swipe
  const [mouseStart, setMouseStart] = useState<number | null>(null)
  const [mouseEnd, setMouseEnd] = useState<number | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    setMouseEnd(null)
    setMouseStart(e.clientX)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (mouseStart !== null) {
      setMouseEnd(e.clientX)
    }
  }

  const onMouseUp = () => {
    if (!mouseStart || !mouseEnd) return
    
    const distance = mouseStart - mouseEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && galleryImages.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length)
    }
    if (isRightSwipe && galleryImages.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
    }
    
    setMouseStart(null)
    setMouseEnd(null)
  }

  if (!isClient) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthModals {...auth} />
        <main className="max-w-7xl mx-auto lg:px-8 py-20">
          <div className="flex items-center justify-center flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand mb-4"></div>
            <p className="text-gray-600">{t('product.loading')}</p>
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
        <main className="max-w-7xl mx-auto lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('product.notFound')}</h1>
          <p className="text-gray-600 mb-8">{error || t('product.notFoundDesc')}</p>
          <Link href="/">
            <Button className="bg-brand hover:bg-brand-hover text-white">
              {t('product.backToHome')}
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />    
      {/* Main Content */}
      <main className="max-w-7xl mx-auto lg:px-8 py-4 lg:py-8">
        {/* Breadcrumb - Hidden on Mobile */}
        <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 mb-8 px-4">
          <Link href="/" className="hover:text-brand">
            {t('product.home')}
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
            <div 
              className="lg:hidden relative"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <div className="aspect-square bg-white overflow-hidden">
                <img
                  src={getDisplayImage(selectedImageIndex)}
                  alt={galleryImages[selectedImageIndex]?.alt || product.title}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id}
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
              <button
                className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-colors shadow-sm"
              >
                <SparklesIcon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm font-medium">{t('common.mannequin')}</span>
              </button>
            </div>
            
            {/* Desktop Gallery */}
            <div className="hidden lg:flex gap-4">
              <div className="flex flex-col space-y-3 w-20">
                {galleryImages.map((image, index) => (
                  <button
                  key={image.id}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index ? "border-brand ring-2 ring-brand/20" : "border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div 
                className="flex-1 aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center relative cursor-grab active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                <img
                  src={getDisplayImage(selectedImageIndex)}
                  alt={galleryImages[selectedImageIndex]?.alt || product.title}
                  className="w-full h-full object-cover transition-opacity duration-300 select-none"
                  draggable={false}
                />
                <button
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-colors shadow-sm"
                >
                  <SparklesIcon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{t('common.mannequin')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6 px-4 lg:px-0 mt-4 lg:mt-0">
            <div>
              <p className="text-sm text-gray-500">{product.brand?.name || 'MARQUE'}</p>
              <h1 className="text-xl lg:text-3xl font-bold text-black mb-2">{product.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{t('product.sold')} {product.sold_count || 0}</span>
                <div className="flex items-center space-x-1">
                  <StarRating rating={product.rating_avg || 0} size="w-4 h-4" />
                  <span>
                    {product.rating_avg?.toFixed(1) || '0.0'} ({product.rating_count || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            {product.available_sizes && product.available_sizes.length > 0 && (
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-black mb-3">{t('product.size')}</h3>
                <div className="flex flex-wrap gap-2">
                  {product.available_sizes.map((size: string) => (
                    <button
                      key={size}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size
                          ? "border-brand bg-brand-50 text-brand font-semibold"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                      onClick={() => {
                        setSelectedSize(size)
                        const idx = findVariantImageIndex(size, selectedColor)
                        if (idx !== -1) {
                          setSelectedImageIndex(idx)
                        }
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colorsForSelectedSize && colorsForSelectedSize.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base lg:text-lg font-semibold text-black">{t('product.color')}</h3>
                  <span className="text-sm text-gray-600 capitalize">{selectedColor || t('product.selectColor')}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {colorsForSelectedSize.map(({ name: colorName, hex }) => {
                    const backgroundColor = hex || "#f3f4f6"

                    return (
                      <button
                        key={colorName}
                        className={`relative w-12 h-12 rounded-full border-2 transition-colors duration-150 ${
                          selectedColor === colorName
                            ? "border-brand ring-2 ring-brand/30"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        onClick={() => {
                          setSelectedColor(colorName)
                          const idx = findVariantImageIndex(selectedSize, colorName)
                          if (idx !== -1) {
                            setSelectedImageIndex(idx)
                          }
                        }}
                      >
                        <span className="sr-only capitalize">{colorName}</span>
                        <span
                          className="absolute inset-1 rounded-full border border-black/5"
                          style={{ backgroundColor }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Price */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-brand">
                  {isCurrencyLoading ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : formattedPrice ? (
                    formattedPrice
                  ) : currency ? (
                    `${product.price_min} ${currency.symbol}`
                  ) : (
                    `${product.price_min} сом`
                  )}
                </span>
                {formattedOriginalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formattedOriginalPrice}
                  </span>
                )}
              </div>
              {formattedPriceRange && (
                <p className="text-sm text-gray-500 mt-1">
                  {formattedPriceRange}
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
                    {t('product.addedToCart')}
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-3 rounded-lg border-brand text-brand hover:bg-brand-50"
                    onClick={handleGoToCart}
                  >
                    {t('product.goToCart')}
                  </Button>
                </div>
              ) : (
                <Button
                  className="flex-1 bg-brand hover:bg-brand-hover text-white py-3 rounded-lg disabled:opacity-50"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? t('product.adding') : t('product.addToCart')}
                </Button>
              )}
              
              {!isAddedToCart && (
                <>
                  <Button variant="outline" className="px-6 py-3 rounded-lg bg-transparent hidden" onClick={handleCompare}>
                    {t('product.compare')}
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
          <h2 className="text-xl lg:text-2xl font-bold text-black mb-4">{t('product.about')}</h2>
          
          {/* Description Text */}
          {product.description && (
            <p className="text-gray-700 leading-relaxed mb-6 text-sm lg:text-base">
              {product.description}
            </p>
          )}

          {/* Specifications Table */}
          <div className="divide-y divide-gray-200">
              {/* Пол (Gender) */}
              {product.category && (
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-sm lg:text-base text-gray-600 font-normal">{t('product.gender')}</span>
                  <span className="text-sm lg:text-base text-black font-medium">
                    {product.category.name === 'Мужчинам' || product.category.name === 'Мужской' 
                      ? t('product.male')
                      : product.category.name === 'Женщинам' || product.category.name === 'Женский'
                      ? t('product.female')
                      : product.category.name || '—'}
                  </span>
                </div>
              )}

              {/* Цвет (Color) */}
              {selectedColor && (
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-sm lg:text-base text-gray-600 font-normal">{t('product.color')}</span>
                  <span className="text-sm lg:text-base text-black font-medium capitalize">
                    {selectedColor}
                  </span>
                </div>
              )}

              {/* Состав (Composition) */}
              {(product.attributes?.Состав || product.attributes?.состав || product.attributes?.Material || product.attributes?.material || product.attributes?.Composition || product.attributes?.composition) && (
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-sm lg:text-base text-gray-600 font-normal">{t('product.composition')}</span>
                  <span className="text-sm lg:text-base text-black font-medium">
                    {product.attributes?.Состав || product.attributes?.состав || product.attributes?.Material || product.attributes?.material || product.attributes?.Composition || product.attributes?.composition || '—'}
                  </span>
                </div>
              )}

              {/* Сезон (Season) */}
              {(product.attributes?.Сезон || product.attributes?.сезон || product.attributes?.Season || product.attributes?.season) && (
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-sm lg:text-base text-gray-600 font-normal">{t('product.season')}</span>
                  <span className="text-sm lg:text-base text-black font-medium">
                    {product.attributes?.Сезон || product.attributes?.сезон || product.attributes?.Season || product.attributes?.season || '—'}
                  </span>
                </div>
              )}

              {/* Артикул (Article/SKU) */}
              {(product.skus && product.skus.length > 0 && product.skus[0]?.sku_code) || product.attributes?.Артикул || product.attributes?.артикул || product.attributes?.Article || product.attributes?.article || product.attributes?.SKU || product.attributes?.sku ? (
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="text-sm lg:text-base text-gray-600 font-normal">{t('product.sku')}</span>
                  <span className="text-sm lg:text-base text-black font-medium">
                    {product.skus && product.skus.length > 0 && product.skus[0]?.sku_code 
                      ? product.skus[0].sku_code 
                      : product.attributes?.Артикул || product.attributes?.артикул || product.attributes?.Article || product.attributes?.article || product.attributes?.SKU || product.attributes?.sku || '—'}
                  </span>
                </div>
              ) : null}

              {/* Additional attributes from API */}
              {product.attributes && Object.entries(product.attributes).map(([key, value]) => {
                // Skip already displayed fields (case-insensitive)
                const keyLower = key.toLowerCase()
                const skipKeys = [
                  'состав', 'composition', 'material', 'материал',
                  'сезон', 'season',
                  'артикул', 'article', 'sku',
                  'бренд', 'brand',
                  'категория', 'category',
                  'подкатегория', 'subcategory'
                ]
                if (skipKeys.includes(keyLower)) {
                  return null
                }
                return (
                  <div key={key} className="flex justify-between items-center py-3 px-4">
                    <span className="text-sm lg:text-base text-gray-600 font-normal">{key}</span>
                    <span className="text-sm lg:text-base text-black font-medium">{value as string}</span>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <section className="mb-12 px-4 lg:px-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-black">
                {t('product.reviews')} ({product.rating_count || product.reviews.length})
              </h2>
              <Link href={`/product/${params.id}/reviews`} className="text-brand hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                {t('product.allReviews')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
              {product.reviews.slice(0, 3).map((review: any) => (
                <div key={review.id} className="bg-white rounded-lg p-4 lg:p-6 flex-shrink-0 w-80 lg:w-auto">
                  {/* User Info Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* User Profile Picture */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {review.user_profile_image ? (
                          <img
                            src={getImageUrl(review.user_profile_image)}
                            alt={review.user_name || t('product.buyer')}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-brand font-bold text-lg">
                            {review.user_name ? review.user_name.charAt(0).toUpperCase() : t('product.buyer').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-black text-sm">
                            {review.user_name || t('product.buyer')}
                          </h4>
                          {/* Date on the right */}
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-auto">
                            {(() => {
                              try {
                                const date = new Date(review.created_at || review.date)
                                const day = String(date.getDate()).padStart(2, '0')
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const year = date.getFullYear()
                                return `${day}/${month}/${year}`
                              } catch {
                                return review.created_at || review.date || '—'
                              }
                            })()}
                          </span>
                        </div>
                        {/* Star Rating */}
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (review.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Images - Horizontal Row */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex space-x-2 mb-3 overflow-x-auto pb-2">
                      {review.images.slice(0, 6).map((img: any, idx: number) => (
                        <div key={img.id || idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={getImageUrl(img.image_url || img.url || img)}
                            alt={`Review image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/product_placeholder_adobe.png"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review Text */}
                  {(review.comment || review.text) && (
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                      {review.comment || review.text}
                    </p>
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
              <h2 className="text-xl lg:text-2xl font-bold text-black">{t('product.similarProducts')}</h2>
              {product.subcategory?.slug && (
                <Link href={`/subcategory/${product.category?.slug}/${product.subcategory.slug}`}>
                  <Button variant="ghost" className="text-brand hover:text-purple-700 text-sm">
                    {t('product.allProducts')}
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
                          
                          const productId = similarProduct.id.toString()
                          if (isInWishlist(productId)) {
                            removeFromWishlist(productId)
                          } else {
                            if (isLoggedIn) {
                              addToWishlist(similarProduct)
                            } else {
                              auth.requireAuth(() => {
                                addToWishlist(similarProduct)
                              })
                            }
                          }
                        }}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(similarProduct.id.toString()) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
                      </button>
                    </div>
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={
                          similarProduct.image 
                            ? getImageUrl(similarProduct.image)
                            : "/images/product_placeholder_adobe.png"
                        }
                        alt={similarProduct.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">{similarProduct.title}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-base font-bold text-brand">
                        {similarProduct.formatted_price || `${similarProduct.price_min} ${currency?.symbol || 'сом'}`}
                      </span>
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
                <Check className="w-5 h-5 mr-2" /> {t('product.added')}
              </div>
            ) : (
              isAddingToCart ? t('product.adding') : t('product.addToCart')
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 py-3 rounded-lg bg-brand-50 border-brand-light text-brand"
            onClick={handleGoToCart}
          >
            {t('product.checkout')}
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
