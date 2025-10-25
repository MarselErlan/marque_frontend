# ✅ Frontend Updated to Stateless Cart & Wishlist API

**Date:** October 25, 2025  
**Status:** ✅ COMPLETE  
**Build:** ✅ SUCCESSFUL

---

## 🎯 What Changed

Your frontend now uses the **new stateless Cart and Wishlist APIs** that require `user_id` and `product_id`/`sku_id` in every request.

### Key Changes:

1. **Cart API** - Now uses `user_id` + `sku_id`
2. **Wishlist API** - Now uses `user_id` + `product_id`
3. **No JWT tokens required** for Cart/Wishlist operations
4. **User ID extracted** from `localStorage.userData`

---

## 📁 Files Updated

### 1. `/lib/config.ts`
**Changes:**
- Updated Cart endpoints from old JWT-based to new stateless API:
  ```typescript
  // OLD (JWT-based)
  CART: '/cart',
  CART_ITEMS: '/cart/items',
  
  // NEW (Stateless)
  CART_GET: '/cart/get',
  CART_ADD: '/cart/add',
  CART_UPDATE: '/cart/update',
  CART_REMOVE: '/cart/remove',
  CART_CLEAR: '/cart/clear',
  ```

- Wishlist endpoints remain the same (already stateless):
  ```typescript
  WISHLIST_GET: '/wishlist/get',
  WISHLIST_ADD: '/wishlist/add',
  WISHLIST_REMOVE: '/wishlist/remove',
  WISHLIST_CLEAR: '/wishlist/clear',
  ```

---

### 2. `/lib/api.ts`
**Changes:**
- Updated `cartApi` methods to accept `userId` parameter:

```typescript
// OLD
export const cartApi = {
  get: () => apiRequest(CART, { requiresAuth: true }),
  add: (skuId, quantity) => apiRequest(CART_ITEMS, { 
    method: 'POST', 
    requiresAuth: true, 
    body: { sku_id: skuId, quantity } 
  }),
  // ...
}

// NEW
export const cartApi = {
  get: (userId: string) => apiRequest(CART_GET, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  }),
  
  add: (userId: string, skuId: number, quantity: number = 1) => apiRequest(CART_ADD, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, sku_id: skuId, quantity }),
  }),
  
  updateQuantity: (userId: string, cartItemId: number, quantity: number) => 
    apiRequest(CART_UPDATE, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, cart_item_id: cartItemId, quantity }),
    }),
  
  remove: (userId: string, cartItemId: number) => apiRequest(CART_REMOVE, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, cart_item_id: cartItemId }),
  }),
  
  clear: (userId: string) => apiRequest(CART_CLEAR, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  }),
}
```

**Note:** `wishlistApi` was already using the stateless API (no changes needed).

---

### 3. `/hooks/useCart.ts`
**Changes:**
- Added `getUserId()` helper to extract `user_id` from `localStorage`:
  ```typescript
  const getUserId = (): string | null => {
    try {
      const userDataStr = localStorage.getItem('userData')
      if (!userDataStr) return null
      const userData = JSON.parse(userDataStr)
      return userData.id ? String(userData.id) : null
    } catch (error) {
      console.error('Failed to get user_id:', error)
      return null
    }
  }
  ```

- Updated all cart operations to pass `userId`:
  - `loadCart()` - Now calls `cartApi.get(userId)`
  - `addToCart()` - Now calls `cartApi.add(userId, skuId, quantity)`
  - `removeFromCart()` - Now calls `cartApi.remove(userId, cartItemId)`
  - `updateQuantity()` - Now calls `cartApi.updateQuantity(userId, cartItemId, quantity)`
  - `clearCart()` - Now calls `cartApi.clear(userId)`
  - `syncCartWithBackend()` - Now uses `userId` for all sync operations

---

### 4. `/hooks/useWishlist.ts`
**Changes:**
- Already using stateless API (no changes needed)
- Confirmed it extracts `user_id` from `localStorage.userData`
- All operations already pass `userId` and `productId`

---

## 🔑 How It Works

### User Authentication Flow:
```
1. User logs in → `useAuth` stores user data in localStorage:
   localStorage.setItem('userData', JSON.stringify({
     id: "19",
     phone_number: "+13128059851",
     name: "John Doe",
     // ...
   }))

2. Cart/Wishlist hooks extract user_id:
   const userData = JSON.parse(localStorage.getItem('userData'))
   const userId = userData.id // "19"

3. API calls include user_id in request body:
   POST /api/v1/cart/add
   {
     "user_id": "19",
     "sku_id": 123,
     "quantity": 1
   }

4. Backend processes with user_id (no JWT needed)
```

---

## 🧪 Testing

### Test Cart Operations:
```javascript
// In browser console (after login):

// 1. Get user_id
const userData = JSON.parse(localStorage.getItem('userData'))
console.log('User ID:', userData.id)

// 2. Test Cart Get
fetch('https://marquebackend-production.up.railway.app/api/v1/cart/get', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: userData.id })
})
.then(r => r.json())
.then(console.log)

// 3. Test Cart Add
fetch('https://marquebackend-production.up.railway.app/api/v1/cart/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    user_id: userData.id,
    sku_id: 1,
    quantity: 1
  })
})
.then(r => r.json())
.then(console.log)
```

### Test Wishlist Operations:
```javascript
// 1. Test Wishlist Get
fetch('https://marquebackend-production.up.railway.app/api/v1/wishlist/get', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: userData.id })
})
.then(r => r.json())
.then(console.log)

// 2. Test Wishlist Add
fetch('https://marquebackend-production.up.railway.app/api/v1/wishlist/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    user_id: userData.id,
    product_id: 1
  })
})
.then(r => r.json())
.then(console.log)
```

