"use client"
import { useState } from "react"
import { Search, Heart, ShoppingCart, User, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function ProductDetailPage() {
  const params = useParams()
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedColor, setSelectedColor] = useState("black")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Mock product data - in real app this would come from API
  const product = {
    id: params.id,
    name: "Футболка спорт из хлопка",
    price: "2999 сом",
    rating: 4.4,
    reviewCount: 20,
    sold: 120,
    images: [
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
      "/images/black-tshirt.jpg",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "black", label: "Чёрный", color: "#000000" },
      { name: "white", label: "Белый", color: "#FFFFFF" },
    ],
    description: `В нем сочетается, что мы ценим в спортивной одежде: быстро сохнущий, с легким охлаждающим эффектом, эластичный и дышащий. Эта футболка обеспечивает максимальный комфорт во время тренировок. Футболка обладает отличной посадкой, высоким качеством материалов, отличным качеством пошива и стильным дизайном.`,
    specifications: {
      Пол: "Мужской/Женский",
      Цвет: "Чёрный",
      Материал: "100% хлопок, 180г/м²",
      Сезон: "Мужской",
      Страна: "Турция",
      Бренд: "Турция",
    },
  }

  const reviews = [
    {
      id: 1,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
    {
      id: 2,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
    {
      id: 3,
      author: "Aza De Artma",
      rating: 5,
      date: "11/09/2024",
      text: "Я нет сомнений, что эта одежда спортивная одежда будет радовать меня с удобной посадкой и высоким качеством материалов. Рекомендую всем спортсменам! Товары хорошей качества характеристики товара соответствуют заявленным показателям, высокое качество пошива...",
      images: [
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
        "/images/black-tshirt.jpg",
      ],
    },
  ]

  const similarProducts = [
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
  ]

  const handleAddToCart = () => {
    console.log("Added to cart:", { productId: product.id, size: selectedSize, color: selectedColor, quantity })
  }

  const handleCompare = () => {
    console.log("Added to compare:", product.id)
  }

  const handleWishlist = () => {
    console.log("Added to wishlist:", product.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-black tracking-wider">
                MARQUE
              </Link>
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
                <div className="flex flex-col items-center cursor-pointer hover:text-purple-600">
                  <Heart className="w-5 h-5 mb-1" />
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
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/category/мужчинам" className="hover:text-purple-600">
            Мужчинам
          </Link>
          <span>›</span>
          <Link href="/subcategory/мужчинам/футболки-и-поло" className="hover:text-purple-600">
            Футболки и поло
          </Link>
          <span>›</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImageIndex] || "/placeholder.svg?height=500&width=500&query=black t-shirt"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-purple-500" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image || "/placeholder.svg?height=80&width=80&query=black t-shirt"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Продано {product.sold}</span>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span>
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Размер</h3>
              <div className="flex space-x-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-4 py-2 border rounded-lg ${
                      selectedSize === size
                        ? "border-purple-500 bg-purple-50 text-purple-600"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">Цвет</h3>
              <div className="flex space-x-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color.name ? "border-purple-500" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.color }}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.label}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">Чёрный</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg"
                onClick={handleAddToCart}
              >
                Добавить в корзину
              </Button>
              <Button variant="outline" className="px-6 py-3 rounded-lg bg-transparent" onClick={handleCompare}>
                Сравнить товар
              </Button>
              <Button variant="outline" size="icon" className="p-3 rounded-lg bg-transparent" onClick={handleWishlist}>
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-4">О товаре</h2>
          <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>

          {/* Specifications Table */}
          <div className="bg-white rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600">{key}</span>
                  <span className="text-black font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Отзывы</h2>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              ВСЕ ОТЗЫВЫ →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {review.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">{review.author}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-4">{review.text}</p>

                <div className="flex space-x-2">
                  {review.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image || "/placeholder.svg?height=60&width=60&query=product review"}
                      alt={`Review ${index + 1}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Similar Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">Похожие товары</h2>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              ВСЕ ТОВАРЫ →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative mb-4">
                  <img
                    src={product.image || "/placeholder.svg?height=200&width=200&query=black t-shirt"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                    <Heart className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <h3 className="text-sm font-medium text-black mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-purple-600">{product.price}</span>
                  <span className="text-xs text-gray-500">Продано {product.sold}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
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
