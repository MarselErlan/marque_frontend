# 🔌 Marque Frontend-Backend API Integration Guide

> Complete reference for integrating the Next.js frontend with the FastAPI backend

## 📚 Table of Contents

1. [Configuration](#configuration)
2. [Authentication](#authentication)
3. [Product APIs](#product-apis)
4. [Category & Navigation](#category--navigation)
5. [Cart Management](#cart-management)
6. [Wishlist](#wishlist)
7. [Banners](#banners)
8. [Image Upload](#image-upload)
9. [Error Handling](#error-handling)
10. [Complete Integration Examples](#complete-integration-examples)

---

## Configuration

### Backend API Base URL

- **Production**: `https://marquebackend-production.up.railway.app/api/v1`
- **Local Development**: `http://localhost:8000/api/v1`

### Frontend Configuration

Update `lib/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://marquebackend-production.up.railway.app/api/v1",
  ENDPOINTS: {
    // Authentication
    SEND_VERIFICATION: "/auth/send-verification",
    VERIFY_CODE: "/auth/verify-code",
    LOGOUT: "/auth/logout",
    USER_PROFILE: "/auth/profile",
    USER_SESSIONS: "/auth/sessions",

    // Products
    PRODUCTS_SEARCH: "/products/search",
    PRODUCTS_BEST_SELLERS: "/products/best-sellers",
    PRODUCT_DETAIL: "/products", // + /{slug}

    // Categories
    CATEGORIES: "/categories",
    CATEGORY_DETAIL: "/categories", // + /{slug}
    SUBCATEGORY_PRODUCTS: "/categories", // + /{category_slug}/subcategories/{subcategory_slug}/products

    // Cart
    CART: "/cart",
    CART_ITEMS: "/cart/items",

    // Wishlist
    WISHLIST: "/wishlist",
    WISHLIST_ITEMS: "/wishlist/items",

    // Banners
    BANNERS: "/banners",
    BANNERS_HERO: "/banners/hero",
    BANNERS_PROMO: "/banners/promo",

    // Upload
    UPLOAD_IMAGE: "/upload/image",
  },
} as const;
```

---

## Authentication

### 1. Send Verification Code

**Endpoint**: `POST /api/v1/auth/send-verification`

**Request**:

```typescript
interface SendVerificationRequest {
  phone: string; // Format: +996505123456 (KG) or +15551234567 (US)
}
```

**Response**:

```typescript
interface SendVerificationResponse {
  success: boolean;
  message: string;
  session_id: string;
}
```

**Example Usage**:

```typescript
const sendVerificationCode = async (
  phoneNumber: string,
  countryCode: string
) => {
  const fullPhone = `${countryCode}${phoneNumber.replace(/[-\s]/g, "")}`;

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_VERIFICATION}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ phone: fullPhone }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to send verification code");
  }

  return await response.json();
};
```

### 2. Verify Code & Login

**Endpoint**: `POST /api/v1/auth/verify-code`

**Request**:

```typescript
interface VerifyCodeRequest {
  phone: string;
  code: string; // 6-digit verification code
}
```

**Response**:

```typescript
interface VerifyCodeResponse {
  success: boolean;
  data: {
    access_token: string;
    token_type: string;
    session_id: string;
    expires_in_minutes: number;
    market: string; // "kg" or "us"
    user: {
      id: string;
      phone: string;
      full_name?: string;
      email?: string;
    };
  };
}
```

**Example Usage**:

```typescript
const verifyCode = async (
  phoneNumber: string,
  countryCode: string,
  code: string
) => {
  const fullPhone = `${countryCode}${phoneNumber.replace(/[-\s]/g, "")}`;

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_CODE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ phone: fullPhone, code }),
    }
  );

  if (!response.ok) {
    throw new Error("Invalid verification code");
  }

  const data = await response.json();

  // Store authentication data
  localStorage.setItem("authToken", data.data.access_token);
  localStorage.setItem("tokenType", data.data.token_type);
  localStorage.setItem("sessionId", data.data.session_id);
  localStorage.setItem("market", data.data.market);
  localStorage.setItem("userData", JSON.stringify(data.data.user));
  localStorage.setItem("isLoggedIn", "true");

  const expirationTime =
    new Date().getTime() + data.data.expires_in_minutes * 60 * 1000;
  localStorage.setItem("tokenExpiration", expirationTime.toString());

  return data;
};
```

### 3. Get User Profile

**Endpoint**: `GET /api/v1/auth/profile`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:

```typescript
interface UserProfile {
  id: string;
  phone: string;
  full_name?: string;
  email?: string;
  market: string;
  created_at: string;
}
```

### 4. Logout

**Endpoint**: `POST /api/v1/auth/logout`

**Headers**: `Authorization: Bearer {access_token}`

---

## Product APIs

### 1. Get Best Selling Products (Main Page)

**Endpoint**: `GET /api/v1/products/best-sellers`

**Query Parameters**:

- `limit` (optional): Number of products to return (1-500)

**Response**:

```typescript
interface ProductListItem {
  id: number;
  title: string;
  slug: string;
  price_min: number;
  price_max: number;
  original_price_min?: number;
  discount_percent?: number;
  image: string;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  brand_name: string;
  brand_slug: string;
}
```

**Example Usage**:

```typescript
const getBestSellers = async (limit?: number) => {
  const url = new URL(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS_BEST_SELLERS}`
  );
  if (limit) url.searchParams.append("limit", limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch best sellers");

  return await response.json();
};

// Usage in component
const products = await getBestSellers(25); // Get top 25 best sellers
```

### 2. Search Products

**Endpoint**: `GET /api/v1/products/search`

**Query Parameters**:

- `query` (required): Search term
- `page`: Page number (default: 1)
- `limit`: Items per page (1-100, default: 20)
- `sort_by`: `relevance` | `price_asc` | `price_desc` | `newest` | `popular` | `rating`
- `price_min`: Minimum price filter
- `price_max`: Maximum price filter
- `sizes`: Comma-separated sizes (e.g., "M,L,XL")
- `colors`: Comma-separated colors (e.g., "black,white")
- `brands`: Comma-separated brand slugs
- `category`: Category slug filter
- `subcategory`: Subcategory slug filter

**Response**:

```typescript
interface ProductListResponse {
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}
```

**Example Usage**:

```typescript
const searchProducts = async (
  searchTerm: string,
  filters?: {
    sortBy?: string;
    priceMin?: number;
    priceMax?: number;
    sizes?: string[];
    colors?: string[];
    brands?: string[];
    category?: string;
    subcategory?: string;
    page?: number;
    limit?: number;
  }
) => {
  const url = new URL(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS_SEARCH}`
  );
  url.searchParams.append("query", searchTerm);

  if (filters?.sortBy) url.searchParams.append("sort_by", filters.sortBy);
  if (filters?.priceMin)
    url.searchParams.append("price_min", filters.priceMin.toString());
  if (filters?.priceMax)
    url.searchParams.append("price_max", filters.priceMax.toString());
  if (filters?.sizes) url.searchParams.append("sizes", filters.sizes.join(","));
  if (filters?.colors)
    url.searchParams.append("colors", filters.colors.join(","));
  if (filters?.brands)
    url.searchParams.append("brands", filters.brands.join(","));
  if (filters?.category) url.searchParams.append("category", filters.category);
  if (filters?.subcategory)
    url.searchParams.append("subcategory", filters.subcategory);
  if (filters?.page) url.searchParams.append("page", filters.page.toString());
  if (filters?.limit)
    url.searchParams.append("limit", filters.limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Search failed");

  return await response.json();
};

// Usage example
const results = await searchProducts("футболка", {
  sortBy: "popular",
  priceMin: 1000,
  priceMax: 5000,
  sizes: ["M", "L"],
  colors: ["black", "white"],
  page: 1,
  limit: 20,
});
```

### 3. Get Product Details

**Endpoint**: `GET /api/v1/products/{slug}`

**Response**:

```typescript
interface ProductDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  subcategory: {
    id: number;
    name: string;
    slug: string;
  };
  images: {
    id: number;
    url: string;
    alt_text?: string;
    type: string;
    order: number;
  }[];
  skus: {
    id: number;
    sku_code: string;
    size: string;
    color: string;
    price: number;
    original_price?: number;
    stock: number;
  }[];
  available_sizes: string[];
  available_colors: string[];
  price_min: number;
  price_max: number;
  in_stock: boolean;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  reviews: {
    id: number;
    rating: number;
    text?: string;
    created_at: string;
  }[];
  attributes: Record<string, any>;
  breadcrumbs: {
    name: string;
    slug: string;
  }[];
  similar_products: {
    id: number;
    title: string;
    slug: string;
    price_min: number;
    image: string;
    rating_avg: number;
  }[];
}
```

**Example Usage**:

```typescript
const getProductDetail = async (slug: string) => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_DETAIL}/${slug}`
  );
  if (!response.ok) throw new Error("Product not found");

  return await response.json();
};
```

---

## Category & Navigation

### 1. Get All Categories

**Endpoint**: `GET /api/v1/categories`

**Response**:

```typescript
interface CategoriesResponse {
  categories: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    image_url?: string;
    product_count: number;
    is_active: boolean;
    sort_order: number;
  }[];
}
```

**Example Usage**:

```typescript
const getAllCategories = async () => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`
  );
  if (!response.ok) throw new Error("Failed to fetch categories");

  return await response.json();
};
```

### 2. Get Category with Subcategories

**Endpoint**: `GET /api/v1/categories/{category_slug}`

**Response**:

```typescript
interface CategoryDetail {
  category: {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    image_url?: string;
    description?: string;
  };
  subcategories: {
    id: number;
    name: string;
    slug: string;
    image_url?: string;
    product_count: number;
  }[];
}
```

### 3. Get Subcategory Products

**Endpoint**: `GET /api/v1/categories/{category_slug}/subcategories/{subcategory_slug}/products`

**Query Parameters**:

- `page`: Page number
- `limit`: Items per page (default: 20)
- `sort_by`: `popular` | `price_asc` | `price_desc` | `newest` | `rating`
- `price_min`, `price_max`: Price range
- `sizes`, `colors`, `brands`: Filters (comma-separated)

**Response**:

```typescript
interface SubcategoryProductsResponse {
  category: { id: number; name: string; slug: string };
  subcategory: { id: number; name: string; slug: string };
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
  filters: {
    available_sizes: string[];
    available_colors: string[];
    available_brands: { id: number; name: string; slug: string }[];
    price_range: { min: number; max: number };
  };
}
```

---

## Cart Management

**⚠️ All cart endpoints require authentication**

### 1. Get Cart

**Endpoint**: `GET /api/v1/cart`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:

```typescript
interface Cart {
  id: number;
  user_id: string;
  items: {
    id: number;
    sku_id: number;
    quantity: number;
    name: string;
    price: number;
    image: string;
  }[];
  total_items: number;
  total_price: number;
}
```

### 2. Add to Cart

**Endpoint**: `POST /api/v1/cart/items`

**Headers**: `Authorization: Bearer {access_token}`

**Request**:

```typescript
interface AddToCartRequest {
  sku_id: number; // The specific SKU (size+color combination)
  quantity: number;
}
```

**Example Usage**:

```typescript
const addToCart = async (skuId: number, quantity: number) => {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CART_ITEMS}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sku_id: skuId, quantity }),
    }
  );

  if (!response.ok) throw new Error("Failed to add to cart");

  return await response.json();
};
```

### 3. Update Cart Item

**Endpoint**: `PUT /api/v1/cart/items/{item_id}?quantity={new_quantity}`

**Headers**: `Authorization: Bearer {access_token}`

### 4. Remove from Cart

**Endpoint**: `DELETE /api/v1/cart/items/{item_id}`

**Headers**: `Authorization: Bearer {access_token}`

### 5. Clear Cart

**Endpoint**: `DELETE /api/v1/cart`

**Headers**: `Authorization: Bearer {access_token}`

---

## Wishlist

**⚠️ All wishlist endpoints require authentication**

### 1. Get Wishlist

**Endpoint**: `GET /api/v1/wishlist`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:

```typescript
interface Wishlist {
  id: number;
  user_id: string;
  items: {
    id: number;
    product: ProductSchema; // Full product object
  }[];
}
```

### 2. Add to Wishlist

**Endpoint**: `POST /api/v1/wishlist/items`

**Headers**: `Authorization: Bearer {access_token}`

**Request**:

```typescript
interface AddToWishlistRequest {
  product_id: number;
}
```

### 3. Remove from Wishlist

**Endpoint**: `DELETE /api/v1/wishlist/items/{product_id}`

**Headers**: `Authorization: Bearer {access_token}`

### 4. Clear Wishlist

**Endpoint**: `DELETE /api/v1/wishlist`

**Headers**: `Authorization: Bearer {access_token}`

---

## Banners

### 1. Get All Active Banners

**Endpoint**: `GET /api/v1/banners`

**Response**:

```typescript
interface BannersResponse {
  hero_banners: Banner[];
  promo_banners: Banner[];
  category_banners: Banner[];
}

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  banner_type: "hero" | "promo" | "category";
  cta_text?: string;
  cta_url?: string;
  is_active: boolean;
  display_order: number;
  start_date?: string;
  end_date?: string;
}
```

### 2. Get Hero Banners Only

**Endpoint**: `GET /api/v1/banners/hero`

### 3. Get Promo Banners Only

**Endpoint**: `GET /api/v1/banners/promo`

**Example Usage**:

```typescript
const getBanners = async () => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BANNERS}`
  );
  if (!response.ok) throw new Error("Failed to fetch banners");

  const data = await response.json();

  return {
    heroBanners: data.hero_banners || [],
    promoBanners: data.promo_banners || [],
    categoryBanners: data.category_banners || [],
  };
};
```

---

## Image Upload

**Endpoint**: `POST /api/v1/upload/image`

**Content-Type**: `multipart/form-data`

**Form Data**:

- `file`: Image file (JPEG, PNG, WEBP)
- `category`: `products` | `categories` | `subcategories` | `brands` | `banners`
- `resize_to`: `thumbnail` | `small` | `medium` | `large` | `null` (optional, default: "medium")
- `optimize`: Boolean (optional, default: true)

**Response**:

```typescript
interface ImageUploadResponse {
  success: boolean;
  url: string;
  message: string;
  size: string;
}
```

---

## Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
  detail:
    | string
    | {
        msg: string;
        type: string;
        loc: string[];
      }[];
}
```

### Example Error Handler

```typescript
const handleApiError = async (response: Response) => {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const error = await response.json();
    if (Array.isArray(error.detail)) {
      // Validation errors
      const messages = error.detail.map((e) => e.msg).join(", ");
      throw new Error(messages);
    }
    throw new Error(error.detail || "API Error");
  }

  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
};

// Usage
try {
  const response = await fetch(url);
  if (!response.ok) {
    await handleApiError(response);
  }
  return await response.json();
} catch (error) {
  console.error("API Error:", error);
  // Show user-friendly error message
}
```

### Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input/validation error
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded (SMS verification)
- `500 Internal Server Error`: Server error

---

## Complete Integration Examples

### 1. Main Page with Best Sellers

```typescript
// app/page.tsx
"use client";
import { useState, useEffect } from "react";
import { API_CONFIG } from "@/lib/config";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState({ hero: [], promo: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMainPageData();
  }, []);

  const loadMainPageData = async () => {
    try {
      // Load banners
      const bannersRes = await fetch(`${API_CONFIG.BASE_URL}/banners`);
      const bannersData = await bannersRes.json();
      setBanners({
        hero: bannersData.hero_banners || [],
        promo: bannersData.promo_banners || [],
      });

      // Load best sellers
      const productsRes = await fetch(
        `${API_CONFIG.BASE_URL}/products/best-sellers?limit=25`
      );
      const productsData = await productsRes.json();
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load main page:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Banner Carousel */}
      <section>
        {banners.hero.map((banner) => (
          <div key={banner.id}>
            <img src={banner.image_url} alt={banner.title} />
            <h2>{banner.title}</h2>
            <p>{banner.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Best Sellers Grid */}
      <section>
        <h2>Лучшие продажи</h2>
        <div className="grid grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

### 2. Search Page with Filters

```typescript
// app/search/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { API_CONFIG } from "@/lib/config";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState({ products: [], total: 0 });
  const [filters, setFilters] = useState({
    sortBy: "relevance",
    priceMin: null,
    priceMax: null,
    sizes: [],
    colors: [],
    page: 1,
  });

  useEffect(() => {
    searchProducts();
  }, [query, filters]);

  const searchProducts = async () => {
    const url = new URL(`${API_CONFIG.BASE_URL}/products/search`);
    url.searchParams.append("query", query);
    url.searchParams.append("sort_by", filters.sortBy);
    url.searchParams.append("page", filters.page.toString());

    if (filters.priceMin)
      url.searchParams.append("price_min", filters.priceMin.toString());
    if (filters.priceMax)
      url.searchParams.append("price_max", filters.priceMax.toString());
    if (filters.sizes.length)
      url.searchParams.append("sizes", filters.sizes.join(","));
    if (filters.colors.length)
      url.searchParams.append("colors", filters.colors.join(","));

    const response = await fetch(url.toString());
    const data = await response.json();
    setResults(data);
  };

  return (
    <div className="flex">
      {/* Filters Sidebar */}
      <aside className="w-64">
        <h3>Фильтры</h3>

        <div>
          <label>Сортировка</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <option value="relevance">По релевантности</option>
            <option value="popular">По популярности</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
            <option value="newest">Новинки</option>
            <option value="rating">По рейтингу</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label>Цена</label>
          <input
            type="number"
            placeholder="От"
            value={filters.priceMin || ""}
            onChange={(e) =>
              setFilters({ ...filters, priceMin: Number(e.target.value) })
            }
          />
          <input
            type="number"
            placeholder="До"
            value={filters.priceMax || ""}
            onChange={(e) =>
              setFilters({ ...filters, priceMax: Number(e.target.value) })
            }
          />
        </div>
      </aside>

      {/* Results */}
      <main className="flex-1">
        <h1>
          Результаты поиска: "{query}" ({results.total})
        </h1>
        <div className="grid grid-cols-4 gap-6">
          {results.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

### 3. Cart Management with Backend Sync

```typescript
// hooks/useCartBackend.ts
import { useState, useEffect } from "react";
import { API_CONFIG } from "@/lib/config";

export const useCartBackend = () => {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);

    if (token) {
      loadCart();
    }
  }, []);

  const loadCart = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_CONFIG.BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Failed to load cart:", error);
    }
  };

  const addToCart = async (skuId: number, quantity: number = 1) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_CONFIG.BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sku_id: skuId, quantity }),
      });
      const data = await response.json();
      setCart(data);
      return data;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/cart/items/${itemId}?quantity=${quantity}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Failed to update cart:", error);
      throw error;
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/cart/items/${itemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Failed to remove item:", error);
      throw error;
    }
  };

  return {
    cart,
    isAuthenticated,
    addToCart,
    updateQuantity,
    removeItem,
    refreshCart: loadCart,
  };
};
```

---

## 🎯 Quick Start Checklist

- [ ] Update `lib/config.ts` with all API endpoints
- [ ] Test authentication flow (send code → verify → store token)
- [ ] Connect main page to `/products/best-sellers`
- [ ] Implement search with `/products/search`
- [ ] Connect category navigation to `/categories` endpoints
- [ ] Integrate cart with backend API (requires auth)
- [ ] Integrate wishlist with backend API (requires auth)
- [ ] Load banners from `/banners` API
- [ ] Add error handling and loading states
- [ ] Test with both KG (+996) and US (+1) phone numbers

---

## 📞 Support

For backend API issues or questions:

- Check backend logs in Railway dashboard
- Review `API_DOCUMENTATION.md` in backend repository
- Test endpoints using Thunder Client, Postman, or curl

**Backend Health Check**: `GET https://marquebackend-production.up.railway.app/api/v1/auth/health`

---

✨ **Ready to integrate!** Start with authentication and main page products, then progressively add more features.
