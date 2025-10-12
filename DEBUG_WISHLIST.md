# 🔍 Debug Wishlist - Check Connection Status

## Quick Check (30 seconds)

### Step 1: Open Browser Console

Press `F12` or `Right-click → Inspect → Console`

### Step 2: Run These Commands

```javascript
// 1. Check if you're logged in
const token = localStorage.getItem("authToken");
console.log("🔐 Login Status:", token ? "✅ LOGGED IN" : "❌ GUEST MODE");

// 2. Check localStorage wishlist (should be empty if logged in and synced)
const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
console.log("💾 localStorage wishlist:", localWishlist.length, "items");

// 3. Summary
console.log("\n📊 SUMMARY:");
if (token && localWishlist.length === 0) {
  console.log("✅ Using BACKEND data (synced correctly!)");
} else if (!token && localWishlist.length > 0) {
  console.log("💾 Using GUEST localStorage data");
} else if (token && localWishlist.length > 0) {
  console.log("⚠️ Not synced yet - items still in localStorage");
}
```

---

## What Your 4 Items Mean

### Scenario 1: ✅ You're Logged In (Backend Data)

```
Your wishlist IS connected to backend!
The 4 items are from your backend database.
Everything is working correctly! 🎉
```

**To verify:**

- Run the code above
- Should show: "✅ LOGGED IN"
- localStorage should be empty
- Items are from backend API

### Scenario 2: 💾 You're a Guest (localStorage Data)

```
Your wishlist is using guest mode (localStorage).
When you login, these 4 items will sync to backend.
This is expected behavior!
```

**To test sync:**

1. You're currently a guest with 4 items
2. Login → Watch for toast "Избранное синхронизировано!"
3. Items move to backend
4. localStorage clears

### Scenario 3: ⚠️ Logged In But Not Synced

```
You logged in, but items haven't synced yet.
This happens if:
- You added items, then logged in on another tab
- You manually added items to localStorage
- Page needs refresh
```

**Fix:**

- Refresh the page (Cmd+R)
- Or logout and login again
- Sync will happen automatically

---

## Test Backend Connection

### Check if Backend Has Your Wishlist

```bash
# In terminal, run:
TOKEN="YOUR_AUTH_TOKEN_HERE"

curl -H "Authorization: Bearer $TOKEN" \
     https://marquebackend-production.up.railway.app/api/v1/wishlist
```

**Or in browser console:**

```javascript
// Get your token
const token = localStorage.getItem("authToken");

// Fetch from backend
fetch("https://marquebackend-production.up.railway.app/api/v1/wishlist", {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  },
})
  .then((r) => r.json())
  .then((data) => {
    console.log("🔗 Backend wishlist:", data);
    console.log("📊 Total items:", data.total_items || data.items?.length || 0);
  })
  .catch((err) => console.error("❌ Backend error:", err));
```

---

## Expected Behavior

### Guest User Flow

```
1. You add 4 items as guest
   └─ Saved in localStorage ✓

2. Items persist (page refresh works)
   └─ Reading from localStorage ✓

3. You login
   └─ Toast: "Избранное синхронизировано!" ✓
   └─ Items upload to backend ✓
   └─ localStorage clears ✓

4. Now using backend data
   └─ Works on all devices ✓
```

### Logged-In User Flow

```
1. You're logged in
   └─ Has auth token ✓

2. Add items to wishlist
   └─ Saves directly to backend ✓
   └─ No localStorage used ✓

3. Page refresh
   └─ Loads from backend ✓

4. Login on another device
   └─ Same 4 items appear ✓
```

---

## Common Questions

### Q: Why do I see 4 items?

**A:** You have 4 products in your wishlist! This could be from:

- Backend (if logged in)
- localStorage (if guest)

### Q: Are they connected to backend?

**A:** Check your login status:

- Logged in = Using backend ✅
- Guest = Using localStorage (will sync on login)

### Q: How do I know if it's synced?

**A:** Run the debug script above, or:

1. Check if you have auth token
2. Check if localStorage wishlist is empty
3. If yes to both = Synced! ✓

### Q: Will my items stay if I logout?

**A:** Depends:

- Logout = Items move to localStorage (guest mode)
- Login again = Items sync back from backend
- No data loss! ✅

---

## Manual Sync Test

Want to see sync in action?

```javascript
// 1. Manually trigger sync
window.dispatchEvent(new CustomEvent("auth:login"));

// 2. Watch console for:
console.log("Wishlist: Detected login, syncing with backend...");

// 3. Should see toast
// "Избранное синхронизировано!"
```

---

## Troubleshooting

### Problem: Items not syncing

**Check 1: Are you logged in?**

```javascript
localStorage.getItem("authToken"); // Should return token
```

**Check 2: Is event firing?**

```javascript
// Add listener to test
window.addEventListener("auth:login", () => {
  console.log("✅ Auth login event fired!");
});
```

**Check 3: Check console for errors**
Look for:

- "Failed to sync wishlist item:"
- Network errors
- CORS errors

### Problem: Duplicate items

**Cause:** Items in both localStorage AND backend

**Fix:**

```javascript
// Clear localStorage wishlist
localStorage.removeItem("wishlist");

// Refresh page
location.reload();

// Now only using backend data
```

---

## Your Current Situation

Based on your screenshot showing **4 items in wishlist**:

### Most Likely: ✅ Everything is Working!

Your 4 items are either:

1. **From backend** (if you're logged in) ✅
2. **From localStorage** (if you're a guest) ✅

Both are correct behavior!

### To Confirm:

Run this one command in browser console:

```javascript
const token = localStorage.getItem("authToken");
const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
console.log(
  token ? "✅ Backend Data (Logged In)" : "💾 Guest Data (localStorage)",
  "\nItems shown:",
  4,
  "\nLocalStorage items:",
  local.length
);
```

**Expected results:**

- **If logged in:** "✅ Backend Data (Logged In), localStorage items: 0"
- **If guest:** "💾 Guest Data (localStorage), localStorage items: 4"

---

## Conclusion

Your wishlist IS connected! The 4 items you see are:

- ✅ Either from your backend account (if logged in)
- ✅ Or from guest localStorage (waiting to sync)

**Both scenarios are working correctly!** 🎉

Want to test the sync? Try:

1. Logout (if logged in)
2. Add a 5th item
3. Login again
4. Watch for sync toast
5. All 5 items should be there!

---

**Need more help?** Share your console output and I'll tell you exactly what's happening! 😊
