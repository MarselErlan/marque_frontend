# 🚀 Quick Guide - Header Button Behavior

## 📍 What Shows Where

```
┌─────────────────────────────────────────────────────────┐
│                    NOT LOGGED IN                        │
└─────────────────────────────────────────────────────────┘

Any Page (Home, Cart, Wishlist, Products, etc.)
┌──────────┐
│ 👤 Войти │  ← Click to login
└──────────┘

Action: Opens phone verification modal
```

```
┌─────────────────────────────────────────────────────────┐
│     LOGGED IN - On Home/Cart/Wishlist/Products/etc      │
└─────────────────────────────────────────────────────────┘

┌─────────────┐
│ 👤 Профиль  │  ← Click to go to profile
└─────────────┘

Action: Navigate to /profile page
```

```
┌─────────────────────────────────────────────────────────┐
│            LOGGED IN - On Profile Page                  │
└─────────────────────────────────────────────────────────┘

┌────────────┐
│ 🚪 Выйти   │  ← Click to logout
└────────────┘

Action: Logout & redirect to home
```

---

## 🔄 User Flow Example

```
START: User visits marque.website (not logged in)

┌────────────────────────────────────────┐
│  MARQUE     [🔍 Search]    👤 Войти   │ ← Header
└────────────────────────────────────────┘

1. User browses products
2. Adds 3 items to wishlist
   💾 Saved in browser (localStorage)

3. User clicks "Войти"
   → Phone modal appears
   → Enter: +13128059851
   → Enter code: 220263
   → ✅ Login successful!

4. Auto redirect to /profile

┌────────────────────────────────────────┐
│  MARQUE     [🔍 Search]    🚪 Выйти   │ ← On profile page
└────────────────────────────────────────┘

   🎉 "Избранное синхронизировано!" toast
   💾 3 items now saved to account

5. User clicks MARQUE logo → Go to home

┌────────────────────────────────────────┐
│  MARQUE     [🔍 Search]   👤 Профиль  │ ← Not on profile
└────────────────────────────────────────┘

6. User goes to wishlist page

┌────────────────────────────────────────┐
│  MARQUE     [🔍 Search]   👤 Профиль  │ ← Still not on profile
└────────────────────────────────────────┘

   Wishlist shows: 3 items ✅

7. User adds 2 more items
   💾 Saved to backend (total: 5 items)

8. User clicks "Профиль" → Go to profile

┌────────────────────────────────────────┐
│  MARQUE     [🔍 Search]    🚪 Выйти   │ ← On profile page
└────────────────────────────────────────┘

9. User clicks "Выйти"
   → Logout
   → Redirect to home

┌────────────────────────────────────────┐
│  MARQUE     [🔍 Search]    👤 Войти   │ ← Logged out
└────────────────────────────────────────┘

10. User logs in again later
    → Wishlist loads from backend
    → All 5 items still there! ✅✅✅
```

---

## 💾 Wishlist Storage

```
NOT LOGGED IN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
localStorage.wishlist = [item1, item2, item3]
              ↓
         Browser only
         (Lost if cleared)


LOGIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
localStorage.wishlist → Backend API
              ↓
      POST /api/v1/wishlist
              ↓
  ✅ Saved to user account


LOGGED IN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All actions → Backend API
              ↓
    GET /api/v1/wishlist
    POST /api/v1/wishlist
    DELETE /api/v1/wishlist/{id}
              ↓
  💾 Saved to account
  🌍 Available on all devices
```

---

## 🎯 Quick Rules

| Where           | Status        | Button     | Action        |
| --------------- | ------------- | ---------- | ------------- |
| 🏠 Any page     | Not logged in | 👤 Войти   | Login modal   |
| 🏠 Any page     | Logged in     | 👤 Профиль | Go to profile |
| 👤 Profile page | Logged in     | 🚪 Выйти   | Logout        |

---

## 📱 Mobile Version

Same logic, but icons only (no text):

```
Not logged in:  👤 (brand color)
Logged in:      👤 (brand color) → Goes to profile
On profile:     🚪 (red) → Logout
```

---

## ✅ What You Get

### Smart Button:

- ✅ Always shows correct action
- ✅ Changes based on page and login status
- ✅ Clear labels (users know what will happen)

### Wishlist Sync:

- ✅ Add items before login → Still there after login
- ✅ Add items after login → Saved to account
- ✅ Login from another device → All items available
- ✅ Never lose wishlist items

---

**That's it! Simple and smart. 🎉**
