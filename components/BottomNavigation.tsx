"use client"

import { Heart, ShoppingCart, User, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'

export const BottomNavigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { cartItemCount } = useCart()
  const { wishlistItemCount } = useWishlist()

  const handleAuthClick = () => {
    if (!auth.isLoggedIn) {
      auth.requireAuth(() => {
        // After login, navigate to profile
        router.push('/profile')
      })
    } else {
      // User is logged in, navigate to profile
      router.push('/profile')
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-100 border-t border-gray-200">
      <div className="flex items-center justify-around px-4 py-3">
        {/* Манекен */}
        <Link
          href="/"
          className="flex-1 flex justify-center items-center active:scale-95 transition-transform touch-manipulation min-h-[60px]"
        >
          <div className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 ${pathname === '/' ? 'text-brand' : 'text-gray-700'}`}>
            <Sparkles className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-xs font-medium">Манекен</span>
          </div>
        </Link>

        {/* Избранные */}
        <Link
          href="/wishlist"
          className="flex-1 flex justify-center items-center active:scale-95 transition-transform touch-manipulation min-h-[60px]"
        >
          <div className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 ${pathname === '/wishlist' ? 'text-brand' : 'text-gray-700'}`}>
            <div className="relative">
              <Heart className="w-6 h-6" strokeWidth={1.5} />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlistItemCount > 9 ? '9+' : wishlistItemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Избранные</span>
          </div>
        </Link>

        {/* Корзина */}
        <Link
          href="/cart"
          className="flex-1 flex justify-center items-center active:scale-95 transition-transform touch-manipulation min-h-[60px]"
        >
          <div className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 ${pathname === '/cart' ? 'text-brand' : 'text-gray-700'}`}>
            <div className="relative">
              <ShoppingCart className="w-6 h-6" strokeWidth={1.5} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Корзина</span>
          </div>
        </Link>

        {/* Войти / Профиль */}
        <button
          onClick={handleAuthClick}
          className="flex-1 flex justify-center items-center active:scale-95 transition-transform touch-manipulation min-h-[60px]"
          type="button"
        >
          <div className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 ${pathname === '/profile' ? 'text-brand' : 'text-gray-700'}`}>
            <User className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-xs font-medium">{auth.isLoggedIn ? 'Профиль' : 'Войти'}</span>
          </div>
        </button>
      </div>
    </div>
  )
}