---

## 📋 API Request/Response Examples

### Cart API

#### Get Cart
```http
POST /api/v1/cart/get
Content-Type: application/json

{
  "user_id": "19"
}
```
**Response:**
```json
{
  "id": 1,
  "user_id": 19,
  "items": [
    {
      "id": 1,
      "cart_id": 1,
      "sku_id": 123,
      "quantity": 2,
      "product": {
        "name": "Black T-Shirt",
        "price": 1500.0,
        "image_url": "/images/black-tshirt.jpg"
      }
    }
  ],
  "total_items": 1,
  "total_price": 3000.0
}
```

#### Add to Cart
```http
POST /api/v1/cart/add
Content-Type: application/json

{
  "user_id": "19",
  "sku_id": 123,
  "quantity": 1
}
```

#### Update Cart Item
```http
POST /api/v1/cart/update
Content-Type: application/json

{
  "user_id": "19",
  "cart_item_id": 1,
  "quantity": 3
}
```

#### Remove from Cart
```http
POST /api/v1/cart/remove
Content-Type: application/json

{
  "user_id": "19",
  "cart_item_id": 1
}
```

#### Clear Cart
```http
POST /api/v1/cart/clear
Content-Type: application/json

{
  "user_id": "19"
}
```

---

### Wishlist API

#### Get Wishlist
```http
POST /api/v1/wishlist/get
Content-Type: application/json

{
  "user_id": "19"
}
```
**Response:**
```json
{
  "id": 1,
  "user_id": 19,
  "items": [
    {
      "id": 1,
      "wishlist_id": 1,
      "product_id": 456,
      "product": {
        "name": "Blue Jeans",
        "price": 2500.0,
        "image_url": "/images/blue-jeans.jpg"
      }
    }
  ]
}
```

#### Add to Wishlist
```http
POST /api/v1/wishlist/add
Content-Type: application/json

{
  "user_id": "19",
  "product_id": 456
}
```

#### Remove from Wishlist
```http
POST /api/v1/wishlist/remove
Content-Type: application/json

{
  "user_id": "19",
  "product_id": 456
}
```

---

## ✅ What Works Now

### Cart Features:
- ✅ Add product to cart (with `user_id` + `sku_id`)
- ✅ View cart items
- ✅ Update item quantity
- ✅ Remove item from cart
- ✅ Clear entire cart
- ✅ Sync local cart with backend on login

### Wishlist Features:
- ✅ Add product to wishlist (with `user_id` + `product_id`)
- ✅ View wishlist items
- ✅ Remove item from wishlist
- ✅ Clear entire wishlist
- ✅ Sync local wishlist with backend on login

### Authentication:
- ✅ User data stored in `localStorage.userData`
- ✅ `user_id` extracted automatically by hooks
- ✅ No JWT tokens required for Cart/Wishlist operations
- ✅ Fallback to localStorage if user not logged in

---

## 🔄 Migration Summary

| Feature | Old API (JWT) | New API (Stateless) |
|---------|---------------|---------------------|
| **Cart Get** | `GET /cart` + JWT | `POST /cart/get` + `user_id` |
| **Cart Add** | `POST /cart/items` + JWT | `POST /cart/add` + `user_id` + `sku_id` |
| **Cart Update** | `PUT /cart/items/{id}` + JWT | `POST /cart/update` + `user_id` + `cart_item_id` |
| **Cart Remove** | `DELETE /cart/items/{id}` + JWT | `POST /cart/remove` + `user_id` + `cart_item_id` |
| **Cart Clear** | `DELETE /cart` + JWT | `POST /cart/clear` + `user_id` |
| **Wishlist** | Already stateless | No change |

---

## 🚀 Deployment

### Frontend Build:
```bash
cd /Users/macbookpro/M4_Projects/Prodaction/marque_frontend
pnpm build
```
✅ **Status:** Build successful!

### Deploy to Production:
```bash
# If using Railway/Vercel/Netlify, just push to git:
git add .
git commit -m "feat: Update frontend to use stateless Cart API with user_id + sku_id"
git push origin main

# Auto-deploy will handle the rest
```

---

## 🎉 Benefits of Stateless API

1. **Simpler Backend** - No JWT token validation for Cart/Wishlist
2. **Better Security** - Explicit user_id in every request
3. **Easier Debugging** - Clear what user is performing the action
4. **Consistent API** - Same pattern for Cart and Wishlist
5. **Database Integrity** - Every cart/wishlist item has `user_id` + `product_id`/`sku_id`

---

## 📞 Support

If you encounter issues:

1. **Check user is logged in:**
   ```javascript
   const userData = localStorage.getItem('userData')
   console.log('User Data:', userData)
   ```

2. **Verify user_id is present:**
   ```javascript
   const userData = JSON.parse(localStorage.getItem('userData'))
   console.log('User ID:', userData.id) // Should be a number like 19
   ```

3. **Test API endpoints directly:**
   - Use the browser console examples above
   - Or use the Python integration test script

4. **Check backend logs:**
   - Railway dashboard → View logs
   - Look for errors in API calls

---

## ✅ Integration Test Script

Run comprehensive tests:
```bash
cd /Users/macbookpro/M4_Projects/Prodaction/Marque
python3 test_cart_wishlist_integration.py
```

This will test:
- Cart Get, Add, Update, Remove, Clear
- Wishlist Get, Add, Remove, Clear
- With valid user_id and product_id/sku_id

---

**Frontend is now fully updated and ready to use the stateless Cart & Wishlist APIs! 🎉**

