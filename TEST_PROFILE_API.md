# Testing Profile API Integration

## 🧪 Quick Test Guide

### Prerequisites

1. ✅ Backend server is running at `https://marquebackend-production.up.railway.app`
2. ✅ You have a valid phone number to test with
3. ✅ Frontend is running (`npm run dev`)

### Test Steps

#### 1. Test Authentication (Already Working)

```
1. Go to http://localhost:3000
2. Click "Войти" (Login button)
3. Enter phone number: +13128059851 (or your test number)
4. Click send SMS
5. Enter verification code from Postman/backend response
6. Should see logged in state
```

#### 2. Test Profile API in Browser Console

Open browser console (F12) and run:

```javascript
// Test Profile API
const testProfileAPI = async () => {
  const token = localStorage.getItem("authToken");
  console.log("Token:", token);

  // Test 1: Get Profile
  const profileResponse = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const profile = await profileResponse.json();
  console.log("Profile:", profile);

  // Test 2: Get Addresses
  const addressesResponse = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/profile/addresses",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const addresses = await addressesResponse.json();
  console.log("Addresses:", addresses);

  // Test 3: Get Payment Methods
  const paymentsResponse = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/profile/payment-methods",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const payments = await paymentsResponse.json();
  console.log("Payments:", payments);

  // Test 4: Get Orders
  const ordersResponse = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/profile/orders",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const orders = await ordersResponse.json();
  console.log("Orders:", orders);

  // Test 5: Get Notifications
  const notificationsResponse = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/profile/notifications",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const notifications = await notificationsResponse.json();
  console.log("Notifications:", notifications);
};

// Run test
testProfileAPI();
```

#### 3. Test Using Custom Hook

Navigate to `/profile` and the data should load automatically!

### Expected Results

#### Profile Response

```json
{
  "id": 19,
  "phone_number": "+13128059851",
  "full_name": "User +13128059851",
  "profile_image_url": null,
  "is_active": true,
  "is_verified": true,
  "market": "us",
  "language": "en",
  "country": "United States",
  "created_at": "2025-10-23T..."
}
```

#### Addresses Response

```json
{
  "success": true,
  "addresses": [],
  "total": 0
}
```

#### Payment Methods Response

```json
{
  "success": true,
  "payment_methods": [],
  "total": 0
}
```

#### Orders Response

```json
{
  "success": true,
  "orders": [],
  "total": 0,
  "has_more": false
}
```

#### Notifications Response

```json
{
  "success": true,
  "notifications": [],
  "total": 0,
  "unread_count": 0
}
```

### Creating Test Data

#### Create Test Address

```javascript
const createTestAddress = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/profile/addresses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Address",
        full_address: "123 Test Street, Test City",
        street: "Test Street",
        building: "123",
        city: "Test City",
        postal_code: "12345",
        country: "United States",
        is_default: true,
      }),
    }
  );

  const result = await response.json();
  console.log("Created address:", result);
};

createTestAddress();
```

#### Create Test Payment Method

```javascript
const createTestPayment = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    "https://marquebackend-production.up.railway.app/api/v1/profile/payment-methods",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_number: "4111111111111111",
        card_holder_name: "TEST USER",
        expiry_month: "12",
        expiry_year: "2028",
        is_default: true,
      }),
    }
  );

  const result = await response.json();
  console.log("Created payment method:", result);
};

createTestPayment();
```

### Common Issues & Fixes

#### Issue 1: 401 Unauthorized

**Cause:** Token expired or not found
**Fix:** Log in again to get a new token

#### Issue 2: 404 Not Found

**Cause:** Wrong endpoint URL
**Fix:** Check API_CONFIG.BASE_URL in `lib/config.ts`

#### Issue 3: CORS Error

**Cause:** Backend CORS not configured for frontend domain
**Fix:** Already configured in backend, should work

#### Issue 4: Network Error

**Cause:** Backend server not running
**Fix:** Check backend is deployed and running

### Debugging Tips

1. **Check Token:**

   ```javascript
   console.log("Token:", localStorage.getItem("authToken"));
   ```

2. **Check Network Tab:**

   - Open DevTools → Network tab
   - Filter by "Fetch/XHR"
   - See all API requests and responses

3. **Check Console Logs:**

   - All API errors are logged to console
   - Look for red error messages

4. **Test Backend Directly:**
   - Go to `https://marquebackend-production.up.railway.app/docs`
   - Use "Try it out" feature
   - Enter your token in "Authorize" button

## ✅ Success Criteria

- ✅ Can log in with phone number
- ✅ Can fetch profile data
- ✅ Can fetch addresses (empty array is OK)
- ✅ Can create address
- ✅ Can update address
- ✅ Can delete address
- ✅ Can fetch payment methods
- ✅ Can create payment method
- ✅ Can delete payment method
- ✅ Can fetch orders
- ✅ Can fetch notifications

## 📝 Test Checklist

```
Authentication:
[ ] Send SMS verification
[ ] Verify code
[ ] Token stored in localStorage
[ ] User data stored

Profile API:
[ ] GET profile works
[ ] UPDATE profile works

Addresses API:
[ ] GET addresses works
[ ] POST create address works
[ ] PUT update address works
[ ] DELETE address works

Payment Methods API:
[ ] GET payment methods works
[ ] POST create payment works
[ ] PUT update payment works
[ ] DELETE payment works

Orders API:
[ ] GET orders works
[ ] GET order detail works
[ ] POST cancel order works

Notifications API:
[ ] GET notifications works
[ ] PUT mark as read works
[ ] PUT mark all as read works
```

## 🎉 Next Steps After Testing

1. ✅ Confirm all APIs work
2. ✅ Update profile page UI to use real data
3. ✅ Add loading states
4. ✅ Add error handling
5. ✅ Test edge cases
6. ✅ Deploy to production

Happy Testing! 🚀
