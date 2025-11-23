"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { storeManagerApi, ApiError } from "@/lib/api"
import { authApi } from "@/lib/api"
import { API_CONFIG } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, MessageSquare, Loader2, AlertCircle, Shield } from "lucide-react"
import { toast } from "@/lib/toast"
import { useLanguage } from "@/contexts/LanguageContext"

const countryCodes = [
  { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
  { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
]

export default function AdminLoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { t } = useLanguage()
  
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+996")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [showSmsForm, setShowSmsForm] = useState(false)
  const [isCheckingManager, setIsCheckingManager] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Check if already logged in and is manager
  useEffect(() => {
    const checkAuthAndManager = async () => {
      if (auth.isLoggedIn && !auth.isLoading) {
        setIsCheckingManager(true)
        try {
          const managerStatus = await storeManagerApi.checkManagerStatus()
          if (managerStatus.is_manager && managerStatus.is_active) {
            // Already logged in and is manager, redirect to dashboard
            router.push('/store-manager')
          } else {
            // Logged in but not a manager
            setLoginError(t('admin.errors.notManagerAccess'))
          }
        } catch (error) {
          console.error('Error checking manager status:', error)
        } finally {
          setIsCheckingManager(false)
        }
      }
    }

    checkAuthAndManager()
  }, [auth.isLoggedIn, auth.isLoading, router])

  // Handle phone submission
  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t('auth.enterPhone'))
      return
    }

    setIsSendingSms(true)
    setLoginError(null)
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      })

      if (response.ok) {
        setShowSmsForm(true)
        toast.success(t('auth.codeSent'))
      } else {
        const errorData = await response.json().catch(() => ({ message: t('auth.smsError') }))
        setLoginError(errorData.message || t('auth.smsError'))
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      setLoginError(t('auth.smsError'))
    } finally {
      setIsSendingSms(false)
    }
  }

  // Handle SMS verification
  const handleSmsVerification = async () => {
    if (smsCode.length !== 6) {
      toast.error(t('auth.enterCode'))
      return
    }

    setIsVerifyingCode(true)
    setLoginError(null)
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
    
    try {
      const response = await authApi.verifyCode(fullPhoneNumber, smsCode)

      // Store auth token and user data in localStorage (similar to useAuth hook)
      const userData = {
        id: response.user.id,
        phone: response.user.phone,
        name: response.user.name,
        full_name: (response.user as any).full_name || response.user.name,
        is_active: response.user.is_active,
        is_verified: response.user.is_verified,
        location: response.location || 'KG',
      }
      
      const expiresInSeconds = 43200 * 60 // 30 days default
      const expirationTime = new Date().getTime() + expiresInSeconds * 1000
      
      localStorage.setItem('authToken', response.access_token)
      localStorage.setItem('location', response.location || 'KG')
      localStorage.setItem('market', response.location || 'KG')
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('tokenExpiration', expirationTime.toString())
      
      // Trigger auth state update event
      window.dispatchEvent(new CustomEvent('auth:login'))

      // Wait for auth hook to update (give it time to read from localStorage)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Login successful, now check manager status
      setIsCheckingManager(true)
      try {
        const managerStatus = await storeManagerApi.checkManagerStatus()
        
        if (managerStatus.is_manager && managerStatus.is_active) {
          // Success! Redirect to admin dashboard
          toast.success(t('admin.login.success'))
          // Use window.location for a hard redirect to ensure clean state
          window.location.href = '/store-manager'
        } else {
          // User is not a manager
            setLoginError(t('admin.errors.notManagerAccess'))
          await auth.handleLogout()
          setShowSmsForm(false)
          setSmsCode("")
          setIsCheckingManager(false)
        }
      } catch (managerError) {
        // If manager check fails, it might be an auth issue
        console.error('Manager status check error:', managerError)
        if (managerError instanceof ApiError && managerError.message.includes('Authentication')) {
          setLoginError(t('admin.errors.authFailed'))
        } else {
          setLoginError(t('admin.errors.checkStatusFailed'))
        }
        setIsCheckingManager(false)
        setIsVerifyingCode(false)
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : t('auth.invalidCode')
      setLoginError(errorMessage)
      console.error('Login error:', error)
      setIsVerifyingCode(false)
    }
  }

  if (isCheckingManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.loading.checkingAccess')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin.login.title')}</h1>
            <p className="text-gray-600 text-sm">{t('admin.login.subtitle')}</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{loginError}</p>
            </div>
          )}

          {!showSmsForm && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">{t('auth.phoneNumber')}</label>
                <div className="flex space-x-3">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-28 h-12 border-gray-300 focus:border-brand focus:ring-brand">
                      {/* Explicitly render selected country code and flag */}
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{countryCodes.find(c => c.code === countryCode)?.flag}</span>
                        <span className="font-medium">{countryCode}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{country.flag}</span>
                            <span className="font-medium">{country.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 h-12 text-lg border-gray-300 focus:border-brand focus:ring-brand"
                    placeholder={countryCodes.find(c => c.code === countryCode)?.placeholder || t('auth.phoneNumber')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && phoneNumber.trim() && !isSendingSms) {
                        handlePhoneSubmit()
                      }
                    }}
                  />
                </div>
              </div>
              
              <Button
                className="w-full h-12 bg-brand hover:bg-brand-hover text-white text-lg font-medium rounded-lg transition-colors"
                onClick={handlePhoneSubmit}
                disabled={isSendingSms || !phoneNumber.trim()}
              >
                {isSendingSms ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('auth.sendingSms')}</span>
                  </div>
                ) : (
                  t('auth.continue')
                )}
              </Button>
            </div>
          )}

          {showSmsForm && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-brand" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.smsCodeTitle')}</h2>
                <p className="text-gray-600 text-sm">
                  {t('auth.codeSentTo')} <br />
                  <span className="font-medium">{countryCode} {phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">{t('auth.verificationCode')}</label>
                <Input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 text-lg text-center tracking-widest border-gray-300 focus:border-brand focus:ring-brand"
                  placeholder="000000"
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && smsCode.length === 6 && !isVerifyingCode) {
                      handleSmsVerification()
                    }
                  }}
                  autoFocus
                />
              </div>

              <Button
                className="w-full h-12 bg-brand hover:bg-brand-hover text-white text-lg font-medium rounded-lg transition-colors"
                onClick={handleSmsVerification}
                disabled={isVerifyingCode || smsCode.length !== 6}
              >
                {isVerifyingCode ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('auth.verifyingCode')}</span>
                  </div>
                ) : (
                  t('common.login')
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
                onClick={() => {
                  setShowSmsForm(false)
                  setSmsCode("")
                }}
                disabled={isVerifyingCode}
              >
                {t('auth.changePhone')}
              </Button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={() => router.push('/')}
            >
              {t('common.goToHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

