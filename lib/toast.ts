/**
 * Toast Notification Utility
 * Wrapper around Sonner for consistent toast notifications
 */

import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) =>
    sonnerToast.success(message, {
      duration: 3000,
      position: 'top-right',
    }),
  
  error: (message: string) =>
    sonnerToast.error(message, {
      duration: 4000,
      position: 'top-right',
    }),
  
  loading: (message: string) => sonnerToast.loading(message),
  
  promise: sonnerToast.promise,
  
  info: (message: string) =>
    sonnerToast.info(message, {
      duration: 3000,
      position: 'top-right',
    }),
  
  warning: (message: string) =>
    sonnerToast.warning(message, {
      duration: 3500,
      position: 'top-right',
    }),
}

