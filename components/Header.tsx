"use client"

import { useState } from 'react'
import { Search, Heart, ShoppingCart, User, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, type UseAuthReturn } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useCatalog } from '@/contexts/CatalogContext'
import { AuthModals } from '@/components/AuthModals'
import { toast } from 'sonner'

interface HeaderProps {
  authInstance?: UseAuthReturn
}

export const Header = ({ authInstance }: HeaderProps = {}) => {
  const router = useRouter()
  const pathname = usePathname()
  const defaultAuth = useAuth()
  const auth = authInstance || defaultAuth
  const { cartItemCount } = useCart()
  const { wishlistItemCount } = useWishlist()
  const { openCatalog } = useCatalog()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  
  // Check if we're on the profile page
  const isOnProfilePage = pathname === '/profile'

  const handleHeaderAuthClick = async () => {
    if (auth.isLoggedIn) {
      // If on profile page, show logout button
      if (isOnProfilePage) {
        try {
          console.log('🔴 Header: Starting logout...')
          await auth.handleLogout()
          toast.success('Вы успешно вышли из аккаунта')
          console.log('🔴 Header: Redirecting to home...')
          window.location.href = '/'
        } catch (error) {
          console.error('🔴 Header: Logout error:', error)
          toast.error('Ошибка при выходе из аккаунта')
        }
      } else {
        // Not on profile page, navigate to profile
        router.push('/profile')
      }
    } else {
      // User is not logged in, so show login modal
      auth.requireAuth(() => {
        router.push('/profile')
      })
    }
  }

  const handleCatalogClick = () => {
    openCatalog()
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  const handleSearchFocus = () => {
    setShowSearchSuggestions(true)
  }

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow click events to register
    setTimeout(() => setShowSearchSuggestions(false), 200)
  }
  
  const handleSearchSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearchSuggestions(false)
    }
  }
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e)
    }
  }

  return (
    <>
      {/* Desktop Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:block">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <h1 className="text-2xl font-bold text-black tracking-wider cursor-pointer">MARQUE</h1>
            </Link>
            <Button
              className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg flex items-center space-x-2"
              onClick={handleCatalogClick}
            >
              <span className="text-lg">⋮⋮⋮</span>
              <span>Каталог</span>
            </Button>
          </div>
          {/* Center Section */}
          <div className="flex-1 flex justify-center px-8">
            <div className="relative max-w-2xl w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Товар, бренд или артикул"
                className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
              />
              {/* You can add a suggestions dropdown here if needed */}
            </div>
          </div>
          {/* Right Section */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
              <Sparkles className="w-6 h-6 mb-1" strokeWidth={1.5} />
              <span>Манекен</span>
            </Link>
            <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
              <Heart className="w-6 h-6 mb-1" strokeWidth={1.5} />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishlistItemCount}
                </span>
              )}
              <span>Избранные</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 mb-1" strokeWidth={1.5} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
              <span>Корзина</span>
            </Link>
            <button
              onClick={handleHeaderAuthClick}
              className="flex flex-col items-center cursor-pointer hover:text-brand transition-colors relative"
              style={{ background: 'transparent', border: 'none', padding: '8px' }}
              type="button"
            >
              {auth.isLoggedIn ? (
                isOnProfilePage ? (
                  <>
                    <LogOut className="w-6 h-6 mb-1" strokeWidth={1.5} />
                    <span>Выйти</span>
                  </>
                ) : (
                  <>
                    <User className="w-6 h-6 mb-1" strokeWidth={1.5} />
                    <span>Профиль</span>
                  </>
                )
              ) : (
                <>
                  <User className="w-6 h-6 mb-1" strokeWidth={1.5} />
                  <span>Войти</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Header */}
      <div className="md:hidden px-4 pt-2 pb-3">
        <div className="flex items-center justify-between mb-3">
          <Link href="/">
            <h1 className="text-xl font-bold text-black tracking-wider cursor-pointer">MARQUE</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            onClick={handleCatalogClick}
          >
            <span className="text-lg">⋮⋮⋮</span>
            <span>Каталог</span>
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Товар, бренд или артикул"
              className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>
      </div>
      
      {/* Authentication Modals */}
      <AuthModals
        isPhoneModalOpen={auth.isPhoneModalOpen}
        setIsPhoneModalOpen={auth.setIsPhoneModalOpen}
        isSmsModalOpen={auth.isSmsModalOpen}
        setIsSmsModalOpen={auth.setIsSmsModalOpen}
        phoneNumber={auth.phoneNumber}
        setPhoneNumber={auth.setPhoneNumber}
        countryCode={auth.countryCode}
        setCountryCode={auth.setCountryCode}
        smsCode={auth.smsCode}
        setSmsCode={auth.setSmsCode}
        handlePhoneSubmit={auth.handlePhoneSubmit}
        handleSmsVerification={auth.handleSmsVerification}
        isSendingSms={auth.isSendingSms}
        isVerifyingCode={auth.isVerifyingCode}
      />
    </>
  )
}
