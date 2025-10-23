# ✅ Header Login/Logout Indicator Complete

## Requirement

The header/top bar should show different buttons based on authentication status:

- **When user is NOT logged in** → Show "Войти" (Login) button with User icon
- **When user IS logged in** → Show "Выйти" (Logout) button with LogOut icon

This provides a clear visual indicator of the user's authentication state.

## Implementation

### Changes Made in `components/Header.tsx`

#### 1. Added Imports

```typescript
import { LogOut } from "lucide-react";
import { toast } from "sonner";
```

#### 2. Created Unified Auth Handler

```typescript
const handleHeaderAuthClick = async () => {
  if (auth.isLoggedIn) {
    // User is logged in, so logout
    try {
      console.log("🔴 Header: Starting logout...");
      await auth.handleLogout();
      toast.success("Вы успешно вышли из аккаунта");
      console.log("🔴 Header: Redirecting to home...");
      window.location.href = "/";
    } catch (error) {
      console.error("🔴 Header: Logout error:", error);
      toast.error("Ошибка при выходе из аккаунта");
    }
  } else {
    // User is not logged in, so show login modal
    auth.requireAuth(() => {
      router.push("/profile");
    });
  }
};
```

#### 3. Updated Desktop Header Button

```typescript
<button
  onClick={handleHeaderAuthClick}
  className="flex flex-col items-center cursor-pointer hover:text-brand transition-colors relative"
  style={{ background: "transparent", border: "none", padding: "8px" }}
  type="button"
>
  {auth.isLoggedIn ? (
    <>
      <LogOut className="w-5 h-5 mb-1" />
      <span>Выйти</span>
    </>
  ) : (
    <>
      <User className="w-5 h-5 mb-1" />
      <span>Войти</span>
    </>
  )}
</button>
```

#### 4. Updated Mobile Header Button

```typescript
<button
  onClick={handleHeaderAuthClick}
  className="p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
  type="button"
  style={{ background: "transparent", border: "none" }}
>
  {auth.isLoggedIn ? (
    <LogOut className="w-6 h-6 text-red-600" />
  ) : (
    <User className="w-6 h-6 text-brand" />
  )}
</button>
```

## How It Works

### When User is NOT Logged In:

**Desktop:**

```
┌─────────────────┐
│   👤 User icon  │
│     Войти       │
└─────────────────┘
```

**Mobile:**

```
👤 (User icon in brand color)
```

**On Click:**

1. Opens phone number modal
2. User enters phone number
3. SMS verification code is sent
4. User enters verification code
5. User is logged in
6. Redirected to profile page
7. Header button changes to "Выйти"

### When User IS Logged In:

**Desktop:**

```
┌─────────────────┐
│   🚪 Logout icon│
│     Выйти       │
└─────────────────┘
```

**Mobile:**

```
🚪 (Logout icon in red)
```

**On Click:**

1. Calls backend logout API
2. Clears localStorage
3. Shows success toast
4. Redirects to home page
5. Header button changes to "Войти"

## Visual Indicators

| State             | Desktop               | Mobile      | Color         | Icon      |
| ----------------- | --------------------- | ----------- | ------------- | --------- |
| **Not Logged In** | "Войти" + User icon   | User icon   | Default/Brand | 👤 User   |
| **Logged In**     | "Выйти" + LogOut icon | LogOut icon | Red           | 🚪 LogOut |

## User Flow Examples

### Login Flow:

```
1. User sees "Войти" button → User not logged in
2. User clicks "Войти"
3. Phone modal appears
4. User enters phone: +13128059851
5. SMS code sent
6. User enters code
7. User logged in
8. Button changes to "Выйти" → User is logged in ✅
```

### Logout Flow:

```
1. User sees "Выйти" button → User is logged in
2. User clicks "Выйти"
3. Backend API called
4. localStorage cleared
5. Success toast shown
6. Redirected to home
7. Button changes to "Войти" → User logged out ✅
```

## Benefits

### 1. Clear Visual Feedback

- Users immediately know if they're logged in or not
- No confusion about authentication state

### 2. Consistent Behavior

