# Profile API Integration Guide

## ✅ What's Been Implemented

### 1. **API Methods** (`lib/api.ts`)

Added complete `profileApi` object with all backend endpoints:

- Profile management (get, update)
- Addresses (get, create, update, delete)
- Payment methods (get, create, update, delete)
- Orders (get, get detail, cancel)
- Notifications (get, mark read, mark all read)

### 2. **Custom Hook** (`hooks/useProfile.ts`)

Created `useProfile` hook that provides:

- State management for all profile data
- Loading states for each section
- CRUD operations with error handling
- Toast notifications for user feedback

## 🚀 How to Use

### Basic Usage in Profile Page

```tsx
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function ProfilePage() {
  const { isLoggedIn } = useAuth();
  const {
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
  } = useProfile();

  // Load data on mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      fetchAddresses();
      fetchPaymentMethods();
      fetchOrders();
      fetchNotifications();
    }
  }, [isLoggedIn]);

  // Rest of your component...
}
```

## 📋 API Examples

### Profile Management

#### Get Profile

```tsx
const handleLoadProfile = async () => {
  await fetchProfile();
  // profile state will be updated automatically
  console.log(profile); // { id, phone_number, full_name, profile_image_url, ... }
};
```

#### Update Profile

```tsx
const handleUpdateProfile = async () => {
  const success = await updateProfile({
    full_name: "Анна Ахматова",
    profile_image_url: "https://example.com/avatar.jpg",
  });

  if (success) {
    console.log("Profile updated!");
    // Profile will be automatically refreshed
  }
};
```

### Address Management

#### Get Addresses

```tsx
const handleLoadAddresses = async () => {
  await fetchAddresses();
  // addresses state will be updated
  console.log(addresses); // [{ id, title, full_address, ... }]
};
```

#### Create Address

```tsx
const handleCreateAddress = async () => {
  const success = await createAddress({
    title: "Домашний адрес",
    full_address: "ул. Юнусалиева, 34, кв. 12, Бишкек",
    street: "ул. Юнусалиева",
    building: "34",
    apartment: "12",
    city: "Бишкек",
    postal_code: "720000",
    country: "Kyrgyzstan",
    is_default: true,
  });

  if (success) {
    console.log("Address created!");
    // addresses list will be automatically refreshed
  }
};
```

#### Update Address

```tsx
const handleUpdateAddress = async (addressId: number) => {
  const success = await updateAddress(addressId, {
    title: "Рабочий адрес",
    is_default: true,
  });

  if (success) {
    console.log("Address updated!");
  }
};
```

#### Delete Address

```tsx
const handleDeleteAddress = async (addressId: number) => {
  const success = await deleteAddress(addressId);

  if (success) {
    console.log("Address deleted!");
  }
};
```

### Payment Methods

#### Get Payment Methods

```tsx
const handleLoadPayments = async () => {
  await fetchPaymentMethods();
  console.log(paymentMethods); // [{ id, card_type, card_number_masked, ... }]
};
```

#### Create Payment Method

```tsx
const handleCreatePayment = async () => {
  const success = await createPaymentMethod({
    card_number: "4111111111111111",
    card_holder_name: "ANNA AKHMATOVA",
    expiry_month: "12",
    expiry_year: "2028",
    is_default: false,
  });

  if (success) {
    console.log("Payment method added!");
  }
};
```

#### Set as Default

```tsx
const handleSetDefaultPayment = async (paymentId: number) => {
  const success = await updatePaymentMethod(paymentId, {
    is_default: true,
  });

  if (success) {
    console.log("Default payment method updated!");
  }
};
```

#### Delete Payment Method

```tsx
const handleDeletePayment = async (paymentId: number) => {
  const success = await deletePaymentMethod(paymentId);

  if (success) {
    console.log("Payment method deleted!");
  }
};
```

### Orders

#### Get All Orders

```tsx
const handleLoadOrders = async () => {
  await fetchOrders(); // All orders
  // Or filter by status
  await fetchOrders("delivered"); // Only delivered orders
};
```

#### Get Order Detail

```tsx
import { profileApi } from "@/lib/api";

const handleViewOrder = async (orderId: number) => {
  try {
    const response = await profileApi.getOrderDetail(orderId);
    if (response.success) {
      const order = response.order;
      console.log(order); // Full order details with items
    }
  } catch (error) {
    console.error("Error loading order:", error);
  }
};
```

#### Cancel Order

```tsx
const handleCancelOrder = async (orderId: number) => {
  const success = await cancelOrder(orderId);

  if (success) {
    console.log("Order cancelled!");
  }
};
```

### Notifications

#### Get Notifications

```tsx
const handleLoadNotifications = async () => {
  await fetchNotifications(); // All notifications
  // Or only unread
  await fetchNotifications(true); // Only unread notifications
};
```

#### Mark as Read

```tsx
const handleMarkRead = async (notificationId: number) => {
  const success = await markNotificationRead(notificationId);

  if (success) {
    console.log("Notification marked as read!");
  }
};
```

#### Mark All as Read

