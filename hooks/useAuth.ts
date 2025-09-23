import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { API_CONFIG } from '@/lib/config'

export interface UserData {
  id?: string
  name?: string
  full_name?: string
  phone?: string
  email?: string
}

export interface AuthState {
  isLoggedIn: boolean
  userData: UserData | null
  isLoading: boolean
}

export const useAuth = () => {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userData: null,
    isLoading: true,
  })

  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('expiresInMinutes')
    localStorage.removeItem('market')
    localStorage.removeItem('userData')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('tokenExpiration')

    setAuthState({
      isLoggedIn: false,
      userData: null,
      isLoading: false,
    })
    console.log('User logged out successfully')
  }, [])

  // Check authentication status
  const checkAuthStatus = useCallback(() => {
    try {
      const authToken = localStorage.getItem('authToken')
      const savedUserData = localStorage.getItem('userData')
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      const isLoggedInFlag = localStorage.getItem('isLoggedIn')

      if (isLoggedInFlag === 'true' && authToken && savedUserData) {
        if (tokenExpiration) {
          const expirationTime = parseInt(tokenExpiration, 10)
          const currentTime = new Date().getTime()

          if (currentTime < expirationTime) {
            setAuthState({
              isLoggedIn: true,
              userData: JSON.parse(savedUserData),
              isLoading: false,
            })
          } else {
            console.log('Token expired, logging out user')
            handleLogout()
          }
        } else {
          setAuthState({
            isLoggedIn: true,
            userData: JSON.parse(savedUserData),
            isLoading: false,
          })
        }
      } else {
        setAuthState({
          isLoggedIn: false,
          userData: null,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAuthState({
        isLoggedIn: false,
        userData: null,
        isLoading: false,
      })
    }
  }, [handleLogout])

  // Login function
  const handleLogin = (userData: UserData, authData: any) => {
    try {
      // Calculate token expiration (30 days from now)
      const expiresInMinutes = authData.expires_in_minutes || 43200 // 30 days
      const expirationTime = new Date().getTime() + expiresInMinutes * 60 * 1000

      // Store authentication data
      localStorage.setItem('authToken', authData.access_token || authData.token)
      localStorage.setItem('tokenType', authData.token_type || 'bearer')
      localStorage.setItem('sessionId', authData.session_id || '')
      localStorage.setItem(
        'expiresInMinutes',
        expiresInMinutes.toString(),
      )
      localStorage.setItem('market', authData.market || 'KG')
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('tokenExpiration', expirationTime.toString())

      setAuthState({
        isLoggedIn: true,
        userData,
        isLoading: false,
      })

      console.log('User logged in successfully')
    } catch (error) {
      console.error('Error during login:', error)
    }
  }

  // Initialize auth check
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  return {
    ...authState,
    checkAuthStatus,
    handleLogout,
    handleLogin,
  }
}
