/**
 * Currency conversion utilities
 * Handles currency conversion and formatting based on user location
 */

import { currencyApi, Currency } from './api'

// Re-export Currency type
export type { Currency }

// Cache for currencies and exchange rates
let currencyCache: Currency[] | null = null
let currencyCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get user's market from localStorage or phone number
 */
export function getUserMarket(): 'KG' | 'US' {
  if (typeof window === 'undefined') return 'KG'
  
  // First, try to get from localStorage (set during login from user data)
  let market = localStorage.getItem('market') || localStorage.getItem('location')
  
  if (market) {
    const normalized = market.toUpperCase().trim()
    
    // Check for US variations
    if (normalized === 'US' || normalized === 'UNITED STATES' || normalized.includes('US')) {
      return 'US'
    }
    // Check for KG variations
    if (normalized === 'KG' || normalized === 'KGS' || normalized === 'KYRGYZSTAN' || normalized.includes('KG')) {
      return 'KG'
    }
  }
  
  // Fallback: Check user's location from userData (from backend)
  const userDataStr = localStorage.getItem('userData')
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr)
      // Use location from user data (backend provides this)
      const userLocation = userData.location || userData.market
      
      if (userLocation) {
        const normalized = userLocation.toUpperCase().trim()
        if (normalized === 'US' || normalized === 'UNITED STATES' || normalized.includes('US')) {
          return 'US'
        }
        if (normalized === 'KG' || normalized === 'KGS' || normalized === 'KYRGYZSTAN' || normalized.includes('KG')) {
          return 'KG'
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Final fallback: Check auth token or session
  const authToken = localStorage.getItem('authToken')
  if (authToken) {
    // If user is logged in but no market set, default to KG
    // This should be set by backend during login
    return 'KG'
  }
  
  return 'KG' // Default
}

/**
 * Get default currency code for a market
 */
export function getMarketCurrencyCode(market: 'KG' | 'US'): string {
  return market === 'US' ? 'USD' : 'KGS'
}

/**
 * Get default currency symbol for a market
 */
export function getMarketCurrencySymbol(market: 'KG' | 'US'): string {
  return market === 'US' ? '$' : 'сом'
}

/**
 * Load currencies from API (with caching)
 */
export async function loadCurrencies(): Promise<Currency[]> {
  const now = Date.now()
  
  // Return cached currencies if still valid
  if (currencyCache && (now - currencyCacheTime) < CACHE_DURATION) {
    return currencyCache
  }
  
  try {
    currencyCache = await currencyApi.getCurrencies()
    currencyCacheTime = now
    return currencyCache
  } catch (error) {
    console.error('Failed to load currencies:', error)
    // Return fallback currencies
    return [
      {
        id: 1,
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchange_rate: 1.0,
        is_base: true,
        market: 'US',
      },
      {
        id: 2,
        code: 'KGS',
        name: 'Kyrgyzstani Som',
        symbol: 'сом',
        exchange_rate: 89.5,
        is_base: false,
        market: 'KG',
      },
    ]
  }
}

/**
 * Get currency for a market
 */
export async function getCurrencyForMarket(market: 'KG' | 'US'): Promise<Currency | null> {
  const currencies = await loadCurrencies()
  const code = getMarketCurrencyCode(market)
  return currencies.find(c => c.code === code) || null
}

/**
 * Convert price from one currency to another
 */
export async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }
  
  try {
    const response = await currencyApi.convertCurrency(amount, fromCurrency, toCurrency)
    return response.converted_amount
  } catch (error) {
    console.error('Currency conversion failed:', error)
    // Fallback: use hardcoded rates
    const rates: Record<string, number> = {
      USD: 1.0,
      KGS: 89.5,
    }
    const fromRate = rates[fromCurrency] || 1.0
    const toRate = rates[toCurrency] || 1.0
    if (fromRate === 0) return amount
    return (amount / fromRate) * toRate
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currencyCode?: string, currencySymbol?: string): string {
  if (!currencyCode && !currencySymbol) {
    const market = getUserMarket()
    currencySymbol = getMarketCurrencySymbol(market)
  }
  
  const symbol = currencySymbol || ''
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  
  // For KGS, put symbol after the number
  if (currencyCode === 'KGS' || currencySymbol === 'сом') {
    return `${formatted} ${symbol}`
  }
  
  // For USD and others, put symbol before
  return `${symbol}${formatted}`
}

/**
 * Convert and format price for display
 */
export async function convertAndFormatPrice(
  amount: number,
  fromCurrency: string,
  toCurrency?: string
): Promise<string> {
  const targetCurrency = toCurrency || getMarketCurrencyCode(getUserMarket())
  
  if (fromCurrency === targetCurrency) {
    const currency = await getCurrencyForMarket(getUserMarket())
    return formatPrice(amount, targetCurrency, currency?.symbol)
  }
  
  const converted = await convertPrice(amount, fromCurrency, targetCurrency)
  const currency = await getCurrencyForMarket(getUserMarket())
  return formatPrice(converted, targetCurrency, currency?.symbol)
}

/**
 * Get currency info for current user
 */
export async function getUserCurrency(): Promise<Currency | null> {
  const market = getUserMarket()
  return getCurrencyForMarket(market)
}

