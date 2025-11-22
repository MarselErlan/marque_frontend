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

  const handleAuthClick = (e: React.MouseEvent) => {
    e.preventDefault()
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

  const navItems = [
    {
      id: 'mannequin',
      label: 'Манекен',
      icon: (
        <div className="flex items-center justify-center">
          <Sparkles className="w-6 h-6" strokeWidth={1.5} />
        </div>
      ),
      href: '/',
      active: pathname === '/',
    },
    {
      id: 'wishlist',
      label: 'Избранные',
      icon: (
        <div className="relative">
          <Heart className="w-6 h-6" strokeWidth={1.5} />
          {wishlistItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {wishlistItemCount > 9 ? '9+' : wishlistItemCount}
            </span>
          )}
        </div>
      ),
      href: '/wishlist',
      active: pathname === '/wishlist',
    },
    {
      id: 'cart',
      label: 'Корзина',
      icon: (
        <div className="relative">
          <ShoppingCart className="w-6 h-6" strokeWidth={1.5} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </span>
          )}
        </div>
      ),
      href: '/cart',
      active: pathname === '/cart',
    },
    {
      id: 'auth',
      label: auth.isLoggedIn ? 'Профиль' : 'Войти',
      icon: <User className="w-6 h-6" strokeWidth={1.5} />,
      href: auth.isLoggedIn ? '/profile' : '#',
      active: pathname === '/profile',
      onClick: handleAuthClick,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-100 border-t border-gray-200">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const content = (
            <div
              className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 ${
                item.active ? 'text-brand' : 'text-gray-700'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          )

          if (item.onClick) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex-1 flex justify-center cursor-pointer active:scale-95 transition-transform"
                type="button"
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex-1 flex justify-center active:scale-95 transition-transform"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

