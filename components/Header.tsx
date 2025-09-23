"use client"

import { useState } from 'react'
import { Search, Heart, ShoppingCart, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  isLoggedIn: boolean
  cartItemCount: number
  onCatalogClick: () => void
  onLoginClick: () => void
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  cartItemCount,
  onCatalogClick,
  onLoginClick
}) => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)

  const searchSuggestions = [
    "футболка",
    "футболка мужская", 
    "футболка женская",
    "футболка из хлопка",
    "футболка чёрная",
  ]

  const handleHeaderLoginClick = () => {
    if (isLoggedIn) {
      router.push('/profile')
    } else {
      onLoginClick()
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

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSearchSuggestions(false)
    // TODO: Implement search functionality
  }

  const removeSuggestion = (suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement suggestion removal
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo and Catalog */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-black tracking-wider">MARQUE</h1>
            <Button
              className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg"
              onClick={onCatalogClick}
            >
              <span className="mr-2">⋮⋮⋮</span>
              Каталог
            </Button>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 flex justify-center px-8">
            <div className="relative max-w-2xl w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Товар, бренд или артикул"
                className="pl-10 pr-4 py-2 w-full bg-gray-100 border-0 rounded-lg"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {showSearchSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
                  {searchSuggestions
                    .filter((suggestion) => suggestion.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-center space-x-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{suggestion}</span>
                        </div>
                        <button
                          className="p-1 hover:bg-gray-200 rounded"
                          onClick={(e) => removeSuggestion(suggestion, e)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/wishlist" className="flex flex-col items-center cursor-pointer hover:text-brand">
              <Heart className="w-5 h-5 mb-1" />
              <span>Избранные</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center cursor-pointer hover:text-brand relative">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 mb-1" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
              <span>Корзина</span>
            </Link>
            <button 
              onClick={handleHeaderLoginClick}
              className="flex flex-col items-center cursor-pointer hover:text-brand bg-transparent border-none p-0"
            >
              <User className="w-5 h-5 mb-1" />
              <span>{isLoggedIn ? "Профиль" : "Войти"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
