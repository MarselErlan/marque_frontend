"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface CatalogContextType {
  isOpen: boolean
  openCatalog: () => void
  closeCatalog: () => void
  toggleCatalog: () => void
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export const CatalogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  const openCatalog = () => setIsOpen(true)
  const closeCatalog = () => setIsOpen(false)
  const toggleCatalog = () => setIsOpen(prev => !prev)

  return (
    <CatalogContext.Provider value={{ isOpen, openCatalog, closeCatalog, toggleCatalog }}>
      {children}
    </CatalogContext.Provider>
  )
}

export const useCatalog = () => {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider')
  }
  return context
}

