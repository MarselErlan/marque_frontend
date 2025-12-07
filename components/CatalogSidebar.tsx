"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight, ArrowLeft, Search } from 'lucide-react'
import { categoriesApi } from '@/lib/api'
import { API_CONFIG } from '@/lib/config'
import { getImageUrl } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface CatalogSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const CatalogSidebar = ({ isOpen, onClose }: CatalogSidebarProps) => {
  const { t } = useLanguage()
  const [apiCategories, setApiCategories] = useState<any[]>([])
  const [apiSubcategories, setApiSubcategories] = useState<any[]>([])
  const [apiSecondSubcategories, setApiSecondSubcategories] = useState<any[]>([])
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
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
      setApiSecondSubcategories([])
      setSelectedSubcategory('')
    }
  }, [selectedCatalogCategory])
  
  // Load second-level subcategories when first-level subcategory is selected
  useEffect(() => {
    if (selectedSubcategory && selectedCatalogCategory) {
      const subcat = apiSubcategories.find(s => s.slug === selectedSubcategory)
      if (subcat?.child_subcategories && subcat.child_subcategories.length > 0) {
        setApiSecondSubcategories(subcat.child_subcategories)
      } else {
        setApiSecondSubcategories([])
      }
    } else {
      setApiSecondSubcategories([])
    }
  }, [selectedSubcategory, apiSubcategories, selectedCatalogCategory])

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

  const loadSubcategories = async (categorySlug: string, categoryProductCount?: number) => {
    try {
      setLoadingSubcategories(true)
      const response = await categoriesApi.getSubcategories(categorySlug)
      if (response?.subcategories) {
        // If no subcategories but category has products, navigate directly to category products
        if (response.subcategories.length === 0 && categoryProductCount && categoryProductCount > 0) {
          // Navigate directly to category products page
          handleSubcategoryClick()
          window.location.href = `/category/${categorySlug}`
          return
        }
        setApiSubcategories(response.subcategories)
      } else {
        setApiSubcategories([])
        // Check if category has products
        if (categoryProductCount && categoryProductCount > 0) {
          // Navigate directly to category products page
          handleSubcategoryClick()
          window.location.href = `/category/${categorySlug}`
          return
        }
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error)
      setApiSubcategories([]) // Clear on error
      // On error, check if category has products and navigate
      if (categoryProductCount && categoryProductCount > 0) {
        handleSubcategoryClick()
        window.location.href = `/category/${categorySlug}`
        return
      }
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const handleClose = () => {
    setSelectedCatalogCategory('')
    setSelectedSubcategory('')
    setSearchQuery('')
    setApiSubcategories([])
    setApiSecondSubcategories([])
    onClose()
  }

  const handleBack = () => {
    if (selectedSubcategory) {
      // Go back from second-level to first-level subcategories
      setSelectedSubcategory('')
      setApiSecondSubcategories([])
    } else {
      // Go back from subcategories to categories
      setSelectedCatalogCategory('')
      setApiSubcategories([])
    }
  }
  
  const handleSubcategorySelect = (subcategorySlug: string, hasChildren: boolean) => {
    if (hasChildren) {
      // Has child subcategories, show Level 3
      setSelectedSubcategory(subcategorySlug)
    } else {
      // No children, navigate directly to products (Level 2)
      handleSubcategoryClick()
    }
  }
  
  const handleSecondSubcategoryClick = (e: React.MouseEvent) => {
    // Close catalog sidebar when navigating to products
    handleSubcategoryClick()
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
                <h2 className="text-xl font-bold text-black">{t('catalog.title')}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                  aria-label={t('catalog.close')}
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
                      placeholder={t('common.search')}
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
                <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
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
                <div className="text-center py-8 text-gray-500">{t('catalog.noCategories')}</div>
              )}
            </nav>
          </>
        ) : !selectedSubcategory ? (
          /* Second Screen - First-Level Subcategories */
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

            {/* First-Level Subcategories List */}
            <div className="px-4 py-2">
              {loadingSubcategories ? (
                <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
              ) : apiSubcategories.length > 0 ? (
                apiSubcategories.map((subcat) => {
                  const hasChildren = subcat.child_subcategories && subcat.child_subcategories.length > 0
                  return (
                    <button
                      key={subcat.id || subcat.slug}
                      onClick={() => handleSubcategorySelect(subcat.slug, hasChildren)}
                      className="w-full flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
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
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">{t('catalog.noSubcategories')}</div>
              )}
            </div>
          </>
        ) : (
          /* Third Screen - Second-Level Subcategories */
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
                <h3 className="text-lg font-bold text-black">
                  {apiSubcategories.find(s => s.slug === selectedSubcategory)?.name || selectedSubcategory}
                </h3>
              </div>
            </div>

            {/* Second-Level Subcategories List */}
            <div className="px-4 py-2">
              {apiSecondSubcategories.length > 0 ? (
                apiSecondSubcategories.map((subcat) => (
                  <Link
                    key={subcat.id || subcat.slug}
                    href={`/subcategory/${selectedCatalogCategory}/${selectedSubcategory}/${subcat.slug}`}
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
                <div className="text-center py-8 text-gray-500">{t('catalog.noSubcategories')}</div>
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
            <h2 className="text-xl font-bold text-black">{t('catalog.title')}</h2>
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
              <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
            ) : apiCategories.length > 0 ? (
              apiCategories.map((category) => {
                // Check if category has products but might not have subcategories
                const hasProducts = category.product_count > 0
                return (
                  <div
                    key={category.id || category.slug}
                    className={`px-4 py-3 rounded-lg cursor-pointer transition-colors mb-1 flex items-center justify-between group ${
                      selectedCatalogCategory === category.slug
                        ? "bg-brand text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      // Load subcategories - if none exist but products do, it will navigate directly
                      setSelectedCatalogCategory(category.slug)
                      loadSubcategories(category.slug, category.product_count)
                    }}
                  >
                    <span>{category.name}</span>
                    <div className="flex items-center space-x-2">
                      {/* Link to category products page - always available */}
                      <Link
                        href={`/category/${category.slug}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubcategoryClick()
                        }}
                        className={`p-1 rounded hover:bg-white/20 transition-colors ${
                          selectedCatalogCategory === category.slug ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="View all products in this category"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">Нет категорий</div>
            )}
          </nav>
        </div>

        {/* Second Sidebar - First-Level Subcategories */}
        {selectedCatalogCategory && (
          <div 
            className="fixed inset-y-0 left-80 w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 border-l border-gray-200"
          >
            {/* Subcategories Header with X button */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">{selectedCategoryName}</h3>
              <button
                onClick={() => {
                  setSelectedCatalogCategory('')
                  setSelectedSubcategory('')
                  setApiSubcategories([])
                  setApiSecondSubcategories([])
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Close subcategories"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* First-Level Subcategories List */}
            <div className="p-4">
              {loadingSubcategories ? (
                <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
              ) : apiSubcategories.length > 0 ? (
                apiSubcategories.map((subcat) => {
                  const hasChildren = subcat.child_subcategories && subcat.child_subcategories.length > 0
                  const isSelected = selectedSubcategory === subcat.slug
                  
                  // If no children, use Link to navigate directly
                  if (!hasChildren) {
                    return (
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
                    )
                  }
                  
                  // If has children, allow both expanding and navigating
                  return (
                    <div key={subcat.id || subcat.slug} className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => handleSubcategorySelect(subcat.slug, hasChildren)}
                        className={`flex-1 flex items-center justify-between px-4 py-4 rounded-lg transition-colors group ${
                          isSelected 
                            ? "bg-brand/10 border border-brand" 
                            : "hover:bg-gray-50"
                        }`}
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
                          <span className={`text-base font-normal group-hover:text-brand transition-colors ${
                            isSelected ? "text-brand font-semibold" : "text-black"
                          }`}>
                            {subcat.name}
                          </span>
                        </div>

                        {/* Right: Count + Arrow */}
                        <div className="flex items-center space-x-4 flex-shrink-0">
                          <span className="text-sm text-gray-500 font-normal">{subcat.product_count || 0}</span>
                          <ArrowRight className={`w-5 h-5 transition-colors ${
                            isSelected ? "text-brand" : "text-gray-400 group-hover:text-brand"
                          }`} />
                        </div>
                      </button>
                      {/* Direct link to products */}
                      <Link
                        href={`/subcategory/${selectedCatalogCategory}/${subcat.slug}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubcategoryClick()
                        }}
                        className="px-3 py-4 text-gray-400 hover:text-brand transition-colors"
                        title="View products"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">{t('catalog.noSubcategories')}</div>
              )}
            </div>
          </div>
        )}

        {/* Third Sidebar - Second-Level Subcategories */}
        {selectedCatalogCategory && selectedSubcategory && apiSecondSubcategories.length > 0 && (
          <div 
            className="fixed inset-y-0 left-[29rem] w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-left duration-200 border-l border-gray-200"
          >
            {/* Second-Level Subcategories Header with X button */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">
                {apiSubcategories.find(s => s.slug === selectedSubcategory)?.name || selectedSubcategory}
              </h3>
              <button
                onClick={() => {
                  setSelectedSubcategory('')
                  setApiSecondSubcategories([])
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Close second-level subcategories"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Second-Level Subcategories List */}
            <div className="p-4">
              {apiSecondSubcategories.map((subcat) => (
                <Link
                  key={subcat.id || subcat.slug}
                  href={`/subcategory/${selectedCatalogCategory}/${selectedSubcategory}/${subcat.slug}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-lg transition-colors group mb-2"
                  onClick={handleSecondSubcategoryClick}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

