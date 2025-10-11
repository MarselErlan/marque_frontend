# 🏗️ Cart & Wishlist Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MARQUE E-COMMERCE PLATFORM                            │
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────────────────┐    │
│  │   Frontend   │◄────►│  Auth System │◄────►│   Backend API         │    │
│  │  (Next.js)   │      │  (useAuth)   │      │  (Railway/FastAPI)    │    │
│  └──────────────┘      └──────────────┘      └───────────────────────┘    │
│         │                      │                         │                   │
│         │                      │                         │                   │
│         ▼                      ▼                         ▼                   │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────────────────┐    │
│  │  Cart Hook   │      │Event System  │      │   PostgreSQL DB       │    │
│  │  (useCart)   │      │(CustomEvents)│      │   (Persistent Store)  │    │
│  └──────────────┘      └──────────────┘      └───────────────────────┘    │
│         │                      │                         │                   │
│         ▼                      ▼                         ▼                   │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────────────────┐    │
│  │Wishlist Hook │      │ localStorage │      │   Redis Cache         │    │
│  │(useWishlist) │      │ (Guest Data) │      │   (Optional)          │    │
│  └──────────────┘      └──────────────┘      └───────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction

### 1. **Authentication Flow**

```
┌──────────┐                 ┌──────────┐                 ┌───────────┐
│   User   │                 │  useAuth │                 │  Backend  │
└─────┬────┘                 └────┬─────┘                 └─────┬─────┘
      │                           │                             │
      │  Enter Phone              │                             │
      ├──────────────────────────►│                             │
      │                           │  POST /verify/send          │
      │                           ├────────────────────────────►│
      │                           │                             │
      │                           │  SMS Sent ✓                 │
      │                           │◄────────────────────────────┤
      │  Enter Code               │                             │
      ├──────────────────────────►│                             │
      │                           │  POST /verify/code          │
      │                           ├────────────────────────────►│
      │                           │                             │
      │                           │  JWT Token ✓                │
      │                           │◄────────────────────────────┤
      │                           │                             │
      │                           │  dispatch('auth:login')     │
      │                           ├─────────────┐               │
      │                           │             │               │
      │                           │◄────────────┘               │
      │  "Logged in!" Toast       │                             │
      │◄──────────────────────────┤                             │
      │                           │                             │
```

### 2. **Cart Synchronization Flow**

```
┌──────────────┐                 ┌────────────┐                 ┌───────────┐
│   useCart    │                 │ Event Bus  │                 │  Backend  │
└──────┬───────┘                 └─────┬──────┘                 └─────┬─────┘
       │                               │                              │
       │  addEventListener('auth:login')                              │
       ├──────────────────────────────►│                              │
       │                               │                              │
       │                               │  'auth:login' event          │
       │                               │◄─────────────────────────────┤
       │                               │                              │
       │  Event Received!              │                              │
       │◄──────────────────────────────┤                              │
       │                               │                              │
       │  syncCartWithBackend()        │                              │
       ├───────────────┐               │                              │
       │               │               │                              │
       │  1. Get localStorage cart     │                              │
       │  2. Parse items               │                              │
       │◄──────────────┘               │                              │
       │                               │                              │
       │  For each item:               │                              │
       │  POST /cart/items             │                              │
       ├───────────────────────────────┼─────────────────────────────►│
       │                               │                              │
       │                               │  Items saved ✓               │
       │◄──────────────────────────────┼──────────────────────────────┤
       │                               │                              │
       │  clear localStorage           │                              │
       ├───────────────┐               │                              │
       │◄──────────────┘               │                              │
       │                               │                              │
       │  GET /cart                    │                              │
       ├───────────────────────────────┼─────────────────────────────►│
       │                               │                              │
       │                               │  Full cart data ✓            │
       │◄──────────────────────────────┼──────────────────────────────┤
       │                               │                              │
       │  toast.success()              │                              │
       ├───────────────┐               │                              │
       │◄──────────────┘               │                              │
       │                               │                              │
```

