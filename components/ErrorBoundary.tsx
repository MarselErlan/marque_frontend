/**
 * Error Boundary Component
 * Catches React errors and prevents the entire app from crashing
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  translations?: {
    title: string
    message: string
    errorDetails: string
    refreshPage: string
    goToHome: string
  }
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo)
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const { translations } = this.props
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {translations?.title || 'Что-то пошло не так'}
            </h1>
            
            <p className="text-gray-600 mb-2">
              {translations?.message || 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу.'}
            </p>
            
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left bg-red-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-red-800 mb-2">
                  {translations?.errorDetails || 'Детали ошибки (только в dev режиме)'}
                </summary>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-brand hover:bg-brand-hover text-white"
              >
                {translations?.refreshPage || 'Обновить страницу'}
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                {translations?.goToHome || 'На главную'}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  
  return (
    <ErrorBoundaryClass
      translations={{
        title: t('error.title'),
        message: t('error.message'),
        errorDetails: t('error.details'),
        refreshPage: t('error.refreshPage'),
        goToHome: t('common.goToHome'),
      }}
    >
      {children}
    </ErrorBoundaryClass>
  )
}