```tsx
const handleMarkAllRead = async () => {
  const success = await markAllNotificationsRead();

  if (success) {
    console.log("All notifications marked as read!");
  }
};
```

## 🎨 UI Integration Examples

### Display Profile Info

```tsx
{
  profile && (
    <div>
      <h2>{profile.full_name || "Guest"}</h2>
      <p>{profile.phone_number}</p>
      {profile.profile_image_url && (
        <img src={profile.profile_image_url} alt="Profile" />
      )}
    </div>
  );
}

{
  isLoadingProfile && <div>Loading profile...</div>;
}
```

### Display Addresses List

```tsx
{
  isLoadingAddresses ? (
    <div>Loading addresses...</div>
  ) : (
    <div>
      {addresses.map((address) => (
        <div key={address.id}>
          <h3>{address.title}</h3>
          <p>{address.full_address}</p>
          {address.is_default && <span>Default</span>}
          <button
            onClick={() => updateAddress(address.id, { is_default: true })}
          >
            Set as Default
          </button>
          <button onClick={() => deleteAddress(address.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Display Orders List

```tsx
{
  isLoadingOrders ? (
    <div>Loading orders...</div>
  ) : (
    <div>
      {orders.map((order) => (
        <div key={order.id}>
          <h3>{order.order_number}</h3>
          <p>Status: {order.status}</p>
          <p>
            Total: {order.currency} {order.total_amount}
          </p>
          <p>Items: {order.items_count}</p>
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <button onClick={() => cancelOrder(order.id)}>Cancel Order</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Display Notifications

```tsx
<div>
  <h3>
    Notifications{" "}
    {unreadNotificationCount > 0 && `(${unreadNotificationCount})`}
  </h3>
  {unreadNotificationCount > 0 && (
    <button onClick={markAllNotificationsRead}>Mark All as Read</button>
  )}

  {isLoadingNotifications ? (
    <div>Loading notifications...</div>
  ) : (
    <div>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{ opacity: notification.is_read ? 0.5 : 1 }}
          onClick={() => markNotificationRead(notification.id)}
        >
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <small>{new Date(notification.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  )}
</div>
```

## 🔐 Authentication Flow

The APIs automatically handle authentication:

1. **Token is stored** when user logs in via SMS verification
2. **Token is sent** automatically with all API requests
3. **401 errors** are handled and user is prompted to log in again

```tsx
// Token is automatically included in all profile API requests
// You just need to check if user is logged in before calling APIs

const { isLoggedIn } = useAuth();

useEffect(() => {
  if (isLoggedIn) {
    // Safe to call profile APIs
    fetchProfile();
    fetchAddresses();
  }
}, [isLoggedIn]);
```

## 🧪 Testing

### Test in Development

```bash
# Make sure backend is running
# Then in your frontend:
npm run dev
```

### Test Profile API

1. Log in with phone number
2. Navigate to `/profile`
3. Open browser console
4. Check network tab for API calls
5. See data being loaded and updated

## 📱 Backend API Endpoints

All endpoints are documented in your backend docs:

- Base URL: `https://marquebackend-production.up.railway.app/api/v1`
- Docs: `https://marquebackend-production.up.railway.app/docs`

### Endpoints Used

- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `GET /api/v1/profile/addresses` - Get addresses
- `POST /api/v1/profile/addresses` - Create address
- `PUT /api/v1/profile/addresses/{id}` - Update address
- `DELETE /api/v1/profile/addresses/{id}` - Delete address
- `GET /api/v1/profile/payment-methods` - Get payment methods
- `POST /api/v1/profile/payment-methods` - Create payment method
- `PUT /api/v1/profile/payment-methods/{id}` - Update payment method
- `DELETE /api/v1/profile/payment-methods/{id}` - Delete payment method
- `GET /api/v1/profile/orders` - Get orders
- `GET /api/v1/profile/orders/{id}` - Get order detail
- `POST /api/v1/profile/orders/{id}/cancel` - Cancel order
- `GET /api/v1/profile/notifications` - Get notifications
- `PUT /api/v1/profile/notifications/{id}/read` - Mark notification as read
- `PUT /api/v1/profile/notifications/read-all` - Mark all notifications as read

## ✅ Next Steps

1. **Update Profile Page** - Replace hardcoded data with real API calls
2. **Add Loading States** - Show spinners while data is loading
3. **Add Error Handling** - Display error messages to users
4. **Add Forms** - Create forms for adding/editing addresses and payment methods
5. **Test Thoroughly** - Test all CRUD operations

## 💡 Tips

- Use `isLoading` states to show loading spinners
- Toast notifications are automatically shown for success/error
- All functions return `boolean` (true=success, false=error)
- Data is automatically refreshed after create/update/delete operations
- Check browser console for detailed error logs

## 🎉 Summary

You now have:
✅ Complete API integration for all profile features
✅ Type-safe API methods with TypeScript
✅ Custom hook for easy state management
✅ Automatic error handling and user feedback
✅ Loading states for better UX
✅ Real backend integration with authentication

Just replace your hardcoded data with these API calls and your profile system is live!
