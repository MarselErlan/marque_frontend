"use client"

import { useState } from "react"
import { ChevronLeft, Heart, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

const recommendedProducts = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: "Футболка спорт. из хлопка",
  price: 2999,
  sold: 23,
  image: "/images/black-tshirt.jpg",
}))

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [favorites, setFavorites] = useState<number[]>([])
  const category = categoryData[params.slug as keyof typeof categoryData]

  if (!category) {
    return <div>Category not found</div>
  }

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-2xl font-bold text-gray-900">MARQUE</div>
            <Button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg">📋 Каталог</Button>
            <div className="relative">
              <input
                type="text"
                placeholder="Товар, бренд или артикул"
                className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
              <Heart className="w-5 h-5" />
              <span>Избранные</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
              <ShoppingCart className="w-5 h-5" />
              <span>Корзина</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
              <User className="w-5 h-5" />
              <span>Войти</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" />
            {category.title}
          </Link>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {category.subcategories.map((subcategory, index) => (
            <Link
              key={index}
              href={`/subcategory/${params.slug}/${subcategory.slug}`}
              className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <img
                  src={subcategory.image || "/placeholder.svg"}
                  alt={subcategory.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-brand">{subcategory.name}</h3>
                  <p className="text-gray-500 text-sm">{subcategory.count}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recommended Products */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Рекомендуем из этой категории</h2>
          <div className="grid grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-brand font-bold">{product.price} сом</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Продано {product.sold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-6">MARQUE</h3>
              <div className="space-y-4">
                <h4 className="font-semibold">Популярные категории</h4>
                <div className="space-y-2 text-gray-300">
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
              <div className="space-y-4">
                <h4 className="font-semibold">Бренды</h4>
                <div className="space-y-2 text-gray-300">
                  <div>Ecco</div>
                  <div>Vans</div>
                  <div>MANGO</div>
                  <div>H&M</div>
                  <div>LIME</div>
                  <div>GUCCI</div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex justify-between text-gray-400">
            <div>Политика конфиденциальности</div>
            <div>Условия пользования</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
