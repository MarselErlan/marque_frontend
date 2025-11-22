"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Phone, MessageSquare } from 'lucide-react'

type AuthModalsProps = Omit<ReturnType<typeof useAuth>, 
  'isLoggedIn' | 'userData' | 'isLoading' | 'handleLogout' | 'requireAuth' | 'checkAuthStatus' | 'handleLogin'
>;

const countryCodes = [
  { code: "+996", country: "KG", flag: "🇰🇬", placeholder: "505-23-12-55" },
  { code: "+1", country: "US", flag: "🇺🇸", placeholder: "555-123-4567" }
]

export const AuthModals: React.FC<AuthModalsProps> = ({
  isPhoneModalOpen,
  setIsPhoneModalOpen,
  isSmsModalOpen,
  setIsSmsModalOpen,
  phoneNumber,
  setPhoneNumber,
  countryCode,
  setCountryCode,
  smsCode,
  setSmsCode,
  isSendingSms,
  isVerifyingCode,
  handlePhoneSubmit,
  handleSmsVerification,
}) => {

  const getFullPhoneNumber = () => `${countryCode} ${phoneNumber}`

  return (
    <>
      {/* Phone Number Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-brand" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Войти в аккаунт</DialogTitle>
            <p className="text-gray-600 text-sm mt-2">Мы отправим вам код подтверждения</p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Номер телефона</label>
              <div className="flex space-x-3">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-28 h-12 border-gray-300 focus:border-brand focus:ring-brand">
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
                  className="flex-1 h-12 text-lg border-gray-300 focus:border-brand focus:ring-brand"
                  placeholder={countryCodes.find(c => c.code === countryCode)?.placeholder || "Номер телефона"}
                />
              </div>
            </div>
            
            <Button
              className="w-full h-12 bg-brand hover:bg-brand-hover text-white text-lg font-medium rounded-lg transition-colors"
              onClick={handlePhoneSubmit}
              disabled={isSendingSms || !phoneNumber.trim()}
            >
              {isSendingSms ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Отправляем SMS...</span>
                </div>
              ) : (
                "Продолжить"
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Нажимая "Продолжить", вы соглашаетесь с{" "}
              <span className="text-brand cursor-pointer hover:underline">Политикой конфиденциальности</span> и{" "}
              <span className="text-brand cursor-pointer hover:underline">Пользовательским соглашением</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Verification Modal */}
      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader className="text-center pb-4">
            <div className="flex items-center justify-center relative mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 p-2 hover:bg-gray-100"
                onClick={() => {
                  setIsSmsModalOpen(false)
                  setIsPhoneModalOpen(true)
                }}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-brand" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Код из СМС</DialogTitle>
            <p className="text-gray-600 text-sm mt-2">
              Мы отправили вам код на номер
              <br />
              <span className="font-semibold text-gray-900">{getFullPhoneNumber()}</span>
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Код подтверждения</label>
              <Input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="text-center text-2xl py-4 tracking-widest border-gray-300 focus:border-brand focus:ring-brand"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            
            <Button
              className="w-full h-12 bg-brand hover:bg-brand-hover text-white text-lg font-medium rounded-lg transition-colors"
              onClick={handleSmsVerification}
              disabled={smsCode.length < 6 || isVerifyingCode}
            >
              {isVerifyingCode ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Проверяем код...</span>
                </div>
              ) : (
                "Подтвердить"
              )}
            </Button>
            
            <div className="text-center">
              <button 
                className="text-sm text-brand hover:underline"
                onClick={() => {
                  setIsSmsModalOpen(false)
                  setIsPhoneModalOpen(true)
                }}
              >
                Изменить номер телефона
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
