"use client"

import { useState } from "react"
import { ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/Header"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { useWishlist } from "@/hooks/useWishlist"
import { allProducts, Product } from "@/lib/products" // Using allProducts for recommendations

const categoryData = {
  muzhchinam: {
    title: "Мужчинам",
    subcategories: [
      { name: "Футболки и поло", count: 2352, image: "/images/black-tshirt.jpg", slug: "futbolki-i-polo" },
      { name: "Рубашки", count: 2375, image: "/images/black-tshirt.jpg", slug: "rubashki" },
      { name: "Свитшоты и худи", count: 8533, image: "/images/black-tshirt.jpg", slug: "svitshoty-i-khudi" },
      { name: "Джинсы", count: 1254, image: "/images/black-tshirt.jpg", slug: "dzhinsy" },
      { name: "Брюки и шорты", count: 643, image: "/images/black-tshirt.jpg", slug: "bryuki-i-shorty" },
      { name: "Костюмы и пиджаки", count: 124, image: "/images/black-tshirt.jpg", slug: "kostyumy-i-pidzhaki" },
      { name: "Верхняя одежда", count: 74, image: "/images/black-tshirt.jpg", slug: "verkhnyaya-odezhda" },
      { name: "Спортивная одежда", count: 2362, image: "/images/black-tshirt.jpg", slug: "sportivnaya-odezhda" },
      { name: "Нижнее белье", count: 7634, image: "/images/black-tshirt.jpg", slug: "nizhnee-bele" },
      { name: "Домашняя одежда", count: 23, image: "/images/black-tshirt.jpg", slug: "domashnyaya-odezhda" },
    ],
  },
  zhenshchinam: {
    title: "Женщинам",
    subcategories: [
      { name: "Платья", count: 1254, image: "/images/black-tshirt.jpg", slug: "platya" },
      { name: "Блузки и рубашки", count: 864, image: "/images/black-tshirt.jpg", slug: "bluzki-i-rubashki" },
      { name: "Юбки", count: 532, image: "/images/black-tshirt.jpg", slug: "yubki" },
      { name: "Брюки и джинсы", count: 743, image: "/images/black-tshirt.jpg", slug: "bryuki-i-dzhinsy" },
      { name: "Кофты и свитера", count: 1124, image: "/images/black-tshirt.jpg", slug: "kofty-i-svitera" },
      { name: "Верхняя одежда", count: 234, image: "/images/black-tshirt.jpg", slug: "verkhnyaya-odezhda" },
      { name: "Нижнее белье", count: 2341, image: "/images/black-tshirt.jpg", slug: "nizhnee-bele" },
      { name: "Купальники", count: 145, image: "/images/black-tshirt.jpg", slug: "kupalniki" },
    ],
  },
  detyam: {
    title: "Детям",
    subcategories: [
      { name: "Для мальчиков", count: 1245, image: "/images/black-tshirt.jpg", slug: "dlya-malchikov" },
      { name: "Для девочек", count: 1356, image: "/images/black-tshirt.jpg", slug: "dlya-devochek" },
      { name: "Для малышей", count: 567, image: "/images/black-tshirt.jpg", slug: "dlya-malyshej" },
      { name: "Школьная форма", count: 234, image: "/images/black-tshirt.jpg", slug: "shkolnaya-forma" },
    ],
  },
  obuv: {
    title: "Обувь",
    subcategories: [
      { name: "Кроссовки", count: 2341, image: "/images/white-sneakers.jpg", slug: "krossovki" },
      { name: "Ботинки", count: 654, image: "/images/white-sneakers.jpg", slug: "botinki" },
      { name: "Туфли", count: 432, image: "/images/white-sneakers.jpg", slug: "tufli" },
      { name: "Сандалии", count: 321, image: "/images/white-sneakers.jpg", slug: "sandalii" },
      { name: "Домашняя обувь", count: 156, image: "/images/white-sneakers.jpg", slug: "domashnyaya-obuv" },
    ],
  },
  sport: {
    title: "Спорт",
    subcategories: [
      { name: "Спортивная одежда", count: 1234, image: "/images/male-model-hoodie.jpg", slug: "sportivnaya-odezhda" },
      { name: "Обувь для спорта", count: 876, image: "/images/white-sneakers.jpg", slug: "obuv-dlya-sporta" },
      { name: "Аксессуары", count: 543, image: "/images/black-tshirt.jpg", slug: "aksessuary" },
      { name: "Фитнес", count: 321, image: "/images/black-tshirt.jpg", slug: "fitnes" },
    ],
  },
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const auth = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const category = categoryData[params.slug as keyof typeof categoryData]
  const recommendedProducts = allProducts.slice(0, 8) // Use real product data

  if (!category) {
    return <div>Category not found</div>
  }

  const handleWishlistClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    auth.requireAuth(() => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id)
      } else {
        addToWishlist(product)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Header />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-gray-600 hover:text-brand">
            Главная
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-black">{category.title}</span>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {category.subcategories.map((subcategory, index) => (
            <Link
              key={index}
              href={`/subcategory/${params.slug}/${subcategory.slug}`}
              className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow group flex items-center gap-4"
            >
              <img
                src={subcategory.image || "/placeholder.svg"}
                alt={subcategory.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium text-black group-hover:text-brand">{subcategory.name}</h3>
                <p className="text-gray-500 text-sm">{subcategory.count} товаров</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recommended Products */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">Рекомендуем из этой категории</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recommendedProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-shadow block group">
                <div className="relative mb-3">
                   <div className="absolute top-2 right-2 z-10">
                    <button onClick={(e) => handleWishlistClick(e, product)} className="p-1.5 bg-gray-100/80 rounded-full">
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-700'}`} />
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
                  <div className="text-xs text-gray-500 uppercase font-medium">{product.brand}</div>
                  <h3 className="text-sm font-medium text-black line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-base font-bold text-brand">{product.price} сом</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">{product.originalPrice} сом</span>
                    )}
                  </div>
                   <div className="text-xs text-gray-500">Продано {product.salesCount}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
