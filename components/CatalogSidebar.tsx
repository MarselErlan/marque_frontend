"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { categoriesApi } from '@/lib/api'

interface CatalogSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const CatalogSidebar = ({ isOpen, onClose }: CatalogSidebarProps) => {
  const [apiCategories, setApiCategories] = useState<any[]>([])
  const [apiSubcategories, setApiSubcategories] = useState<any[]>([])
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)

  // Load categories from API
  useEffect(() => {
    if (isOpen && apiCategories.length === 0) {
      loadCategories()
    }
  }, [isOpen])

  // Load subcategories when category is selected
  useEffect(() => {
    if (selectedCatalogCategory) {
      loadSubcategories(selectedCatalogCategory)
    } else {
      setApiSubcategories([])
    }
  }, [selectedCatalogCategory])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await categoriesApi.getAll()
      if (response?.categories) {
        setApiCategories(response.categories)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      setApiCategories([]) // Clear on error
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadSubcategories = async (categorySlug: string) => {
    try {
      setLoadingSubcategories(true)
      const response = await categoriesApi.getSubcategories(categorySlug)
      if (response?.subcategories) {
        setApiSubcategories(response.subcategories)
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error)
      setApiSubcategories([]) // Clear on error
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const handleClose = () => {
    setSelectedCatalogCategory('')
    onClose()
  }

  const handleSubcategoryClick = () => {
    handleClose()
  }

  if (!isOpen) return null

  const selectedCategoryName = apiCategories.find(cat => cat.slug === selectedCatalogCategory)?.name || selectedCatalogCategory

  return (
    <>
      {/* First Sidebar - Main Categories */}
      <div 
        className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 overflow-y-auto animate-in slide-in-from-left duration-300"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Каталог</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Main Categories List */}
        <nav className="p-4">
          {loadingCategories ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : apiCategories.length > 0 ? (
            apiCategories.map((category) => (
              <div
                key={category.id || category.slug}
                className={`px-4 py-3 rounded-lg cursor-pointer transition-colors mb-1 flex items-center justify-between ${
                  selectedCatalogCategory === category.slug
                    ? "bg-brand text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedCatalogCategory(category.slug)}
              >
                <span>{category.name}</span>
                <ArrowRight className={`w-4 h-4 ${selectedCatalogCategory === category.slug ? 'text-white' : 'text-gray-400'}`} />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">Нет категорий</div>
          )}
        </nav>
      </div>

      {/* Second Sidebar - Subcategories (opens to the right of first sidebar) */}
      {selectedCatalogCategory && (
        <div 
          className="fixed inset-y-0 left-80 w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 border-l border-gray-200"
        >
          {/* Subcategories Header */}
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-xl font-bold text-black">{selectedCategoryName}</h3>
          </div>

          {/* Subcategories List */}
          <div className="p-4">
            {loadingSubcategories ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : apiSubcategories.length > 0 ? (
              apiSubcategories.map((subcat) => (
                <Link
                  key={subcat.id || subcat.slug}
                  href={`/subcategory/${selectedCatalogCategory}/${subcat.slug}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-lg transition-colors group mb-2"
                  onClick={handleSubcategoryClick}
                >
                  {/* Left: Icon + Name */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Subcategory Icon/Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={subcat.image_url || '/images/placeholder.png'}
                        alt={subcat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Subcategory Name */}
                    <span className="text-base font-normal text-black group-hover:text-brand transition-colors">
                      {subcat.name}
                    </span>
                  </div>

                  {/* Right: Count + Arrow */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    <span className="text-sm text-gray-500 font-normal">{subcat.product_count || 0}</span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">Нет подкатегорий</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

