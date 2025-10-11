# Catalog Sidebar - Backend API Integration

## Overview

The catalog sidebar has been updated to fetch real categories and subcategories from your backend API instead of using hardcoded data.

## Changes Made

### 1. **Updated API Client** (`lib/api.ts`)

Added a new method to fetch subcategories by category slug:

```typescript
export const categoriesApi = {
  getAll: () =>
    apiRequest<{ categories: any[] }>(API_CONFIG.ENDPOINTS.CATEGORIES),

  getDetail: (slug: string) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.CATEGORY_DETAIL}/${slug}`),

  // NEW METHOD
  getSubcategories: (categorySlug: string) =>
    apiRequest<{ subcategories: any[] }>(`${API_CONFIG.ENDPOINTS.CATEGORIES}/${categorySlug}/subcategories`),

  getSubcategoryProducts: (
    categorySlug: string,
    subcategorySlug: string,
    filters?: { ... }
  ) => ...
}
```

### 2. **Updated Homepage** (`app/page.tsx`)

#### Added Imports

```typescript
import { productsApi, bannersApi, categoriesApi } from "@/lib/api";
```

#### Added State Variables

```typescript
// API data states
const [apiCategories, setApiCategories] = useState<any[]>([]);
const [apiSubcategories, setApiSubcategories] = useState<any[]>([]);
const [loadingCategories, setLoadingCategories] = useState(false);
const [loadingSubcategories, setLoadingSubcategories] = useState(false);
const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<
  string | null
>(null);
```

#### Added useEffect Hooks

**Load Categories When Catalog Opens:**

```typescript
useEffect(() => {
  const loadCategories = async () => {
    if (showCatalog && apiCategories.length === 0) {
      try {
        setLoadingCategories(true);
        const response = await categoriesApi.getAll();
        if (response?.categories && response.categories.length > 0) {
          setApiCategories(response.categories);
          // Set first category as selected by default
          if (!selectedCatalogCategory && response.categories[0]?.slug) {
            setSelectedCatalogCategory(response.categories[0].slug);
          }
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    }
  };
  loadCategories();
}, [showCatalog]);
```

**Load Subcategories When Category Selected:**

```typescript
useEffect(() => {
  const loadSubcategories = async () => {
    if (selectedCatalogCategory) {
      try {
        setLoadingSubcategories(true);
        const response = await categoriesApi.getSubcategories(
          selectedCatalogCategory
        );
        if (response?.subcategories) {
          setApiSubcategories(response.subcategories);
        }
      } catch (error) {
        console.error("Failed to load subcategories:", error);
        setApiSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    }
  };
  loadSubcategories();
}, [selectedCatalogCategory]);
```

#### Removed Hardcoded Data

- ❌ Removed `catalogCategories` array
- ❌ Removed `menCategories` array
- ❌ Removed `womenCategories` array
- ❌ Removed `getCurrentCategories()` function

#### Updated CatalogSidebar Component

The sidebar now:

- Uses `apiCategories` from API instead of hardcoded categories
- Uses `apiSubcategories` from API instead of hardcoded subcategories
- Shows loading states while fetching data
- Uses correct API field names (`slug`, `name`, `image_url`, `product_count`)
- Handles empty states gracefully

**Key Features:**

```typescript
// First Sidebar - Main Categories
{loadingCategories ? (
  <div className="text-center py-8 text-gray-500">Загрузка...</div>
) : apiCategories.length > 0 ? (
  apiCategories.map((category) => (
    <div
      key={category.id || category.slug}
      className={...}
      onClick={() => setSelectedCatalogCategory(category.slug)}
    >
      <span>{category.name}</span>
      <ArrowRight className={...} />
    </div>
  ))
) : (
  <div className="text-center py-8 text-gray-500">Нет категорий</div>
)}

// Second Sidebar - Subcategories
{loadingSubcategories ? (
  <div className="text-center py-8 text-gray-500">Загрузка...</div>
) : apiSubcategories.length > 0 ? (
  apiSubcategories.map((subcat) => (
    <Link
      key={subcat.id || subcat.slug}
      href={`/subcategory/${selectedCatalogCategory}/${subcat.slug}`}
      className={...}
    >
      <img src={subcat.image_url || subcat.image || "/images/black-tshirt.jpg"} />
      <span>{subcat.name}</span>
      <span>{subcat.product_count || 0}</span>
    </Link>
  ))
) : (
  <div className="text-center py-8 text-gray-500">Нет подкатегорий</div>
)}
```

## API Endpoints Used

### 1. Get All Categories

**Endpoint:** `GET /api/v1/categories`

**Response:**

```json
{
  "categories": [
    {
      "id": 14,
      "name": "Мужчинам (Test)",
      "slug": "men-test",
      "icon": "fa-male",
      "image_url": "/uploads/categories/test-men-category.jpg",
      "product_count": 1,
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

### 2. Get Subcategories by Category

**Endpoint:** `GET /api/v1/categories/{category_slug}/subcategories`

**Example:** `GET /api/v1/categories/men-test/subcategories`

**Response:**

```json
{
  "subcategories": [
    {
      "id": 20,
      "name": "Футболки и поло (Test)",
      "slug": "tshirts-test",
      "image_url": "/uploads/subcategories/test-tshirts.jpg",
      "product_count": 1,
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

## How It Works

1. **User clicks "Каталог" button** → `setShowCatalog(true)`
2. **Sidebar opens** → First useEffect triggers
3. **Categories are fetched** from `/api/v1/categories`
4. **First category is auto-selected** → Second useEffect triggers
5. **Subcategories are fetched** from `/api/v1/categories/{slug}/subcategories`
6. **User clicks a category** → Subcategories reload for that category
7. **User clicks a subcategory** → Navigate to `/subcategory/{category}/{subcategory}`

## Features

✅ **Dynamic Data Loading** - All categories and subcategories are loaded from your backend API
✅ **Loading States** - Shows "Загрузка..." while fetching data
✅ **Empty States** - Shows "Нет категорий" or "Нет подкатегорий" if no data
✅ **Error Handling** - Catches and logs API errors gracefully
✅ **Auto-selection** - First category is automatically selected when sidebar opens
✅ **Performance** - Categories are only loaded once when sidebar first opens
✅ **Smooth Navigation** - Category selection immediately loads subcategories
✅ **Proper Routing** - Links use category and subcategory slugs from API

## Testing

You can test the API endpoints manually:

```bash
# Test categories endpoint
curl "https://marquebackend-production.up.railway.app/api/v1/categories"

# Test subcategories endpoint (replace 'men-test' with actual category slug)
curl "https://marquebackend-production.up.railway.app/api/v1/categories/men-test/subcategories"
```

## Next Steps

1. **Hard refresh your browser** (`Cmd + Shift + R` on Mac) to clear any hot reload issues
2. **Click the "Каталог" button** to open the sidebar
3. **Verify categories load** from your backend
4. **Click a category** and verify subcategories load
5. **Check the browser console** for any errors

## Backend Requirements

Your backend should return:

- Active categories with `is_active: true`
- Sorted by `sort_order` field
- Proper `slug` fields for routing
- `product_count` for each category/subcategory
- Valid `image_url` paths (or the frontend will use fallback images)

## Notes

- The catalog uses `slug` for routing (SEO-friendly URLs)
- Product counts are displayed next to each subcategory
- Images use `image_url` from API, with fallback to `/images/black-tshirt.jpg`
- No backdrop overlay - background content remains visible
- Two-level sidebar navigation (320px + 500px width)
