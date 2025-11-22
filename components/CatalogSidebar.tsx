"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight, ArrowLeft, Search } from 'lucide-react'
import { categoriesApi } from '@/lib/api'
import { API_CONFIG } from '@/lib/config'
import { getImageUrl } from '@/lib/utils'

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
  const [searchQuery, setSearchQuery] = useState('')

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
    setSearchQuery('')
    onClose()
  }

  const handleBack = () => {
    setSelectedCatalogCategory('')
    setApiSubcategories([])
  }

  const handleSubcategoryClick = () => {
    handleClose()
  }

  if (!isOpen) return null

  const selectedCategoryName = apiCategories.find(cat => cat.slug === selectedCatalogCategory)?.name || selectedCatalogCategory

  // Filter categories by search
  const filteredCategories = apiCategories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={handleClose}
      />

      {/* Mobile: Full Screen Modal */}
      <div className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto">
        {!selectedCatalogCategory ? (
          /* First Screen - Main Categories */
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-xl font-bold text-black">Каталог</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                  aria-label="Закрыть каталог"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="w-8 h-8 bg-brand rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex-1 pl-3 pr-4 py-2.5 bg-gray-100 rounded-lg flex items-center">
                    <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Товар, бренд или артикул"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Categories List */}
            <nav className="px-4 py-2">
              {loadingCategories ? (
                <div className="text-center py-8 text-gray-500">Загрузка...</div>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <button
                    key={category.id || category.slug}
                    onClick={() => setSelectedCatalogCategory(category.slug)}
                    className="w-full bg-white rounded-lg px-4 py-3 mb-1 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base font-normal text-black">{category.name}</span>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">Нет категорий</div>
              )}
            </nav>
          </>
        ) : (
          /* Second Screen - Subcategories */
          <>
            {/* Header with Back Button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center px-4 py-3">
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-lg font-bold text-black">{selectedCategoryName}</h3>
              </div>
            </div>

            {/* Subcategories List */}
            <div className="px-4 py-2">
              {loadingSubcategories ? (
                <div className="text-center py-8 text-gray-500">Загрузка...</div>
              ) : apiSubcategories.length > 0 ? (
                apiSubcategories.map((subcat) => (
                  <Link
                    key={subcat.id || subcat.slug}
                    href={`/subcategory/${selectedCatalogCategory}/${subcat.slug}`}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    onClick={handleSubcategoryClick}
                  >
                    {/* Left: Thumbnail + Name */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Subcategory Thumbnail */}
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={
                            subcat.image_url 
                              ? getImageUrl(subcat.image_url)
                              : '/images/product_placeholder_adobe.png'
                          }
                          alt={subcat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/product_placeholder_adobe.png'
                          }}
                        />
                      </div>

                      {/* Subcategory Name */}
                      <span className="text-base font-normal text-black truncate">
                        {subcat.name}
                      </span>
                    </div>

                    {/* Right: Count + Arrow */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-sm text-gray-500">{subcat.product_count || 0}</span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">Нет подкатегорий</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop: Sidebar (unchanged) */}
      <div className="hidden md:block">
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

        {/* Second Sidebar - Subcategories */}
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
                          src={
                            subcat.image_url 
                              ? getImageUrl(subcat.image_url)
                              : '/images/product_placeholder_adobe.png'
                          }
                          alt={subcat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/product_placeholder_adobe.png'
                          }}
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
      </div>
    </>
  )
}

