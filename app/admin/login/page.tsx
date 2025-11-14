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

const countryCodes = [
  { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
  { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
]

export default function AdminLoginPage() {
  const router = useRouter()
  const auth = useAuth()
  
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
            router.push('/admin')
          } else {
            // Logged in but not a manager
            setLoginError('Вы не являетесь менеджером магазина. Обратитесь к администратору для получения доступа.')
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
      toast.error('Пожалуйста, введите номер телефона')
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
        toast.success('Код подтверждения отправлен')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка отправки SMS' }))
        setLoginError(errorData.message || 'Ошибка отправки SMS')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      setLoginError('Ошибка отправки SMS. Попробуйте еще раз.')
    } finally {
      setIsSendingSms(false)
    }
  }

  // Handle SMS verification
  const handleSmsVerification = async () => {
    if (smsCode.length !== 6) {
      toast.error('Введите 6-значный код')
      return
    }

    setIsVerifyingCode(true)
    setLoginError(null)
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[-\s]/g, '')}`
    
    try {
      const response = await authApi.verifyCode(fullPhoneNumber, smsCode)

      // Wait a bit for auth state to update
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Check auth status to ensure token is stored
      auth.checkAuthStatus()

      // Login successful, now check manager status
      setIsCheckingManager(true)
      const managerStatus = await storeManagerApi.checkManagerStatus()
      
      if (managerStatus.is_manager && managerStatus.is_active) {
        // Success! Redirect to admin dashboard
        toast.success('Вход выполнен успешно')
        router.push('/admin')
      } else {
        // User is not a manager
        setLoginError('Вы не являетесь менеджером магазина. Обратитесь к администратору для получения доступа.')
        await auth.handleLogout()
        setShowSmsForm(false)
        setSmsCode("")
        setIsCheckingManager(false)
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Неверный код подтверждения'
      setLoginError(errorMessage)
      console.error('Login error:', error)
      setIsVerifyingCode(false)
    }
  }

  if (isCheckingManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Панель администратора</h1>
            <p className="text-gray-600 text-sm">Войдите, чтобы получить доступ к управлению магазином</p>
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
                <label className="block text-sm font-medium text-gray-700">Номер телефона</label>
                <div className="flex space-x-3">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-28 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue />
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
                    className="flex-1 h-12 text-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder={countryCodes.find(c => c.code === countryCode)?.placeholder || "Номер телефона"}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && phoneNumber.trim() && !isSendingSms) {
                        handlePhoneSubmit()
                      }
                    }}
                  />
                </div>
              </div>
              
              <Button
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-lg transition-colors"
                onClick={handlePhoneSubmit}
                disabled={isSendingSms || !phoneNumber.trim()}
              >
                {isSendingSms ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Отправляем SMS...</span>
                  </div>
                ) : (
                  "Продолжить"
                )}
              </Button>
            </div>
          )}

          {showSmsForm && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Введите код подтверждения</h2>
                <p className="text-gray-600 text-sm">
                  Мы отправили код на номер <br />
                  <span className="font-medium">{countryCode} {phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Код подтверждения</label>
                <Input
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 text-lg text-center tracking-widest border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-lg transition-colors"
                onClick={handleSmsVerification}
                disabled={isVerifyingCode || smsCode.length !== 6}
              >
                {isVerifyingCode ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Проверяем код...</span>
                  </div>
                ) : (
                  "Войти"
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
                Изменить номер телефона
              </Button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={() => router.push('/')}
            >
              Вернуться на главную
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