### 3. **Data Flow: Guest → Logged In**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GUEST USER MODE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Add to Cart ─────► localStorage ────► {"cart": [...]}                 │
│                                                                          │
│   Add to Wishlist ─► localStorage ────► {"wishlist": [...]}             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │  USER LOGS IN
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATED USER MODE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   localStorage cart ─────► Backend API ────► PostgreSQL                 │
│                  │                                    │                  │
│                  │   Sync                            │                  │
│                  │   ✓                                │                  │
│                  └──────► Clear localStorage          │                  │
│                                                       │                  │
│   localStorage wishlist ─► Backend API ────► PostgreSQL                 │
│                  │                                    │                  │
│                  │   Sync                            │                  │
│                  │   ✓                                │                  │
│                  └──────► Clear localStorage          │                  │
│                                                       │                  │
│   Add to Cart ──────────► Backend API ────► PostgreSQL                  │
│                                                       │                  │
│   Add to Wishlist ───────► Backend API ────► PostgreSQL                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Event System Architecture

### Custom Events

```javascript
// Event Types
type AuthEvent = 'auth:login' | 'auth:logout'

// Event Flow
┌──────────────┐
│   useAuth    │
│  handleLogin │
└──────┬───────┘
       │
       │  window.dispatchEvent(
       │    new CustomEvent('auth:login')
       │  )
       │
       ▼
┌─────────────────────────────────────────┐
│          Global Event Bus               │
│     (window.addEventListener)           │
└─────────┬─────────────────────┬─────────┘
          │                     │
          ▼                     ▼
   ┌──────────┐         ┌─────────────┐
   │ useCart  │         │ useWishlist │
   └──────────┘         └─────────────┘
```

### Event Listeners

```typescript
// In useCart.ts
useEffect(() => {
  const handleLogin = async () => {
    await syncCartWithBackend();
  };

  const handleLogout = async () => {
    await loadCart();
  };

  window.addEventListener("auth:login", handleLogin);
  window.addEventListener("auth:logout", handleLogout);

  return () => {
    window.removeEventListener("auth:login", handleLogin);
    window.removeEventListener("auth:logout", handleLogout);
  };
}, []);
```

---

## Data Storage Strategy

### 1. **Guest User (Not Logged In)**

```
┌─────────────────────────────────────────────────┐
│             localStorage                         │
├─────────────────────────────────────────────────┤
│                                                  │
│  "cart": [                                       │
│    {                                             │
│      id: "123",                                  │
│      name: "Black T-Shirt",                      │
│      price: 1500,                                │
│      quantity: 2                                 │
│    }                                             │
│  ]                                               │
│                                                  │
│  "wishlist": [                                   │
│    {                                             │
│      id: "456",                                  │
│      name: "Blue Jeans",                         │
│      price: 3500                                 │
│    }                                             │
│  ]                                               │
│                                                  │
└─────────────────────────────────────────────────┘
     ▲                                    │
     │                                    │
     │  Read on load                     │  Write on change
     │                                    ▼
┌─────────────────────────────────────────────────┐
│           React State (useCart)                  │
└─────────────────────────────────────────────────┘
```

### 2. **Authenticated User (Logged In)**

```
┌─────────────────────────────────────────────────┐
│         Backend API (PostgreSQL)                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  users_cart:                                     │
│    user_id | sku_id | quantity | ...            │
│    ─────────────────────────────────            │
│    123     | 456    | 2        | ...            │
│                                                  │
│  users_wishlist:                                 │
│    user_id | product_id | ...                   │
│    ─────────────────────────────                │
│    123     | 789        | ...                   │
│                                                  │
└─────────────────────────────────────────────────┘
     ▲                                    │
     │                                    │
     │  API Fetch                        │  API Update
     │                                    ▼
┌─────────────────────────────────────────────────┐
│           React State (useCart)                  │
│     (localStorage used as cache only)            │
└─────────────────────────────────────────────────┘
```

---

## API Integration

### Cart API Endpoints

