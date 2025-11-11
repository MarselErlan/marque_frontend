import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { API_CONFIG } from '@/lib/config'
import { authApi } from '@/lib/api'

export interface UserData {
  id?: string
  name?: string
  full_name?: string
  phone?: string
  email?: string
  location?: string
  market?: string
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

  // Modal and form states
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+996")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [onLoginSuccess, setOnLoginSuccess] = useState<(() => void) | null>(null)

  const handleLogout = useCallback(async () => {
    console.log('🔴 Starting logout process...')
    
    try {
      // Call backend logout API first
      const token = localStorage.getItem('authToken')
      if (token) {
        console.log('🔴 Calling backend logout API...')
        await authApi.logout()
        console.log('🔴 Backend logout successful')
      }
    } catch (error) {
      console.error('🔴 Logout API call failed:', error)
      // Continue with local logout even if API fails
    }

    // Clear ALL localStorage items
    console.log('🔴 Clearing localStorage...')
    localStorage.clear() // Clear everything to ensure complete logout
    
    // Or be specific:
    localStorage.removeItem('authToken')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('expiresInMinutes')
    localStorage.removeItem('market')
    localStorage.removeItem('location')
    localStorage.removeItem('userData')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('tokenExpiration')

    console.log('🔴 Setting auth state to logged out...')
    setAuthState({
      isLoggedIn: false,
      userData: null,
      isLoading: false,
    })
    
    // Dispatch event for cart/wishlist to sync
    window.dispatchEvent(new CustomEvent('auth:logout'))
    
    console.log('🔴 User logged out successfully - localStorage cleared:', {
      authToken: localStorage.getItem('authToken'),
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      userData: localStorage.getItem('userData')
    })
  }, [])

