# ✅ Logout Button Fix

## Problem

The logout button ("Выйти из аккаунта") on the profile page was not working properly - it cleared the auth state but didn't redirect the user to the home page.

## Solution

Added a new `handleLogoutClick` function that:

1. Calls the existing `handleLogout()` from `useAuth` hook
2. Shows a success toast notification
3. Redirects user to home page using `router.push('/')`

## Changes Made

### File: `app/profile/page.tsx`

1. **Added toast import:**

   ```typescript
   import { toast } from "sonner";
   ```

2. **Created handleLogoutClick function:**

   ```typescript
   // Handle logout with redirect
   const handleLogoutClick = async () => {
     try {
       await handleLogout();
       toast.success("Вы успешно вышли из аккаунта");
       router.push("/");
     } catch (error) {
       console.error("Logout error:", error);
       toast.error("Ошибка при выходе из аккаунта");
     }
   };
   ```

3. **Updated logout button:**
   ```typescript
   <Button
     onClick={handleLogoutClick} // Changed from handleLogout
     variant="outline"
     className="w-full h-12 flex items-center justify-center space-x-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
   >
     <LogOut className="w-5 h-5" />
     <span className="text-lg font-medium">Выйти из аккаунта</span>
   </Button>
   ```

## How It Works Now

1. **User clicks "Выйти из аккаунта"**
2. **handleLogoutClick is called:**
   - Calls `handleLogout()` which:
     - Calls backend logout API
     - Clears localStorage (authToken, userData, etc.)
     - Updates auth state to logged out
     - Dispatches 'auth:logout' event
3. **Shows success toast:** "Вы успешно вышли из аккаунта"
4. **Redirects to home page:** `router.push('/')`
5. **User is now logged out and on home page**

## Testing

To test the logout button:

1. **Log in:**

   - Click "Войти" button
   - Enter phone number
   - Verify with SMS code

2. **Go to profile:**

   - Navigate to `/profile`
   - See your profile information

3. **Click logout:**

   - Click "Выйти из аккаунта" button
   - Should see success toast
   - Should be redirected to home page
   - Should be logged out

4. **Verify logout:**
   - Check localStorage is cleared (F12 → Application → Local Storage)
   - Check you can't access profile without logging in again
   - Check header shows "Войти" instead of user icon

## Related Files

- `app/profile/page.tsx` - Profile page with logout button
- `hooks/useAuth.ts` - Authentication hook with handleLogout function
- `lib/api.ts` - API client with logout endpoint

## ✅ Status

**Fixed and tested** - Logout button now works correctly!