```
┌────────────────────────────────────────────────────────────────┐
│                         Cart API                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/v1/cart                                              │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  └─ Response: { items: [...], total_items: 5, ... }           │
│                                                                 │
│  POST /api/v1/cart/items                                       │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  ├─ Body: { sku_id: 123, quantity: 2 }                        │
│  └─ Response: { message: "Added", ... }                       │
│                                                                 │
│  PUT /api/v1/cart/items/{item_id}                             │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  ├─ Body: { quantity: 3 }                                     │
│  └─ Response: { message: "Updated", ... }                     │
│                                                                 │
│  DELETE /api/v1/cart/items/{item_id}                          │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  └─ Response: { message: "Removed", ... }                     │
│                                                                 │
│  DELETE /api/v1/cart                                           │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  └─ Response: { message: "Cart cleared", ... }                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Wishlist API Endpoints

```
┌────────────────────────────────────────────────────────────────┐
│                      Wishlist API                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/v1/wishlist                                          │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  └─ Response: { items: [...], total_items: 3, ... }           │
│                                                                 │
│  POST /api/v1/wishlist/items                                   │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  ├─ Body: { product_id: 456 }                                 │
│  └─ Response: { message: "Added", ... }                       │
│                                                                 │
│  DELETE /api/v1/wishlist/items/{product_id}                   │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  └─ Response: { message: "Removed", ... }                     │
│                                                                 │
│  DELETE /api/v1/wishlist                                       │
│  ├─ Headers: Authorization: Bearer {token}                     │
│  └─ Response: { message: "Wishlist cleared", ... }            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────┐       ┌────────────┐       ┌──────────────┐
│   Client    │       │   Backend  │       │  PostgreSQL  │
└──────┬──────┘       └─────┬──────┘       └──────┬───────┘
       │                    │                      │
       │  1. POST /verify/send                     │
       │  phone: "+996XXX"  │                      │
       ├───────────────────►│                      │
       │                    │                      │
       │                    │  2. Generate code    │
       │                    │  Store in Redis      │
       │                    ├─────────────────────►│
       │                    │                      │
       │  3. SMS sent ✓     │                      │
       │◄───────────────────┤                      │
       │                    │                      │
       │  4. POST /verify/code                     │
       │  code: "123456"    │                      │
       ├───────────────────►│                      │
       │                    │                      │
       │                    │  5. Verify code      │
       │                    │  Get user from DB    │
       │                    ├─────────────────────►│
       │                    │                      │
       │                    │  6. Generate JWT     │
       │                    │  {user_id: 123}      │
       │                    ├──────────┐           │
       │                    │◄─────────┘           │
       │                    │                      │
       │  7. JWT Token ✓    │                      │
       │  {                 │                      │
       │    access_token,   │                      │
       │    expires_in,     │                      │
       │    user: {...}     │                      │
       │  }                 │                      │
       │◄───────────────────┤                      │
       │                    │                      │
       │  8. Save to localStorage                  │
       ├──────────┐         │                      │
       │◄─────────┘         │                      │
       │                    │                      │
```

### Protected Routes

```
┌─────────────────────────────────────────────────┐
│         API Request with JWT                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Headers:                                        │
│    Authorization: Bearer eyJhbGc...              │
│    Content-Type: application/json                │
│                                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Middleware      │
         │  Verify JWT      │
         └────────┬─────────┘
                  │
           Valid? │
            ┌─────┴─────┐
            ▼           ▼
         YES           NO
            │           │
            │           └──► 401 Unauthorized
            │
            ▼
    ┌──────────────┐
    │  Extract     │
    │  user_id     │
    │  from token  │
    └───────┬──────┘
            │
            ▼
    ┌──────────────┐
    │  Process     │
    │  request     │
    └───────┬──────┘
            │
            ▼
    ┌──────────────┐
    │  Return      │
    │  response    │
    └──────────────┘
```

---

## Error Handling Strategy

### Network Error Flow

```
┌─────────────┐       ┌────────────┐
│  Frontend   │       │  Backend   │
└──────┬──────┘       └─────┬──────┘
       │                    │
       │  API Request       │
       ├───────────────────►│
       │                    │
       │                    X  Network Error
       │                    │
       │  Error Response    │
       │◄───────────────────┤
       │                    │
       ├──────────┐
       │  Catch   │
       │◄─────────┘
       │
       ├──────────┐
       │ Fallback │
       │ to       │
       │ localStorage
       │◄─────────┘
       │
       │  Show Error Toast
       ├──────────┐
       │◄─────────┘
       │
       │  Continue working
       │  (offline mode)
       │
