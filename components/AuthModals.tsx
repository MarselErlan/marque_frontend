"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { API_CONFIG } from '@/lib/config'
import { UserData } from '@/hooks/useAuth'

interface AuthModalsProps {
  isPhoneModalOpen: boolean
  setIsPhoneModalOpen: (open: boolean) => void
  isSmsModalOpen: boolean
  setIsSmsModalOpen: (open: boolean) => void
  onLoginSuccess: (userData: UserData, authData: any) => void
}

const countryCodes = [
  { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
  { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
]

export const AuthModals: React.FC<AuthModalsProps> = ({
  isPhoneModalOpen,
  setIsPhoneModalOpen,
  isSmsModalOpen,
  setIsSmsModalOpen,
  onLoginSuccess
}) => {
  const [countryCode, setCountryCode] = useState("+996")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  const getFullPhoneNumber = () => {
    return `${countryCode}${phoneNumber.replace(/\D/g, '')}`
  }

  const validatePhoneNumber = (phone: string, code: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (code === "+996") {
      return cleanPhone.length === 9 && cleanPhone[0] !== '0'
    } else if (code === "+1") {
      return cleanPhone.length === 10 && cleanPhone[0] !== '0' && cleanPhone[0] !== '1'
    }
    return false
  }

  const handleCountryCodeChange = (value: string) => {
    setCountryCode(value)
    setPhoneNumber("")
  }

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert('Пожалуйста, введите номер телефона')
      return
    }

    const fullPhoneNumber = getFullPhoneNumber()
    
    if (!validatePhoneNumber(phoneNumber, countryCode)) {
      alert('Пожалуйста, введите корректный номер телефона')
      return
    }

    setIsSendingSms(true)
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Market': 'KG',
          'X-Request-ID': `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        mode: 'cors',
        body: JSON.stringify({
          phone: fullPhoneNumber
        })
      })

      if (response.ok) {
        console.log('SMS sent successfully')
        setIsPhoneModalOpen(false)
        setIsSmsModalOpen(true)
      } else {
        const errorText = await response.text()
        console.error('SMS sending failed:', response.status, errorText)
        alert(`Ошибка при отправке SMS: ${response.status}`)
      }
    } catch (error) {
      console.error('Network error during SMS sending:', error)
      if (error instanceof TypeError && typeof error.message === 'string' && error.message.includes('fetch')) {
        alert('Ошибка сети: Не удается подключиться к серверу.')
      } else {
        alert('Произошла ошибка при отправке SMS. Попробуйте еще раз.')
      }
    } finally {
      setIsSendingSms(false)
    }
  }

  const handleSmsVerification = async () => {
    if (!smsCode.trim()) {
      alert('Пожалуйста, введите код из SMS')
      return
    }

    setIsVerifyingCode(true)
    const fullPhoneNumber = getFullPhoneNumber()

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_CODE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Market': 'KG',
          'X-Request-ID': `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        mode: 'cors',
        body: JSON.stringify({
          phone: fullPhoneNumber,
          code: smsCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('SMS verification successful:', result)

        const userData: UserData = {
          id: result.user?.id || result.id,
          name: result.user?.name || result.name,
          full_name: result.user?.full_name || result.full_name,
          phone: result.user?.phone || result.phone || fullPhoneNumber,
          email: result.user?.email || result.email
        }

        onLoginSuccess(userData, result)

        setIsSmsModalOpen(false)
        setSmsCode("")
        setPhoneNumber("")
      } else {
        const errorText = await response.text()
        console.error('SMS verification failed:', response.status, errorText)
        alert(`Неверный код: ${response.status}`)
      }
    } catch (error) {
      console.error('Network error during SMS verification:', error)
      if (error instanceof TypeError && typeof error.message === 'string' && error.message.includes('fetch')) {
        alert('Ошибка сети: Не удается подключиться к серверу.')
      } else {
        alert('Произошла ошибка при проверке кода. Попробуйте еще раз.')
      }
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0]

  return (
    <>
      {/* Phone Number Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Введите номер телефона</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Страна</label>
                <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center space-x-2">
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                          <span>({country.country})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Номер телефона</label>
                <div className="flex">
                  <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                    <span className="text-sm font-medium">{selectedCountry.flag} {countryCode}</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder={selectedCountry.placeholder}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 rounded-l-none border-l-0 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>
            </div>
            
            <Button
              onClick={handlePhoneSubmit}
              disabled={isSendingSms || !phoneNumber.trim()}
              className="w-full bg-brand hover:bg-brand-hover text-white"
            >
              {isSendingSms ? "Отправка..." : "Продолжить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Verification Modal */}
      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Введите код из SMS</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="text-center text-sm text-gray-600">
              Мы отправили код на номер<br />
              <span className="font-medium">{getFullPhoneNumber()}</span>
            </div>
            
            <Input
              type="text"
              placeholder="Введите 6-значный код"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            
            <Button
              onClick={handleSmsVerification}
              disabled={isVerifyingCode || smsCode.length !== 6}
              className="w-full bg-brand hover:bg-brand-hover text-white"
            >
              {isVerifyingCode ? "Проверка..." : "Войти"}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setIsSmsModalOpen(false)
                setIsPhoneModalOpen(true)
              }}
              className="text-sm text-gray-600"
            >
              Изменить номер
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
