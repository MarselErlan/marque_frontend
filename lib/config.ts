// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://marquebackend-production.up.railway.app/api/v1',
  ENDPOINTS: {
    SEND_VERIFICATION: '/auth/send-verification',
    VERIFY_CODE: '/auth/verify-code',
    LOGOUT: '/auth/logout',
    USER_PROFILE: '/users/profile',
    USER_SESSIONS: '/auth/sessions',
  }
} as const

// Debug: Log the actual API URL being used
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration Debug:')
  console.log('- NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL)
  console.log('- Actual BASE_URL being used:', API_CONFIG.BASE_URL)
  console.log('- Full send-verification URL:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SEND_VERIFICATION)
}

// App Configuration
export const APP_CONFIG = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://marque.website',
  APP_NAME: 'MARQUE',
  APP_DESCRIPTION: 'Fashion E-commerce Platform',
} as const
