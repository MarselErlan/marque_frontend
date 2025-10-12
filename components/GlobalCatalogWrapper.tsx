"use client"

import { useCatalog } from '@/contexts/CatalogContext'
import { CatalogSidebar } from './CatalogSidebar'

export const GlobalCatalogWrapper = () => {
  const { isOpen, closeCatalog } = useCatalog()
  
  return <CatalogSidebar isOpen={isOpen} onClose={closeCatalog} />
}

