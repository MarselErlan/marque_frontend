import { useState, useEffect, useCallback } from 'react'
import { profileApi } from '@/lib/api'
import { toast } from '@/lib/toast'

export interface Address {
  id: number
  title: string
  full_address: string
  street: string | null
  building: string | null
  apartment: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  is_default: boolean
  created_at: string
}

export interface PaymentMethod {
  id: number
  payment_type: string
  card_type: string
  card_number_masked: string
  card_holder_name: string
  is_default: boolean
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  status: string
  total_amount: number
  currency: string
  order_date: string
  delivery_date: string | null
  requested_delivery_date: string | null
  delivery_address: string
  items_count: number
  items: Array<{
    id?: number
    product_id?: number | null
    product_name: string
    quantity: number
    price: number
    image_url: string
    size?: string | null
    color?: string | null
  }>
}

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  order_id: number | null
  created_at: string
}

export interface PhoneNumber {
  id: number
  label: string | null
  phone: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: number | string
  phone: string
  name?: string | null
  full_name: string | null
  profile_image: string | null
  is_active: boolean
  is_verified: boolean
  last_login: string | null
  location: string
  market?: string
  language: string
  country: string
  currency?: string
  currency_code?: string
  created_at: string
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [isLoadingPhones, setIsLoadingPhones] = useState(false)
  
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  // Fetch Profile
  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true)
    try {
      const data = await profileApi.getProfile()
      setProfile({
        ...data,
        profile_image: data.profile_image ?? (data as any).profile_image_url ?? null,
        location: (data.location || (data as any).market || 'KG').toUpperCase(),
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoadingProfile(false)
    }
  }, [])

  // Update Profile
  const updateProfile = useCallback(async (data: { full_name?: string; profile_image?: File | null }) => {
    try {
      const response = await profileApi.updateProfile(data)
      if (response.success) {
        toast.success('Profile updated successfully')
        await fetchProfile()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      return false
    }
  }, [fetchProfile])

  // Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    setIsLoadingAddresses(true)
    try {
      const data = await profileApi.getAddresses()
      if (data.success) {
        setAddresses(data.addresses)
        return data.addresses
      }
      return []
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast.error('Failed to load addresses')
      return []
    } finally {
      setIsLoadingAddresses(false)
    }
  }, [])

  // Create Address
  const createAddress = useCallback(async (addressData: {
    title: string
    full_address: string
    street?: string
    state?: string
    building?: string
    apartment?: string
    city?: string
    postal_code?: string
    country?: string
    is_default?: boolean
  }) => {
    try {
      const response = await profileApi.createAddress(addressData)
      if (response.success) {
        toast.success('Address added successfully')
        await fetchAddresses()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating address:', error)
      toast.error('Failed to add address')
      return false
    }
  }, [fetchAddresses])

  // Update Address
  const updateAddress = useCallback(async (id: number, addressData: {
    title?: string
    full_address?: string
    street?: string
    state?: string
    building?: string
    apartment?: string
    city?: string
    postal_code?: string
    country?: string
    is_default?: boolean
  }) => {
    try {
      const response = await profileApi.updateAddress(id, addressData)
      if (response.success) {
        toast.success('Address updated successfully')
        await fetchAddresses()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating address:', error)
      toast.error('Failed to update address')
      return false
    }
  }, [fetchAddresses])

  // Delete Address
  const deleteAddress = useCallback(async (id: number) => {
    try {
      const response = await profileApi.deleteAddress(id)
      if (response.success) {
        toast.success('Address deleted successfully')
        await fetchAddresses()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
      return false
    }
  }, [fetchAddresses])

  // Fetch Payment Methods
  const fetchPaymentMethods = useCallback(async () => {
    setIsLoadingPayments(true)
    try {
      const data = await profileApi.getPaymentMethods()
      if (data.success) {
        setPaymentMethods(data.payment_methods)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setIsLoadingPayments(false)
    }
  }, [])

  // Create Payment Method
  const createPaymentMethod = useCallback(async (paymentData: {
    card_number: string
    card_holder_name: string
    expiry_month: string
    expiry_year: string
    is_default?: boolean
  }) => {
    try {
      const response = await profileApi.createPaymentMethod(paymentData)
      if (response.success) {
        toast.success('Payment method added successfully')
        await fetchPaymentMethods()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating payment method:', error)
      toast.error('Failed to add payment method')
      return false
    }
  }, [fetchPaymentMethods])

  // Update Payment Method
  const updatePaymentMethod = useCallback(async (id: number, data: { is_default?: boolean }) => {
    try {
      const response = await profileApi.updatePaymentMethod(id, data)
      if (response.success) {
        toast.success('Payment method updated successfully')
        await fetchPaymentMethods()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast.error('Failed to update payment method')
      return false
    }
  }, [fetchPaymentMethods])

  // Delete Payment Method
  const deletePaymentMethod = useCallback(async (id: number) => {
    try {
      const response = await profileApi.deletePaymentMethod(id)
      if (response.success) {
        toast.success('Payment method deleted successfully')
        await fetchPaymentMethods()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast.error('Failed to delete payment method')
      return false
    }
  }, [fetchPaymentMethods])

  // Fetch Orders
  const fetchOrders = useCallback(async (status?: string) => {
    setIsLoadingOrders(true)
    try {
      const data = await profileApi.getOrders(status ? { status } : undefined)
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  // Cancel Order
  const cancelOrder = useCallback(async (orderId: number) => {
    try {
      const response = await profileApi.cancelOrder(orderId)
      if (response.success) {
        toast.success('Order cancelled successfully')
        await fetchOrders()
        return true
      }
      return false
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
      return false
    }
  }, [fetchOrders])

  // Fetch Notifications
  const fetchNotifications = useCallback(async (unreadOnly?: boolean) => {
    setIsLoadingNotifications(true)
    try {
      const data = await profileApi.getNotifications(unreadOnly ? { unread_only: true } : undefined)
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadNotificationCount(data.unread_count)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  // Mark Notification as Read
  const markNotificationRead = useCallback(async (id: number) => {
    try {
      const response = await profileApi.markNotificationRead(id)
      if (response.success) {
        await fetchNotifications()
        return true
      }
      return false
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }, [fetchNotifications])

  // Mark All Notifications as Read
  const markAllNotificationsRead = useCallback(async () => {
    try {
      const response = await profileApi.markAllNotificationsRead()
      if (response.success) {
        toast.success(`${response.count} notifications marked as read`)
        await fetchNotifications()
        return true
      }
      return false
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark notifications as read')
      return false
    }
  }, [fetchNotifications])

  // Phone Numbers
  const fetchPhoneNumbers = useCallback(async () => {
    setIsLoadingPhones(true)
    try {
      const data = await profileApi.getPhoneNumbers()
      if (data.success) {
        setPhoneNumbers(data.phone_numbers)
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
      toast.error('Failed to load phone numbers')
    } finally {
      setIsLoadingPhones(false)
    }
  }, [])

  const createPhoneNumber = useCallback(async (phoneData: {
    label?: string
    phone: string
    is_primary?: boolean
  }) => {
    try {
      const response = await profileApi.createPhoneNumber(phoneData)
      if (response.success) {
        toast.success('Phone number added successfully')
        await fetchPhoneNumbers()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating phone number:', error)
      toast.error('Failed to add phone number')
      return false
    }
  }, [fetchPhoneNumbers])

  const updatePhoneNumber = useCallback(async (id: number, phoneData: {
    label?: string
    phone?: string
    is_primary?: boolean
  }) => {
    try {
      const response = await profileApi.updatePhoneNumber(id, phoneData)
      if (response.success) {
        toast.success('Phone number updated successfully')
        await fetchPhoneNumbers()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating phone number:', error)
      toast.error('Failed to update phone number')
      return false
    }
  }, [fetchPhoneNumbers])

  const deletePhoneNumber = useCallback(async (id: number) => {
    try {
      const response = await profileApi.deletePhoneNumber(id)
      if (response.success) {
        toast.success('Phone number deleted successfully')
        await fetchPhoneNumbers()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting phone number:', error)
      toast.error('Failed to delete phone number')
      return false
    }
  }, [fetchPhoneNumbers])

  useEffect(() => {
    fetchProfile()
    fetchAddresses()
    fetchPaymentMethods()
    fetchOrders()
    fetchNotifications()
    fetchPhoneNumbers()
  }, [
    fetchProfile,
    fetchAddresses,
    fetchPaymentMethods,
    fetchOrders,
    fetchNotifications,
    fetchPhoneNumbers,
  ])

  return {
    // Profile
    profile,
    isLoadingProfile,
    fetchProfile,
    updateProfile,
    
    // Addresses
    addresses,
    isLoadingAddresses,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    
    // Payment Methods
    paymentMethods,
    isLoadingPayments,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    
    // Orders
    orders,
    isLoadingOrders,
    fetchOrders,
    cancelOrder,
    
    // Notifications
    notifications,
    unreadNotificationCount,
    isLoadingNotifications,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    
    // Phone Numbers
    phoneNumbers,
    isLoadingPhones,
    fetchPhoneNumbers,
    createPhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber,
  }
}

