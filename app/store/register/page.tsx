"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { AuthModals } from "@/components/AuthModals"
import { storesApi } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StoreRegisterPage() {
  const router = useRouter()
  const auth = useAuth()
  const { t } = useLanguage()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    market: 'KG' as 'KG' | 'US' | 'ALL',
    email: '',
    phone: '',
    website: '',
    address: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('store.register.nameRequired') || 'Store name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('store.register.emailInvalid') || 'Invalid email format'
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = t('store.register.websiteInvalid') || 'Website must start with http:// or https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check authentication
    if (!auth.isLoggedIn) {
      auth.requireAuth(() => {
        // User will be redirected back after login
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await storesApi.registerStore({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        market: formData.market,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
      })

      if (response.success) {
        toast.success(response.message || t('store.register.success') || 'Store registered successfully!')
        // Redirect to store page or profile
        router.push('/profile')
      } else {
        toast.error(t('store.register.error') || 'Failed to register store')
      }
    } catch (error: any) {
      console.error('Store registration error:', error)
      
      // Handle validation errors from backend
      if (error.details && typeof error.details === 'object') {
        setErrors(error.details)
        toast.error(t('store.register.validationError') || 'Please check the form for errors')
      } else {
        toast.error(error.message || t('store.register.error') || 'Failed to register store')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModals {...auth} />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-brand mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back') || 'Back'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('store.register.title') || 'Register Your Store'}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('store.register.subtitle') || 'Create your store on MARQUE marketplace. Your store will be reviewed and activated by our team.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Store Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.storeName') || 'Store Name'} <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('store.register.storeNamePlaceholder') || 'Enter your store name'}
              className={errors.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.description') || 'Description'}
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('store.register.descriptionPlaceholder') || 'Tell us about your store...'}
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Market */}
          <div className="mb-6">
            <label htmlFor="market" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.market') || 'Market'} <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.market}
              onValueChange={(value) => handleChange('market', value)}
            >
              <SelectTrigger className={errors.market ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('store.register.selectMarket') || 'Select market'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KG">Kyrgyzstan (KG)</SelectItem>
                <SelectItem value="US">United States (US)</SelectItem>
                <SelectItem value="ALL">All Markets</SelectItem>
              </SelectContent>
            </Select>
            {errors.market && (
              <p className="mt-1 text-sm text-red-500">{errors.market}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.email') || 'Email'}
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('store.register.emailPlaceholder') || 'store@example.com'}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.phone') || 'Phone'}
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder={t('store.register.phonePlaceholder') || '+996 555 123 456'}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Website */}
          <div className="mb-6">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.website') || 'Website'}
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder={t('store.register.websitePlaceholder') || 'https://example.com'}
              className={errors.website ? 'border-red-500' : ''}
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-500">{errors.website}</p>
            )}
          </div>

          {/* Address */}
          <div className="mb-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              {t('store.register.address') || 'Address'}
            </label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t('store.register.addressPlaceholder') || 'Store address'}
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {t('store.register.info') || 'Your store registration will be reviewed by our team. You will be notified once your store is approved and activated.'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !auth.isLoggedIn}
              className="flex-1 bg-brand hover:bg-brand-hover text-white"
            >
              {isSubmitting 
                ? (t('store.register.submitting') || 'Submitting...')
                : (t('store.register.submit') || 'Register Store')
              }
            </Button>
          </div>

          {!auth.isLoggedIn && (
            <p className="mt-4 text-sm text-center text-gray-600">
              {t('store.register.loginRequired') || 'Please log in to register a store.'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

