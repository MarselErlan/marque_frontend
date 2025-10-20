"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, LogIn, ArrowLeft, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { API_CONFIG } from "@/lib/config"
import { productsApi, bannersApi, categoriesApi } from "@/lib/api"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { ProductCardSkeletonGrid } from "@/components/ProductCardSkeleton"
import { Header } from "@/components/Header"
import { getImageUrl } from "@/lib/utils"

export default function MarquePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()
  const { isLoggedIn } = auth
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItemCount } = useWishlist()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string | null>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  
  // API data states
  const [apiCategories, setApiCategories] = useState<any[]>([])
  const [apiSubcategories, setApiSubcategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  
  // Authentication states
  const [countryCode, setCountryCode] = useState("+996")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [randomProducts, setRandomProducts] = useState<any[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [bannerRotationIndex, setBannerRotationIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [apiBanners, setApiBanners] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)

  const searchSuggestions = [
    "футболка",
    "футболка мужская",
    "футболка женская",
    "футболка из хлопка",
    "футболка чёрная",
  ]

  // Country codes for phone input
  const countryCodes = [
    { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
    { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
  ]

  // checkAuthStatus and handleLogout are now handled by the useAuth hook.

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

  // Load initial data from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingInitial(true)
        
        // Load products (banners are optional)
        try {
          // Use regular products API instead of best-sellers to show all products
          const productsData = await productsApi.getAll(25)
          if (productsData && productsData.length > 0) {
            setRandomProducts(productsData)
            setHasMoreProducts(productsData.length === 25)
          }
        } catch (err) {
            console.error('Failed to load products:', err)
        }
        
        // Load banners separately (don't block on errors)
        try {
          console.log('🔄 Attempting to load banners from backend...')
          const bannersData = await bannersApi.getAll()
          console.log('📊 Banner API response:', bannersData)
          
          // Backend returns { hero_banners, promo_banners, category_banners, total }
          if (bannersData && (bannersData.hero_banners?.length > 0 || bannersData.promo_banners?.length > 0)) {
            // Combine all banner types for the hero carousel (prioritize hero banners)
            const allBanners = [
              ...(bannersData.hero_banners || []),
              ...(bannersData.promo_banners || []),
              ...(bannersData.category_banners || [])
            ]
            setApiBanners(allBanners)
            console.log('✅ SUCCESS! Loaded', allBanners.length, 'banners from backend')
            console.log('📋 Hero:', bannersData.hero_banners?.length, 'Promo:', bannersData.promo_banners?.length, 'Category:', bannersData.category_banners?.length)
          } else {
            console.warn('⚠️ No banners in response, using fallback')
          }
        } catch (err: any) {
          console.error('❌ Failed to load banners (using fallback):', err)
          console.error('Error details:', err.message, err.status)
          // Fallback banners will be used automatically
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      } finally {
        setIsLoadingInitial(false)
      }
    }
    
    loadInitialData()
  }, [])

  // Load cart count on component mount
  useEffect(() => {
    setIsClient(true)
    loadCartCount()
    if (searchParams.get('catalog') === 'true') {
      setShowCatalog(true)
    }
  }, [searchParams])

  // Load categories from API when catalog is opened
  useEffect(() => {
    const loadCategories = async () => {
      if (showCatalog && apiCategories.length === 0) {
        try {
          setLoadingCategories(true)
          
          // Try to load from API
          try {
            const response = await categoriesApi.getAll()
            if (response?.categories && response.categories.length > 0) {
              setApiCategories(response.categories)
              // Set first category as selected by default
              if (!selectedCatalogCategory && response.categories[0]?.slug) {
                setSelectedCatalogCategory(response.categories[0].slug)
              }
              setLoadingCategories(false)
              return
            }
          } catch (apiError) {
            console.error('Failed to load categories from API:', apiError)
          }
          
          // Fallback: Use hardcoded categories
          const fallbackCategories = [
            {
              id: 11,
              slug: 'men',
              name: 'Мужчинам',
              product_count: 6,
              is_active: true
            }
          ]
          
          setApiCategories(fallbackCategories)
          if (!selectedCatalogCategory && fallbackCategories[0]?.slug) {
            setSelectedCatalogCategory(fallbackCategories[0].slug)
          }
        } catch (error) {
          console.error('Failed to load categories:', error)
          // Set fallback even on complete failure
          setApiCategories([
            { id: 11, slug: 'men', name: 'Мужчинам', product_count: 6, is_active: true }
          ])
        } finally {
          setLoadingCategories(false)
        }
      }
    }
    loadCategories()
  }, [showCatalog])

  // Load subcategories when a category is selected
  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedCatalogCategory) {
        try {
          setLoadingSubcategories(true)
          
          // Try to load from API
          try {
            const response = await categoriesApi.getSubcategories(selectedCatalogCategory)
            if (response?.subcategories && response.subcategories.length > 0) {
              setApiSubcategories(response.subcategories)
              setLoadingSubcategories(false)
              return
            }
          } catch (apiError) {
            console.error('Failed to load subcategories from API:', apiError)
          }
          
          // Fallback: Use hardcoded subcategories
          const fallbackSubcategories: Record<string, any[]> = {
            'men': [
              {
                id: 16,
                slug: 't-shirts',
                name: 'Футболки',
                category_id: 11,
                product_count: 5,
                is_active: true
              }
            ]
          }
          
          setApiSubcategories(fallbackSubcategories[selectedCatalogCategory] || [])
        } catch (error) {
          console.error('Failed to load subcategories:', error)
          // Fallback for 'men' category
          if (selectedCatalogCategory === 'men') {
            setApiSubcategories([
              { id: 16, slug: 't-shirts', name: 'Футболки', category_id: 11, product_count: 5, is_active: true }
            ])
          } else {
            setApiSubcategories([])
          }
        } finally {
          setLoadingSubcategories(false)
        }
      }
    }
    loadSubcategories()
  }, [selectedCatalogCategory])

  // New handler for header login button
  const handleHeaderLoginClick = () => {
    auth.requireAuth(() => {
      router.push('/profile')
    })
  }

  const handleWishlistClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    
      if (isInWishlist(product.id)) {
      // Remove from wishlist (no auth required for this action)
        removeFromWishlist(product.id)
      } else {
      // Add to wishlist (requires auth)
      auth.requireAuth(() => {
        addToWishlist(product)
      })
      }
  }

  const handleCatalogClick = () => {
    setShowCatalog(true)
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
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSearchSuggestions(false), 200)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSearchSuggestions(false)
  }

  const removeSuggestion = (suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real app, you would remove this from user's search history
    console.log("Remove suggestion:", suggestion)
  }

  // Catalog Sidebar Overlay (2-level navigation)
  const CatalogSidebar = () => {
    if (!showCatalog) return null

    // Get the selected category name for display
    const selectedCategoryName = apiCategories.find(cat => cat.slug === selectedCatalogCategory)?.name || selectedCatalogCategory

    return (
      <>
        {/* First Sidebar - Main Categories */}
        <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-300">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-black">Каталог</h2>
            <button 
              onClick={() => setShowCatalog(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
              </div>

          {/* Main Categories List */}
          <nav className="p-4">
            {loadingCategories ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : apiCategories.length > 0 ? (
              apiCategories.map((category) => (
                <div
                  key={category.id || category.slug}
                  className={`px-4 py-3 rounded-lg cursor-pointer transition-colors mb-1 flex items-center justify-between ${
                    selectedCatalogCategory === category.slug
                      ? "bg-brand text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedCatalogCategory(category.slug)}
                >
                  <span>{category.name}</span>
                  <ArrowRight className={`w-4 h-4 ${selectedCatalogCategory === category.slug ? 'text-white' : 'text-gray-400'}`} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">Нет категорий</div>
            )}
          </nav>
          </div>

        {/* Second Sidebar - Subcategories (opens to the right of first sidebar) */}
        {selectedCatalogCategory && (
          <div className="fixed inset-y-0 left-80 w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 border-l border-gray-200">
            {/* Subcategories Header */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-black">{selectedCategoryName}</h3>
            </div>

            {/* Subcategories List */}
            <div className="p-4">
              {loadingSubcategories ? (
                <div className="text-center py-8 text-gray-500">Загрузка...</div>
              ) : apiSubcategories.length > 0 ? (
                apiSubcategories.map((subcat) => (
                  <Link
                    key={subcat.id || subcat.slug}
                    href={`/subcategory/${selectedCatalogCategory}/${subcat.slug}`}
                    className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-lg transition-colors group mb-2"
                    onClick={() => setShowCatalog(false)}
                  >
                    {/* Left: Icon + Name */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Subcategory Icon/Image */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={subcat.image_url || subcat.image || "/images/black-tshirt.jpg"}
                          alt={subcat.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Subcategory Name */}
                      <span className="text-base font-normal text-black group-hover:text-brand transition-colors">
                        {subcat.name}
                      </span>
                    </div>
                    
                    {/* Right: Count + Arrow */}
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <span className="text-sm text-gray-500 font-normal">{subcat.product_count || 0}</span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">Нет подкатегорий</div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  const categories = [
    {
      title: "Мужчинам",
      image: "/images/male-model-black.jpg",
      bgColor: "bg-gray-100",
      href: "/category/muzhchinam",
    },
    {
      title: "Женщинам",
      image: "/images/female-model-olive.jpg",
      bgColor: "bg-brand-50",
      href: "/category/zhenshchinam",
    },
    {
      title: "Детям",
      image: "/images/kids-yellow-blue.jpg",
      bgColor: "bg-yellow-50",
      href: "/category/detyam",
    },
    {
      title: "Обувь",
      image: "/images/white-sneakers.jpg",
      bgColor: "bg-gray-50",
      href: "/category/obuv",
    },
    {
      title: "Спорт",
      image: "/images/male-model-hoodie.jpg",
      bgColor: "bg-gray-100",
      href: "/category/sport",
    },
  ]

  // Hero banners for rotation - use API data or fallback to hardcoded
  const fallbackHeroBanners = [
    {
      id: 'collection',
      title: 'Новая коллекция',
      image_url: '/b93dc4af6b33446ca2a5472bc63797bc73a9eae2.png',
      banner_type: 'hero' as const,
      display_order: 0
    },
    {
      id: 'discount',
      title: 'Скидки',
      image_url: '/fcdeeb08e8c20a6a5cf5276b59b60923dfb8c706(1).png',
      banner_type: 'hero' as const,
      display_order: 1
    },
    {
      id: 'quality',
      title: 'Качество',
      image_url: '/5891ae04bafdf76a4d441c78c7e1f8a0a3a1d631.png',
      banner_type: 'hero' as const,
      display_order: 2
    }
  ]

  // Use API banners if available, otherwise use fallback
  const heroBanners = apiBanners.length > 0 ? apiBanners : fallbackHeroBanners

  // Dynamic carousel images from database (can be any amount)
  const [carouselImages, setCarouselImages] = useState<any[]>([])

  // Carousel images are now loaded from the API-loaded products
  useEffect(() => {
    if (randomProducts.length > 0) {
      // Use product images for carousel
      const carouselData = randomProducts.slice(0, 10).map(product => ({
        id: product.id,
        src: product.image || '/images/black-tshirt.jpg',
        alt: product.title || product.name || 'Product',
        category: product.category || 'all',
        brand: product.brand_name || product.brand || 'MARQUE'
      }))
      setCarouselImages(carouselData)
    }
  }, [randomProducts])

  // Banner rotation effect - every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerRotationIndex(prev => (prev + 1) % heroBanners.length)
    }, 10000) // Rotate every 10 seconds

    return () => clearInterval(interval)
  }, [heroBanners.length])

  // Handle banner click to move to center
  const handleBannerClick = (clickedIndex: number) => {
    // If left banner (index 0) is clicked, move it to center
    if (clickedIndex === 0) {
      setBannerRotationIndex(prev => (prev - 1 + heroBanners.length) % heroBanners.length)
    }
    // If right banner (index 2) is clicked, move it to center
    else if (clickedIndex === 2) {
      setBannerRotationIndex(prev => (prev + 1) % heroBanners.length)
    }
    // If center banner (index 1) is clicked, do nothing or add custom action
  }

  // Get current 3 banners in rotation order (right → center → left → right)
  const getCurrentBanners = () => {
    const banners = []
    for (let i = 0; i < 3; i++) {
      const index = (bannerRotationIndex + i) % heroBanners.length
      banners.push(heroBanners[index])
    }
    return banners
  }

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = async () => {
      if (isLoadingMore || !hasMoreProducts || isLoadingInitial) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Load more when user scrolls to 80% of the page
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        setIsLoadingMore(true)
        
        try {
          // Calculate offset based on current products
          const nextBatch = await productsApi.getAll(15)
          
          if (nextBatch && nextBatch.length > 0) {
            setRandomProducts(prev => [...prev, ...nextBatch])
            // If we got less than requested, there's no more
            if (nextBatch.length < 15) {
              setHasMoreProducts(false)
            }
          } else {
            setHasMoreProducts(false)
          }
        } catch (error) {
          console.error('Failed to load more products:', error)
          setHasMoreProducts(false)
        } finally {
          setIsLoadingMore(false)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, hasMoreProducts, isLoadingInitial])

  // Get current 3 images for carousel display (from any amount available in DB)
  const getCurrentCarouselImages = () => {
    if (carouselImages.length === 0) return [] // No images loaded yet
    
    const images = []
    const totalImages = carouselImages.length
    
    // Always show 3 images, but cycle through all available from database
    for (let i = 0; i < 3; i++) {
      const index = (carouselIndex + i) % totalImages
      images.push(carouselImages[index])
    }
    return images
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      
      {/* Catalog Sidebar - renders when showCatalog is true */}
      <CatalogSidebar />
      
      {/* Header - Using same Header component as cart/wishlist pages */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Header authInstance={auth} />
      </header>

      {/* Main Content */}
      <main className="w-full relative">
        {/* Picture Carousel - Desktop Only */}
        <section className="w-full mb-8 mt-8 hidden md:block">
          <div className="flex items-center justify-center h-[506px] relative overflow-hidden w-full">
            {getCurrentBanners().map((banner, index) => (
              <div
                key={`${banner.id}-${bannerRotationIndex}-${index}`}
                 className={`absolute rounded-[24px] overflow-hidden transition-all duration-1000 ease-in-out transform cursor-pointer ${
                   index === 1 
                     ? 'z-20 scale-100 opacity-100' // Center - large and prominent
                     : index === 0 
                       ? 'z-10 scale-100 opacity-100 hover:opacity-100 hover:scale-105' // Left - full size at left edge
                       : 'z-10 scale-100 opacity-100 hover:opacity-100 hover:scale-105' // Right - full size at right edge
                 }`}
                onClick={() => handleBannerClick(index)}
                style={{
                  width: index === 1 ? '900px' : '712px', // Center 900px, sides 712px
                  height: index === 1 ? '506px' : '400px', // Center 506px, sides 400px
                  left: index === 1 ? '50%' : 
                        index === 0 ? '-356px' : // Left: half of 712px off screen
                        'calc(100vw - 356px)', // Right: half of 712px off screen from right
                  transform: index === 1 ? 'translateX(-50%)' : 
                           index === 0 ? 'translateX(0)' : 
                           'translateX(0)'
                }}
              >
                {/* Banner image with overlay */}
                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-[24px] relative overflow-hidden">
                  <div className="relative h-full overflow-hidden">
                    <img 
                      src={getImageUrl(banner.image_url)} 
                      alt={banner.title || 'Banner'} 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { 
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Subtle overlay for depth */}
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    {/* Display title if available */}
                    {banner.title && (
                      <div className="absolute bottom-8 left-8 text-white">
                        <h2 className="text-3xl font-bold drop-shadow-lg">{banner.title}</h2>
                        {banner.subtitle && (
                          <p className="text-lg mt-2 drop-shadow-md">{banner.subtitle}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Navigation indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
              {heroBanners.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === bannerRotationIndex % heroBanners.length
                      ? 'bg-white' 
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Mobile Banner Carousel */}
        <section className="w-full my-4 md:hidden">
          <div className="h-48 relative overflow-hidden flex items-center justify-center">
            {getCurrentBanners().map((banner, index) => (
              <div
                key={`${banner.id}-${bannerRotationIndex}-${index}`}
                className={`absolute rounded-xl overflow-hidden transition-all duration-1000 ease-in-out transform cursor-pointer`}
                onClick={() => handleBannerClick(index)}
                style={{
                  width: 'calc(100vw - 80px)',
                  height: index === 1 ? '100%' : '90%',
                  zIndex: index === 1 ? 20 : 10,
                  left: '50%',
                  transform: 
                    index === 1 ? 'translateX(-50%)' : 
                    (index === 0 ? 'translateX(calc(-50% - 45vw)) scale(0.9)' : 'translateX(calc(-50% + 45vw)) scale(0.9)'),
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl relative overflow-hidden">
                  <div className="relative h-full overflow-hidden">
                    <img 
                      src={getImageUrl(banner.mobile_image_url || banner.image_url)} 
                      alt={banner.title || 'Banner'} 
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/10"></div>
                    {/* Display title on mobile if available */}
                    {banner.title && (
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-bold drop-shadow-lg">{banner.title}</h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Navigation indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
              {heroBanners.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === bannerRotationIndex % heroBanners.length
                      ? 'bg-white' 
                      : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="px-4 md:px-0" style={{maxWidth: '1680px', margin: '0 auto'}}>
          {/* Products Grid */}
          <section className="mb-12">
            {isLoadingInitial ? (
              <ProductCardSkeletonGrid count={12} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4" style={{minHeight: '1156px'}}>
                {randomProducts.map((product, i) => (
                  <Link
                    key={`${product.id}-${i}`}
                    href={`/product/${product.slug || product.id}`}
                    className="bg-white rounded-md p-2 cursor-pointer hover:shadow-md transition-all block group border border-gray-100"
                  >
                    {/* Discount Badge */}
                    <div className="relative mb-2">
                      {product.discount_percent && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">
                          -{product.discount_percent}%
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <button onClick={(e) => handleWishlistClick(e, product)}>
                          <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                        </button>
                      </div>
                      <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100">
                        <img
                          src={
                            product.images && product.images.length > 0 && product.images[0].url
                              ? getImageUrl(product.images[0].url)
                              : product.image && product.image.trim() !== ''
                              ? getImageUrl(product.image)
                              : '/images/black-tshirt.jpg'
                          }
                          alt={product.title || product.name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="space-y-0.5">
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        {product.brand_name || product.brand || 'MARQUE'}
                      </div>
                      <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight mb-1">
                        {product.title || product.name}
                      </h3>
                      
                      {/* Price */}
                      <div className="flex items-baseline space-x-2">
                        <span className="text-base font-bold text-brand">
                          {(product.price_min || product.price) > 0 
                            ? `${product.price_min || product.price} сом`
                            : 'Цена по запросу'
                          }
                        </span>
                        {product.original_price_min && (
                          <span className="text-xs text-gray-400 line-through">
                            {product.original_price_min} сом
                          </span>
                        )}
                      </div>
                      
                      {/* Sales Count */}
                      {product.sold_count && (
                        <div className="text-xs text-gray-500">Продано {product.sold_count}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Loading Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                <span className="ml-3 text-gray-600">Загружаем ещё товары...</span>
                  </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
