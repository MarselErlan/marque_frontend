import Link from "next/link"
import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-black">
                MARQUE
              </Link>
              <Button variant="outline" className="bg-purple-600 text-white border-purple-600 hover:bg-purple-700">
                📋 Каталог
              </Button>
            </div>

            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск товаров или брендов"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/wishlist" className="flex flex-col items-center text-sm text-gray-600 hover:text-purple-600">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Избранное
              </Link>
              <Link href="/cart" className="flex flex-col items-center text-sm text-gray-600 hover:text-purple-600">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9"
                  />
                </svg>
                Корзина
              </Link>
              <div className="flex flex-col items-center text-sm text-gray-600">
                <div className="w-6 h-6 bg-gray-300 rounded-full mb-1"></div>
                Войти
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-8">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Заказ оформлен и оплачен</h1>

          <p className="text-gray-600 mb-8">Отслеживайте статус заказа в личном кабинете</p>

          <div className="flex space-x-4 justify-center">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">Личный кабинет</Button>
            <Link href="/">
              <Button variant="outline" className="px-8 py-3 bg-transparent">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MARQUE</h3>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Популярные категории</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="/category/men" className="hover:text-white">
                    Мужчинам
                  </Link>
                </li>
                <li>
                  <Link href="/category/women" className="hover:text-white">
                    Женщинам
                  </Link>
                </li>
                <li>
                  <Link href="/category/children" className="hover:text-white">
                    Детям
                  </Link>
                </li>
                <li>
                  <Link href="/category/sport" className="hover:text-white">
                    Спорт
                  </Link>
                </li>
                <li>
                  <Link href="/category/shoes" className="hover:text-white">
                    Обувь
                  </Link>
                </li>
                <li>
                  <Link href="/category/accessories" className="hover:text-white">
                    Аксессуары
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Бренды</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white">
                    Ecco
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Vans
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    MANGO
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    H&M
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    LIME
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    GUCCI
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>Политика конфиденциальности</p>
            <p>Условия пользования</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
