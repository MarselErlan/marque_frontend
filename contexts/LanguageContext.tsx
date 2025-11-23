"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'ru' | 'ky' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with saved language or default to 'ru'
  // Use lazy initializer to read from localStorage only on first render
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language
      if (savedLang && ['ru', 'ky', 'en'].includes(savedLang)) {
        return savedLang
      }
    }
    return 'ru'
  })
  const [translations, setTranslations] = useState<Record<string, any>>({})

  // Load language from localStorage on mount (in case it was changed externally)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language
      if (savedLang && ['ru', 'ky', 'en'].includes(savedLang) && savedLang !== language) {
        setLanguageState(savedLang)
      }
    }
  }, [language])

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`@/locales/${language}.json`)
        setTranslations(module.default)
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error)
      }
    }
    loadTranslations()
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  // Translation function with fallback
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

