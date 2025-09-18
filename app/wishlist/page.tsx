"use client"
import { useState } from "react"
import { Search, Heart, ShoppingCart, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function WishlistPage() {
  // Mock wishlist state - in real app this would come from context/store
  const [wishlistItems, setWishlistItems] = useState([
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
  ])

  const removeFromWishlist = (productId: number) => {
    setWishlistItems((items) => items.filter((item) => item.id !== productId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black tracking-wider">MARQUE</h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg">
                <span className="mr-2">⋮⋮⋮</span>
                Каталог
              </Button>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Товар, бренд или артикул"
                  className="pl-10 pr-4 py-2 w-80 bg-gray-100 border-0 rounded-lg"
                />
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex flex-col items-center cursor-pointer text-purple-600">
                  <Heart className="w-5 h-5 mb-1 fill-current" />
                  <span>Избранные</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  <span>Корзина</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                  <User className="w-5 h-5 mb-1" />
                  <span>Войти</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/" className="text-gray-600 hover:text-purple-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-black">Избранные</h1>
          {wishlistItems.length > 0 && <span className="text-gray-500">{wishlistItems.length} товара</span>}
        </div>

        {wishlistItems.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-black mb-2">Список пуст</h2>
            <p className="text-gray-600 mb-8 text-center">Перейдите в каталог чтобы добавить в избранное</p>
            <Link href="/catalog">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg">В каталог</Button>
            </Link>
          </div>
        ) : (
          // Wishlist Items
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative mb-4">
                  <Link href={`/product/${product.id}`}>
                    <img
                      src={product.image || "/placeholder.svg?height=200&width=200&query=black t-shirt"}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </Link>
                  <button
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </button>
                </div>
                <Link href={`/product/${product.id}`}>
                  <h3 className="text-sm font-medium text-black mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600">{product.price}</span>
                    <span className="text-xs text-gray-500">Продано {product.sold}</span>
                  </div>
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
