import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_CONFIG } from './config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get full image URL from backend path
 * If the URL starts with http/https, return as-is (external URL)
 * Otherwise, prepend the backend base URL
 */
export function getImageUrl(
  imagePath: string | null | undefined,
  fallback: string = '/images/product_placeholder_adobe.png',
): string {
  if (!imagePath) return fallback
  
  // If it's already a full URL (http:// or https://), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If it starts with /uploads/, prepend backend URL
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) {
    // Remove /api/v1 from base URL and add the image path
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '')
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    // Add cache-busting parameter to force reload
    const timestamp = Date.now()
    return `${baseUrl}${cleanPath}?t=${timestamp}`
  }
  
  // If it starts with static/uploads/, prepend backend URL
  if (imagePath.startsWith('static/uploads/')) {
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '')
    return `${baseUrl}/${imagePath}`
  }
  
  // Otherwise return as-is (might be a relative path in public folder)
  return imagePath
}
