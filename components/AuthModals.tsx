"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft } from 'lucide-react'

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
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">Введите номер</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">Мы отправим вам код подтверждения</p>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center space-x-2">
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 text-lg py-3"
                  placeholder={countryCodes.find(c => c.code === countryCode)?.placeholder || "Phone number"}
                />
              </div>
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handlePhoneSubmit}
                disabled={isSendingSms || !phoneNumber.trim()}
              >
                {isSendingSms ? "Отправляем SMS..." : "Продолжить"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Нажимая "Продолжить", вы соглашаетесь с{" "}
              <span className="text-brand cursor-pointer">Политикой конфиденциальности</span> и{" "}
              <span className="text-brand cursor-pointer">Пользовательским соглашением</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSmsModalOpen} onOpenChange={setIsSmsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 p-1"
                onClick={() => {
                  setIsSmsModalOpen(false)
                  setIsPhoneModalOpen(true)
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-center text-xl font-semibold">Код из СМС</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              Мы отправили вам код на номер
              <br />
              <span className="font-semibold">{getFullPhoneNumber()}</span>
            </p>
            <div className="space-y-4">
              <Input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                className="text-center text-lg py-3 tracking-widest"
                placeholder="233 512"
                maxLength={6}
              />
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-lg"
                onClick={handleSmsVerification}
                disabled={smsCode.length < 6 || isVerifyingCode}
              >
                {isVerifyingCode ? "Проверяем код..." : "Подтвердить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
