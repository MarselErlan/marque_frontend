import { useState, useEffect } from 'react'
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
    isLoading: true
  })

  // Check authentication status
  const checkAuthStatus = () => {
    try {
      const authToken = localStorage.getItem('authToken')
      const savedUserData = localStorage.getItem('userData')
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      const isLoggedInFlag = localStorage.getItem('isLoggedIn')
      
      if (isLoggedInFlag === 'true' && authToken && savedUserData) {
        if (tokenExpiration) {
          const expirationTime = parseInt(tokenExpiration)
          const currentTime = new Date().getTime()
          
          if (currentTime < expirationTime) {
            setAuthState({
              isLoggedIn: true,
              userData: JSON.parse(savedUserData),
              isLoading: false
            })
            return
          } else {
            console.log('Token expired, logging out user')
            handleLogout()
            return
          }
        } else {
          setAuthState({
            isLoggedIn: true,
            userData: JSON.parse(savedUserData),
            isLoading: false
          })
          return
        }
      }
      
      setAuthState({
        isLoggedIn: false,
        userData: null,
        isLoading: false
      })
    } catch (error) {
      console.error('Error checking auth status:', error)
      setAuthState({
        isLoggedIn: false,
        userData: null,
        isLoading: false
      })
    }
  }

  // Logout function
  const handleLogout = () => {
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
      isLoading: false
    })
    
    console.log('User logged out successfully')
  }

  // Login function
  const handleLogin = (userData: UserData, authData: any) => {
    try {
      // Calculate token expiration (30 days from now)
      const expirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000)
      
      // Store authentication data
      localStorage.setItem('authToken', authData.access_token || authData.token)
      localStorage.setItem('tokenType', authData.token_type || 'bearer')
      localStorage.setItem('sessionId', authData.session_id || '')
      localStorage.setItem('expiresInMinutes', authData.expires_in_minutes?.toString() || '43200')
      localStorage.setItem('market', authData.market || 'KG')
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('tokenExpiration', expirationTime.toString())

      setAuthState({
        isLoggedIn: true,
        userData,
        isLoading: false
      })

      console.log('User logged in successfully')
    } catch (error) {
      console.error('Error during login:', error)
    }
  }

  // Initialize auth check
  useEffect(() => {
    checkAuthStatus()
  }, [])

  return {
    ...authState,
    checkAuthStatus,
    handleLogout,
    handleLogin
  }
}