  const checkAuthStatus = useCallback(() => {
    try {
      const authToken = localStorage.getItem('authToken')
      const savedUserData = localStorage.getItem('userData')
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      const isLoggedInFlag = localStorage.getItem('isLoggedIn')

      console.log('🔍 Checking auth status:', { 
        authToken: !!authToken, 
        savedUserData: !!savedUserData, 
        tokenExpiration, 
        isLoggedInFlag,
        authTokenValue: authToken,
        savedUserDataValue: savedUserData
      })

      if (isLoggedInFlag === 'true' && authToken && savedUserData) {
        if (tokenExpiration) {
          const expirationTime = parseInt(tokenExpiration, 10)
          const currentTime = new Date().getTime()

          if (currentTime < expirationTime) {
            console.log('Setting auth state to logged in from localStorage')
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
          console.log('Setting auth state to logged in from localStorage (no expiration)')
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

  const handleLogin = useCallback((userData: UserData, authData: any) => {
    try {
      // Backend returns expires_in in seconds, convert to minutes
      const expiresInSeconds = authData.expires_in || (43200 * 60) // 30 days default
      const expiresInMinutes = Math.floor(expiresInSeconds / 60)
      const expirationTime = new Date().getTime() + expiresInSeconds * 1000

      console.log('🔐 Storing auth data in localStorage:', {
        authToken: authData.access_token || authData.token,
        userData: userData,
        expiresInSeconds,
        expirationTime
      })
      
      localStorage.setItem('authToken', authData.access_token || authData.token)
      localStorage.setItem('sessionId', authData.session_id || '')
      localStorage.setItem('expiresInMinutes', expiresInMinutes.toString())
      const resolvedLocation = authData.location || authData.market || 'KG'
      localStorage.setItem('market', resolvedLocation)
      localStorage.setItem('location', resolvedLocation)
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('tokenExpiration', expirationTime.toString())
      
      console.log('🔐 localStorage after storing:', {
        authToken: localStorage.getItem('authToken'),
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        userData: localStorage.getItem('userData')
      })

      setAuthState({
        isLoggedIn: true,
        userData,
        isLoading: false,
      })
      
      console.log('Auth state updated to logged in:', { userData, authData })

      console.log('User logged in successfully:', { userData, authData })
      
      // Dispatch event for cart/wishlist to sync
      window.dispatchEvent(new CustomEvent('auth:login'))

      // Execute and clear the success callback
      if (onLoginSuccess) {
        console.log('Executing login success callback')
        onLoginSuccess()
        setOnLoginSuccess(null)
      } else {
        console.log('No login success callback to execute')
      }
    } catch (error) {
      console.error('Error during login:', error)
    }
  }, [onLoginSuccess])

  const requireAuth = (onSuccess?: () => void) => {
    console.log('requireAuth called:', { isLoggedIn: authState.isLoggedIn, hasCallback: !!onSuccess })
    if (authState.isLoggedIn) {
      console.log('User already logged in, executing callback immediately')
      onSuccess?.()
    } else {
      console.log('User not logged in, opening phone modal')
      if (onSuccess) {
        console.log('Storing callback for after login')
        // Store the callback function to be called after successful login
        setOnLoginSuccess(() => onSuccess)
      }
      setIsPhoneModalOpen(true)
    }
  }

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert('Пожалуйста, введите номер телефона')
      return
    }

    setIsSendingSms(true)
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
    
    console.log("📱 Attempting to send verification code to:", fullPhoneNumber)

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      })

      console.log("📱 API Response Status:", response.status)
      const responseBody = await response.text()
      console.log("📱 API Response Body:", responseBody)

      if (response.ok) {
        const data = JSON.parse(responseBody)
        console.log("📱 SMS sent successfully:", data)
        setIsPhoneModalOpen(false)
        setIsSmsModalOpen(true)
      } else {
        let errorData: any = { message: "Unknown error" }
        try {
          errorData = JSON.parse(responseBody)
        } catch (e) {
          console.error("Could not parse error response JSON:", e)
        }
        alert(`Не удалось отправить SMS: ${errorData.detail || errorData.message || 'Попробуйте еще раз.'}`)
        console.error("Failed to send SMS:", errorData)
      }
    } catch (error) {
      alert('Ошибка подключения. Убедитесь что API сервер запущен.')
      console.error("Network or fetch error:", error)
    } finally {
      setIsSendingSms(false)
    }
  }

  const handleSmsVerification = async () => {
    if (smsCode.length < 6) return

    setIsVerifyingCode(true)
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
      console.log('🔐 Starting SMS verification:', { phone: fullPhoneNumber, code: smsCode })
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_CODE}`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ 
          phone: fullPhoneNumber,
          verification_code: smsCode
        }),
      })

      console.log('🔐 Verification response status:', response.status)
      const responseText = await response.text()
      console.log('🔐 Verification response body:', responseText)

      if (response.ok) {
        const data = JSON.parse(responseText)
        console.log("🔐 Verification response:", data)
        
        // New backend response format - simpler structure
        if (data.access_token && data.user) {
          // Update user data with new fields from backend
          const userData = {
            id: data.user.id,
            phone: data.user.phone,
            name: data.user.name || data.user.full_name,
            full_name: data.user.full_name,
            is_active: data.user.is_active,
            is_verified: data.user.is_verified,
            location: data.location || data.market || 'KG',
            market: data.market,
          }
          
          console.log("🔐 User data:", userData)
          console.log("🔐 Is new user:", data.is_new_user)
          
          handleLogin(userData, data)
        }
        setIsSmsModalOpen(false)
        setSmsCode("")
        setPhoneNumber("")
        setCountryCode("+996")
      } else {
        console.error('🔐 Verification failed:', response.status, responseText)
        const errorData = JSON.parse(responseText)
        alert(errorData.detail || 'Неверный код. Попробуйте еще раз.')
      }
    } catch (error) {
      console.error('🔐 Verification error:', error)
      alert('Ошибка подключения. Проверьте интернет соединение.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  return {
    ...authState,
    isPhoneModalOpen,
    isSmsModalOpen,
    phoneNumber,
    countryCode,
    smsCode,
    isSendingSms,
    isVerifyingCode,
    setIsPhoneModalOpen,
    setIsSmsModalOpen,
    setPhoneNumber,
    setCountryCode,
    setSmsCode,
    handleLogout,
    requireAuth,
    handlePhoneSubmit,
    handleSmsVerification,
  }
}

// Export the return type for use in components
export type UseAuthReturn = ReturnType<typeof useAuth>
