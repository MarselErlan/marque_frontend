/**
 * React hook for currency conversion and formatting
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getUserMarket,
  getCurrencyForMarket,
  convertPrice,
  formatPrice,
  convertAndFormatPrice,
  getUserCurrency,
  Currency,
} from '@/lib/currency'

export interface UseCurrencyReturn {
  market: 'KG' | 'US'
  currency: Currency | null
  currencyCode: string
  currencySymbol: string
  isLoading: boolean
  convert: (amount: number, fromCurrency: string) => Promise<number>
  format: (amount: number, fromCurrency?: string) => Promise<string>
  formatDirect: (amount: number, currencyCode?: string, currencySymbol?: string) => string
}

export function useCurrency(): UseCurrencyReturn {
  const [market, setMarket] = useState<'KG' | 'US'>('KG')
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load currency on mount and when market changes
  useEffect(() => {
    const loadCurrency = async () => {
      setIsLoading(true)
      try {
        const userMarket = getUserMarket()
        setMarket(userMarket)
        const userCurrency = await getCurrencyForMarket(userMarket)
        setCurrency(userCurrency)
      } catch (error) {
        console.error('Failed to load currency:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCurrency()

    // Listen for market changes
    const handleStorageChange = () => {
      loadCurrency()
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically (in case localStorage changes in same tab)
    const interval = setInterval(loadCurrency, 10000) // Check every 10 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const convert = useCallback(async (amount: number, fromCurrency: string): Promise<number> => {
    if (!currency) return amount
    if (fromCurrency === currency.code) return amount
    return convertPrice(amount, fromCurrency, currency.code)
  }, [currency])

  const format = useCallback(async (amount: number, fromCurrency?: string): Promise<string> => {
    if (!currency) {
      return formatPrice(amount, undefined, market === 'US' ? '$' : 'сом')
    }
    
    if (fromCurrency && fromCurrency !== currency.code) {
      const converted = await convertPrice(amount, fromCurrency, currency.code)
      return formatPrice(converted, currency.code, currency.symbol)
    }
    
    return formatPrice(amount, currency.code, currency.symbol)
  }, [currency, market])

  const formatDirect = useCallback(
    (amount: number, currencyCode?: string, currencySymbol?: string): string => {
      return formatPrice(amount, currencyCode || currency?.code, currencySymbol || currency?.symbol)
    },
    [currency]
  )

  return {
    market,
    currency,
    currencyCode: currency?.code || (market === 'US' ? 'USD' : 'KGS'),
    currencySymbol: currency?.symbol || (market === 'US' ? '$' : 'сом'),
    isLoading,
    convert,
    format,
    formatDirect,
  }
}

