"use client"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useWishlist } from "@/hooks/useWishlist"
import { AuthModals } from "@/components/AuthModals"
import { getImageUrl } from "@/lib/utils"

export default function WishlistPage() {
  const router = useRouter()
  const auth = useAuth()
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Избранные</h1>
          {wishlistItems.length > 0 && <span className="text-gray-500 text-sm">{wishlistItems.length} товаров</span>}
        </div>

        {wishlistItems.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-black mb-2">Список пуст</h2>
            <p className="text-gray-600 mb-8 max-w-xs">Перейдите в каталог чтобы добавить товары в избранное</p>
            <Button className="bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-lg" onClick={() => router.push('/?catalog=true')}>
              В каталог
            </Button>
          </div>
        ) : (
          // Wishlist Items
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl p-3 hover:shadow-lg transition-shadow block group"
              >
                <div className="relative mb-3">
                    <div className="absolute top-2 right-2 z-20">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeFromWishlist(String(product.id))
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 transition-colors shadow-md cursor-pointer"
                        type="button"
                        style={{ position: 'relative', zIndex: 20 }}
                      >
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      </button>
                    </div>
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={getImageUrl(product.image) || "/images/product_placeholder_adobe.png"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                </div>
                
                <Link href={`/product/${product.id}`} className="space-y-1 block">
                  <div className="text-xs text-gray-500 uppercase font-medium">H&M</div>
                  <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-base font-bold text-brand">{product.price} сом</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">Продано {product.salesCount || 23}</div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
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
