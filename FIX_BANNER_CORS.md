# 🔧 Fix Banner CORS Error

## ❌ Problem Detected

Your console shows:

```
Access to fetch at 'https://marquebackend-production.up.railway.app/api/v1/banners/'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**This is a BACKEND issue**, not frontend! The backend needs to add CORS headers.

---

## 🎯 Quick Fix Options

### Option 1: Backend Fix (RECOMMENDED)

Your backend developer needs to add CORS headers to the `/banners` endpoint.

**For FastAPI (Python):**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://marque.website",
        "http://localhost:3000",
        "http://localhost:2000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option 2: Test Without CORS (Temporary)

While your backend developer fixes CORS, test locally:

```bash
# In your terminal:
npm run dev

# Then open:
http://localhost:3000
```

Local development bypasses some CORS issues.

---

## 🧪 Test Backend Endpoint Directly

### Test 1: Terminal Test

```bash
# Test if endpoint exists and returns data
curl https://marquebackend-production.up.railway.app/api/v1/banners
```

**Expected:**

```json
{
  "banners": [
    {
      "id": 1,
      "title": "...",
      "image_url": "...",
      "banner_type": "hero",
      "is_active": true
    }
  ]
}
```

**If you get:**

- ✅ JSON response → Backend works, just needs CORS fix
- ❌ 404 Not Found → Endpoint doesn't exist
- ❌ 500 Error → Backend has an error

### Test 2: Check CORS Headers

```bash
# Check if CORS headers are present
curl -I https://marquebackend-production.up.railway.app/api/v1/banners
```

**Look for:**

```
Access-Control-Allow-Origin: *
```

**If missing → Backend needs CORS configuration**

---

## 📋 Backend Checklist

Send this to your backend developer:

### For `/api/v1/banners` endpoint:

- [ ] Endpoint exists and returns `200 OK`
- [ ] Response format: `{ "banners": [...] }`
- [ ] CORS headers are set:
  - `Access-Control-Allow-Origin: *` (or specific domain)
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: *`
- [ ] Handles OPTIONS preflight request
- [ ] No redirect (301/307) - should return 200 directly
- [ ] Returns active banners where `is_active = true`

### Example Response Needed:

```json
{
  "banners": [
    {
      "id": 1,
      "title": "Summer Sale",
      "subtitle": "Up to 50% off",
      "image_url": "https://cdn.example.com/banner.jpg",
      "link_url": "/sale",
      "button_text": "Shop Now",
      "banner_type": "hero",
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

---

## 🚀 Frontend Changes Made

I've already updated the frontend:

### 1. Better Error Logging

- Shows detailed error messages
- Logs API responses
- Helps debug issues

### 2. Fallback System

- If API fails → Shows hardcoded banners
- Page never breaks
- Always looks good

### 3. Auto-Detection

- Tries backend first
- Falls back automatically
- No manual configuration needed

---

## 🔍 Debug Steps

### Step 1: Open Console

Go to your site → Press F12 → Console tab

### Step 2: Look for Messages

**If you see:**

```
🔄 Attempting to load banners from backend...
❌ Failed to load banners (using fallback): Network error
```

→ CORS issue (backend needs fixing)

**If you see:**

```
🔄 Attempting to load banners from backend...
📊 Banner API response: { banners: [...] }
✅ SUCCESS! Loaded X banners from backend
```

→ Working! Backend banners are loaded!

### Step 3: Check Network Tab

F12 → Network tab → Refresh page

Look for request to `/banners`:

- **Status 200** → Good, check response
- **Status 404** → Endpoint doesn't exist
- **Status 500** → Backend error
- **Status 307** → Redirect (needs fixing)
- **CORS error** → Backend needs CORS headers

---

## 💡 Temporary Workaround

While waiting for backend fix, your site **still works** with fallback banners!

The hardcoded banners are:

```typescript
fallbackHeroBanners = [
  {
    id: "fallback-1",
    title: "Новая коллекция",
    image_url: "/b93dc4af6b33446ca2a5472bc63797bc73a9eae2.png",
    banner_type: "hero",
    display_order: 1,
  },
  {
    id: "fallback-2",
    title: "Скидки",
    image_url: "/5891ae04bafdf76a4d441c78c7e1f8a0a3a1d631.png",
    banner_type: "hero",
    display_order: 2,
  },
];
```

**These show until backend is fixed** ✓

---

## ✅ When Backend is Fixed

Once your backend developer adds CORS headers and fixes the endpoint:

1. **No frontend changes needed** ✓
2. **Just refresh the page** ✓
3. **Banners load automatically** ✓

---

## 🎯 What Backend Developer Needs to Do

### FastAPI Example (Python):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://marque.website",
        "https://marque-frontend.vercel.app",
        "http://localhost:3000",
        "*"  # Or specific domains only
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Banners endpoint
@app.get("/api/v1/banners")
async def get_banners():
    # Get from database
    banners = db.query(Banner).filter(Banner.is_active == True).all()

    return {
        "banners": [
            {
                "id": banner.id,
                "title": banner.title,
                "subtitle": banner.subtitle,
                "image_url": banner.image_url,
                "link_url": banner.link_url,
                "button_text": banner.button_text,
                "banner_type": banner.banner_type,
                "is_active": banner.is_active,
                "sort_order": banner.sort_order
            }
            for banner in banners
        ]
    }
```

### Express.js Example (Node.js):

```javascript
const express = require("express");
const cors = require("cors");

const app = express();

// Add CORS
app.use(
  cors({
    origin: ["https://marque.website", "http://localhost:3000"],
    credentials: true,
  })
);

// Banners endpoint
app.get("/api/v1/banners", async (req, res) => {
  const banners = await db.banners.findAll({
    where: { is_active: true },
    order: [["sort_order", "ASC"]],
  });

  res.json({ banners });
});
```

---

## 📊 Current Status

| Item                 | Status           |
| -------------------- | ---------------- |
| Frontend Integration | ✅ DONE          |
| API Client Updated   | ✅ DONE          |
| Error Handling       | ✅ DONE          |
| Fallback Banners     | ✅ WORKING       |
| **Backend CORS**     | ❌ **NEEDS FIX** |
| **Backend Endpoint** | ❓ **TO VERIFY** |

---

## 🎉 Summary

**Frontend is ready!** ✅

The issue is:

1. ❌ Backend `/banners` endpoint has CORS error
2. ❌ Or endpoint doesn't exist / returns wrong format

**What to do:**

1. Share this document with your backend developer
2. They need to add CORS headers
3. Verify endpoint returns correct format
4. Once fixed, refresh page → banners load automatically!

**In the meantime:**

- ✅ Site works with fallback banners
- ✅ No broken pages
- ✅ Professional appearance maintained

---

## 📞 Quick Backend Test

**Send this to your backend dev:**

```bash
# Test if endpoint works
curl https://marquebackend-production.up.railway.app/api/v1/banners

# Should return:
# { "banners": [ {...} ] }
```

**If it works in curl but not in browser:**
→ CORS headers missing! Add them! ✅

---

**Frontend is 100% ready. Waiting on backend CORS fix!** 🚀