- Desktop and mobile have same logic
- Both show appropriate icons and text

### 3. Quick Access

- Login from anywhere with one click
- Logout from anywhere with one click
- No need to navigate to profile page

### 4. Professional UX

- Industry-standard pattern
- Intuitive for users
- Follows best practices

## Testing

### Test Login Indicator:

1. **Open website (not logged in):**

   ```
   ✅ Desktop shows: "Войти" with User icon
   ✅ Mobile shows: User icon (brand color)
   ```

2. **Click login button:**

   ```
   ✅ Phone modal opens
   ✅ Can enter phone number
   ✅ SMS code sent
   ```

3. **Complete verification:**

   ```
   ✅ User logged in
   ✅ Button changes to "Выйти" with LogOut icon
   ✅ Mobile icon changes to LogOut (red)
   ```

4. **Refresh page:**
   ```
   ✅ Still shows "Выйти" (user remains logged in)
   ```

### Test Logout Indicator:

1. **While logged in:**

   ```
   ✅ Desktop shows: "Выйти" with LogOut icon
   ✅ Mobile shows: LogOut icon (red color)
   ```

2. **Click logout button:**

   ```
   ✅ Success toast appears
   ✅ Redirected to home
   ✅ Console shows logout logs (🔴 markers)
   ```

3. **After logout:**

   ```
   ✅ Button changes to "Войти" with User icon
   ✅ Mobile icon changes to User (brand color)
   ```

4. **Try to click login again:**
   ```
   ✅ Phone modal opens (no auto-login)
   ✅ Requires new verification
   ```

## Console Logs for Debugging

When user clicks logout from header:

```javascript
🔴 Header: Starting logout...
🔴 Starting logout process...
🔴 Calling backend logout API...
🔴 Backend logout successful
🔴 Clearing localStorage...
🔴 Setting auth state to logged out...
🔴 User logged out successfully - localStorage cleared
🔴 Header: Redirecting to home...
```

## Accessibility

- ✅ Semantic button element
- ✅ Clear text labels (desktop)
- ✅ Icon alternatives (mobile)
- ✅ Keyboard accessible
- ✅ Hover states for feedback
- ✅ Focus states maintained

## Responsive Design

### Desktop (md and up):

- Shows full text + icon
- "Войти" or "Выйти"
- Icon above text
- Hover changes color to brand

### Mobile (below md):

- Shows icon only
- User icon (not logged in)
- LogOut icon (logged in)
- LogOut icon is red for visibility

## Integration with Auth System

The header seamlessly integrates with:

- ✅ `useAuth` hook for auth state
- ✅ `handleLogout` from useAuth
- ✅ `requireAuth` for login flow
- ✅ Backend logout API
- ✅ localStorage management
- ✅ Toast notifications

## Files Modified

| File                    | Changes Made                                    |
| ----------------------- | ----------------------------------------------- |
| `components/Header.tsx` | Added logout button logic and visual indicators |

## API Endpoints Used

| Endpoint                              | When Called   | Purpose             |
| ------------------------------------- | ------------- | ------------------- |
| `POST /api/v1/auth/send-verification` | Click "Войти" | Send SMS code       |
| `POST /api/v1/auth/verify-code`       | Enter code    | Verify and login    |
| `POST /api/v1/auth/logout`            | Click "Выйти" | Logout from backend |

## Summary

### Before:

- ❌ Header showed "Войти" when not logged in
- ❌ Header showed "Профиль" when logged in
- ❌ No visual indicator of auth state
- ❌ Had to go to profile page to logout

### After:

- ✅ Header shows "Войти" when not logged in
- ✅ Header shows "Выйти" when logged in
- ✅ Clear visual indicator with different icons
- ✅ Can logout from anywhere (header)
- ✅ Proper backend logout API integration
- ✅ Better user experience

## ✅ Status

**COMPLETE** - Header now properly indicates login/logout state and allows users to:

- See their authentication status at a glance
- Login from any page
- Logout from any page
- Get immediate visual feedback

---

**Created:** October 23, 2025
**Status:** ✅ COMPLETE
**Testing:** Verified on desktop and mobile layouts
