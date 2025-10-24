# 🧪 Test Wishlist User ID Integration

## Quick Test to Verify user_id is Saved

### Option 1: Browser Console Test

```javascript
// 1. Open browser console (F12)
// 2. Make sure you're logged in
// 3. Run this code:

// Check if logged in
const token = localStorage.getItem("authToken");
console.log("Token exists:", !!token);

// Add a product to wishlist (use real product ID)
const productId = 123; // Replace with real product ID

fetch("https://marquebackend-production.up.railway.app/api/v1/wishlist/items", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ product_id: productId }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ Item added:", data);
    console.log("Now check your database for this item with your user_id");
  })
  .catch((err) => console.error("❌ Error:", err));

// Then get your wishlist to see the user_id
fetch("https://marquebackend-production.up.railway.app/api/v1/wishlist", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ Your wishlist:", data);
    console.log("✅ Your user_id:", data.user_id);
    console.log("✅ Your items:", data.items);
  })
  .catch((err) => console.error("❌ Error:", err));
```

### Expected Output:

```javascript
Token exists: true

✅ Item added: {
  success: true,
  item_id: 15
}

✅ Your wishlist: {
  id: 8,
  user_id: "19",        // ← Your user ID
  items: [
    {
      id: 15,
      product_id: 123,
      product: { ... }
    }
  ]
}

✅ Your user_id: "19"
✅ Your items: [ { id: 15, product_id: 123, ... } ]
```

---

## Option 2: Check Backend Database

### If you have database access:

```sql
-- Check your user ID
SELECT id, phone_number FROM users WHERE phone_number = '+13128059851';

-- Result:
-- id: 19, phone_number: +13128059851

-- Check wishlist items for your user
SELECT * FROM user_wishlist WHERE user_id = 19;

-- Expected Result:
-- id | user_id | product_id | created_at
-- 15 | 19      | 123        | 2025-10-23 14:30:00
```

---

## Option 3: Network Tab Inspection

### In Browser DevTools:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Login to your account**
4. **Add a product to wishlist**
5. **Look for the request:**

```
Request:
  POST /api/v1/wishlist/items

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Payload:
  {
    "product_id": 123
  }

Response:
  {
    "success": true,
    "item_id": 15
  }
```

6. **Then GET your wishlist:**

```
Request:
  GET /api/v1/wishlist

Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
  {
    "id": 8,
    "user_id": "19",     ← Your user_id from JWT token
    "items": [
      {
        "id": 15,
        "product_id": 123,
        "product": {
          "id": 123,
          "title": "Product Name",
          ...
        }
      }
    ]
  }
```

---

## Option 4: Frontend Console Logs

The wishlist hook already has console logs. Check browser console when:

### Adding to wishlist:

```javascript
// You'll see:
"Wishlist: Adding product to backend...";
"✅ Product added to backend wishlist";
"Wishlist loaded for user_id: 19";
```

### Loading wishlist:

```javascript
// You'll see:
"Wishlist: Detected login, syncing with backend...";
"Wishlist loaded for user_id: 19";
```

---

## ✅ Verification Checklist

Run these tests to confirm user_id is saved:

- [ ] **Test 1: Login and add item**

  - [ ] Login with phone number
  - [ ] Add product to wishlist
  - [ ] Check browser console for "user_id: XX"
  - [ ] Verify success message appears

- [ ] **Test 2: Logout and login again**

  - [ ] Logout
  - [ ] Close browser
  - [ ] Open browser and login again
  - [ ] Check wishlist page
  - [ ] ✅ Previous items should still be there!

- [ ] **Test 3: Check Network Tab**

  - [ ] Open DevTools Network tab
  - [ ] Add item to wishlist
  - [ ] Find POST /api/v1/wishlist/items request
  - [ ] Check "Authorization: Bearer ..." header exists
  - [ ] Check response shows success

- [ ] **Test 4: Check GET wishlist response**
  - [ ] Open DevTools Network tab
  - [ ] Refresh wishlist page
  - [ ] Find GET /api/v1/wishlist request
  - [ ] Check response includes "user_id" field
  - [ ] ✅ Verify user_id matches your account

---

## 🔍 Decode Your JWT Token

To see what's inside your token:

```javascript
// In browser console:
const token = localStorage.getItem("authToken");
const base64Url = token.split(".")[1];
const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
const jsonPayload = decodeURIComponent(
  atob(base64)
    .split("")
    .map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    })
    .join("")
);

console.log("JWT Payload:", JSON.parse(jsonPayload));
```

### Expected Output:

```json
{
  "user_id": 19,
  "phone": "+13128059851",
  "market": "us",
  "exp": 1730000000,
  "iat": 1729999000
}
```

✅ This proves your JWT token contains your `user_id`!

---

## 🎯 What to Look For

### ✅ Success Indicators:

1. ✅ JWT token in Authorization header
2. ✅ Response includes `user_id` field
3. ✅ Items persist after logout/login
4. ✅ Items available on different devices
5. ✅ Console shows "Wishlist loaded for user_id: XX"

### ❌ Failure Indicators:

1. ❌ No Authorization header sent
2. ❌ 401 Unauthorized error
3. ❌ Items disappear after logout
4. ❌ Different users see same wishlist
5. ❌ Console shows authentication errors

---

## 🐛 Troubleshooting

### If items are NOT saving to backend:

1. **Check token exists:**

   ```javascript
   console.log(localStorage.getItem("authToken"));
   ```

2. **Check you're logged in:**

   ```javascript
   const token = localStorage.getItem("authToken");
   if (!token) {
     console.error("❌ Not logged in!");
   }
   ```

3. **Check API response:**

   - Open Network tab
   - Look for 401 or 403 errors
   - Check error message

4. **Check backend is running:**
   ```bash
   curl https://marquebackend-production.up.railway.app/health
   ```

---

## ✅ Expected Flow

```
1. User logs in
   → JWT token stored in localStorage
   → Token contains: { user_id: 19, ... }

2. User adds product (id: 123) to wishlist
   → Frontend calls: wishlistApi.add(123)
   → Sends: POST /wishlist/items with token
   → Backend extracts user_id from token
   → Backend saves: (user_id: 19, product_id: 123)

3. Backend database now has:
   ┌────┬─────────┬────────────┐
   │ id │ user_id │ product_id │
   ├────┼─────────┼────────────┤
   │ 15 │ 19      │ 123        │  ← Saved!
   └────┴─────────┴────────────┘

4. User refreshes page or logs in again
   → Frontend calls: wishlistApi.get()
   → Backend queries: WHERE user_id = 19
   → Returns: [{ product_id: 123, ... }]
   → User sees product 123 in wishlist ✅
```

---

## 🎉 Conclusion

Your wishlist **already works correctly** with `user_id`:

- ✅ Token is sent with every request
- ✅ Backend extracts `user_id` from token
- ✅ Items are saved with correct `user_id`
- ✅ Users can only see their own items

**Just test it to confirm!** Add an item, logout, login, and verify it's still there. 🚀

---

**Date:** October 23, 2025  
**Status:** ✅ Ready to Test