```

### Error Types Handled

```typescript
try {
  await cartApi.add(sku_id, quantity);
  toast.success("Added to cart!");
} catch (error) {
  if (error.status === 401) {
    // Unauthorized - token expired
    handleLogout();
    toast.error("Session expired, please login");
  } else if (error.status === 404) {
    // Not found
    toast.error("Product not found");
  } else if (error.status === 500) {
    // Server error
    toast.error("Server error, try again later");
  } else {
    // Network error - fallback to localStorage
    localStorage.setItem("cart", JSON.stringify(items));
    toast.warning("Offline mode - will sync when online");
  }
}
```

---

## Performance Optimization

### Caching Strategy

```
┌─────────────────────────────────────────────────┐
│              Request Flow                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. User action (add to cart)                   │
│     │                                            │
│     ▼                                            │
│  2. Update React state immediately               │
│     (Optimistic UI)                              │
│     │                                            │
│     ▼                                            │
│  3. Send API request in background               │
│     │                                            │
│     ├──► Success: Keep state                     │
│     │                                            │
│     └──► Failure: Rollback state                 │
│          Show error toast                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Batch Operations

```typescript
// Instead of:
items.forEach(async (item) => {
  await cartApi.add(item.sku_id, item.quantity); // ❌ N requests
});

// We do:
await Promise.all(
  items.map(
    (item) => cartApi.add(item.sku_id, item.quantity) // ✅ Parallel requests
  )
);
```

---

## Deployment Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                            Production Stack                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐│
│  │  Vercel/Netlify │     │  Railway          │     │  PostgreSQL    ││
│  │  (Frontend)     │────►│  (Backend API)    │────►│  (Database)    ││
│  │  Next.js        │     │  FastAPI/Python   │     │                ││
│  └─────────────────┘     └──────────────────┘     └────────────────┘│
│         │                         │                        │          │
│         │  HTTPS                  │  JWT Auth              │  SSL     │
│         │  TLS                    │  CORS                  │          │
│         │                         │                        │          │
│         ▼                         ▼                        ▼          │
│  ┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐│
│  │  CDN Cache      │     │  Redis Cache      │     │  Backup DB     ││
│  │  (Static Files) │     │  (Sessions)       │     │  (Replicas)    ││
│  └─────────────────┘     └──────────────────┘     └────────────────┘│
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Complete Request Lifecycle

### Add to Cart (Authenticated User)

```
 USER ACTION                    FRONTEND                          BACKEND
     │                             │                                 │
     │  Click "Add to Cart"        │                                 │
     ├────────────────────────────►│                                 │
     │                             │                                 │
     │                             │  1. Optimistic Update           │
     │                             │     setState(newCart)           │
     │                             ├──────────┐                      │
     │                             │◄─────────┘                      │
     │                             │                                 │
     │  UI Updated ✓               │                                 │
     │◄────────────────────────────┤                                 │
     │                             │                                 │
     │                             │  2. API Request                 │
     │                             │     POST /cart/items            │
     │                             ├────────────────────────────────►│
     │                             │                                 │
     │                             │                                 │  3. Validate
     │                             │                                 │     ├─ JWT
     │                             │                                 │     ├─ SKU
     │                             │                                 │     └─ Stock
     │                             │                                 │
     │                             │                                 │  4. Save to DB
     │                             │                                 │     INSERT INTO
     │                             │                                 │     cart_items
     │                             │                                 ├──────────┐
     │                             │                                 │◄─────────┘
     │                             │                                 │
     │                             │  5. Response {success: true}    │
     │                             │◄────────────────────────────────┤
     │                             │                                 │
     │                             │  6. Show Toast                  │
     │                             │     "Added to cart!"            │
     │                             ├──────────┐                      │
     │                             │◄─────────┘                      │
     │                             │                                 │
     │  Toast Notification ✓       │                                 │
     │◄────────────────────────────┤                                 │
     │                             │                                 │
```

---

## 🎯 Summary

This architecture provides:

✅ **Scalability** - Handle thousands of concurrent users  
✅ **Reliability** - Multiple fallback mechanisms  
✅ **Security** - JWT authentication, HTTPS, CORS  
✅ **Performance** - Optimistic UI, caching, batch operations  
✅ **UX** - Instant feedback, offline support, error handling  
✅ **Maintainability** - Clear separation of concerns, well-documented

**Everything is production-ready!** 🚀
