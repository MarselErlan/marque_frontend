import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_CONFIG } from './config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const removeTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const ensureSecureProtocol = (url: string) => {
  if (!url) return url
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    return `https://${url.slice('http://'.length)}`
  }
  return url
}

const getBackendBaseUrl = () => {
  const apiBase = removeTrailingSlash(API_CONFIG.BASE_URL || '')
  if (!apiBase) return ''
  const withoutApi = apiBase.replace(/\/api\/v1$/i, '')
  return ensureSecureProtocol(removeTrailingSlash(withoutApi || apiBase))
}

/**
 * Get full image URL from backend path
 * If the URL starts with http/https, return as-is (external URL)
 * Otherwise, prepend the backend base URL.
 * We also ensure we don't request insecure (http) assets from an https page.
 */
export function getImageUrl(
  imagePath: string | null | undefined,
  fallback: string = '/images/product_placeholder_adobe.png',
): string {
  if (!imagePath) return fallback
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return ensureSecureProtocol(imagePath)
  }
  
  const backendBaseUrl = getBackendBaseUrl()
  if (!backendBaseUrl) {
    return fallback
  }
  
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    const timestamp = Date.now()
    return `${backendBaseUrl}${cleanPath}?t=${timestamp}`
  }
  
  if (imagePath.startsWith('static/uploads/')) {
    return `${backendBaseUrl}/${imagePath}`
  }
  
  return imagePath
}
