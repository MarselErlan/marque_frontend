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

// App Configuration
export const APP_CONFIG = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://marque.website',
  APP_NAME: 'MARQUE',
  APP_DESCRIPTION: 'Fashion E-commerce Platform',
} as const
