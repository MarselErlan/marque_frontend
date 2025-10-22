"use client"

import Link from "next/link"
import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"

export default function OrderSuccessPage() {
  const auth = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
    
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-8">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Заказ оформлен и оплачен</h1>

          <p className="text-gray-600 mb-8">Отслеживайте статус заказа в личном кабинете</p>

          <div className="flex space-x-4 justify-center">
            <Link href="/profile">
              <Button className="bg-brand hover:bg-brand-hover text-white px-8 py-3">Личный кабинет</Button>
            </Link>
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
