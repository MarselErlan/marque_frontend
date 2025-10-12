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

  // Modal and form states
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+996")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [onLoginSuccess, setOnLoginSuccess] = useState<(() => void) | null>(null)

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
    
    // Dispatch event for cart/wishlist to sync
    window.dispatchEvent(new CustomEvent('auth:logout'))
    
    console.log('User logged out successfully')
  }, [])

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

  const handleLogin = useCallback((userData: UserData, authData: any) => {
    try {
      const expiresInMinutes = authData.expires_in_minutes || 43200 // 30 days
      const expirationTime = new Date().getTime() + expiresInMinutes * 60 * 1000

      localStorage.setItem('authToken', authData.access_token || authData.token)
      localStorage.setItem('tokenType', authData.token_type || 'bearer')
      localStorage.setItem('sessionId', authData.session_id || '')
      localStorage.setItem('expiresInMinutes', expiresInMinutes.toString())
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
      
      // Dispatch event for cart/wishlist to sync
      window.dispatchEvent(new CustomEvent('auth:login'))

      // Execute and clear the success callback
      if (onLoginSuccess) {
        onLoginSuccess()
        setOnLoginSuccess(null)
      }
    } catch (error) {
      console.error('Error during login:', error)
    }
  }, [onLoginSuccess])

  const requireAuth = (onSuccess?: () => void) => {
    if (authState.isLoggedIn) {
      onSuccess?.()
    } else {
      if (onSuccess) {
        // Store the callback function directly, not a function that returns it
        setOnLoginSuccess(() => () => onSuccess())
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
    
    console.log("Attempting to send verification code to:", fullPhoneNumber)

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      })

      console.log("API Response Status:", response.status)
      const responseBody = await response.text()
      console.log("API Response Body:", responseBody)

      if (response.ok) {
        setIsPhoneModalOpen(false)
        setIsSmsModalOpen(true)
      } else {
        let errorData = { message: "Unknown error" }
        try {
          errorData = JSON.parse(responseBody)
        } catch (e) {
          console.error("Could not parse error response JSON:", e)
        }
        alert(`Не удалось отправить SMS: ${errorData.message || 'Попробуйте еще раз.'}`)
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
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_CODE}`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber, code: smsCode }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.access_token) {
          handleLogin(data.data.user, data.data)
        }
        setIsSmsModalOpen(false)
        setSmsCode("")
        setPhoneNumber("")
        setCountryCode("+996")
      } else {
        alert('Неверный код. Попробуйте еще раз.')
      }
    } catch (error) {
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
