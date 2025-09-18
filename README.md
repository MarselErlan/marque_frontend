# MARQUE - Fashion E-commerce Frontend

A modern e-commerce frontend built with Next.js 14, React 18, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Authentication**: SMS verification with phone number login
- **Shopping Cart**: Add to cart, manage quantities, checkout flow
- **Product Catalog**: Browse products with filtering and search
- **Mobile Responsive**: Optimized for all device sizes
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Package Manager**: PNPM

## 🚀 Railway Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Backend API**: Ensure your backend API is running and accessible

### Deployment Steps

1. **Connect to Railway**:

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login
   ```

2. **Deploy from GitHub**:

   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Next.js and deploy

3. **Set Environment Variables**:
   In Railway dashboard, add these environment variables:

   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app/api/v1
   NEXT_PUBLIC_APP_URL=https://your-frontend.up.railway.app
   ```

4. **Deploy**:
   Railway will automatically build and deploy your app.

### Alternative: Deploy with Railway CLI

```bash
# Initialize Railway project
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app/api/v1

# Deploy
railway up
```

## 🔧 Local Development

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Create environment file**:

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` with your values:

   ```
   NEXT_PUBLIC_API_URL=https://marque.website/api/v1
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run development server**:

   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   pnpm start
   ```

## 📁 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Homepage
│   ├── cart/              # Shopping cart page
│   ├── product/[id]/      # Product detail pages
│   └── admin/             # Admin dashboard
├── components/            # Reusable UI components
├── lib/                   # Utility functions and config
├── public/                # Static assets
├── railway.toml           # Railway configuration
├── Dockerfile             # Docker configuration
└── next.config.mjs        # Next.js configuration
```

## 🔗 API Integration

The app integrates with the backend API for:

- **SMS Authentication**: `/auth/send-verification`, `/auth/verify-code`
- **User Management**: User profiles and sessions
- **Product Data**: Product catalog and details
- **Order Processing**: Cart and checkout functionality

## 🛡️ Security Features

- **Security Headers**: X-Frame-Options, X-Content-Type-Options
- **CORS Protection**: Configured for specific domains
- **Input Validation**: Client-side validation for all forms
- **Token Storage**: Secure localStorage for authentication

## 🎨 UI/UX Features

- **Dark/Light Mode**: Automatic theme detection
- **Responsive Design**: Mobile-first approach
- **Loading States**: Visual feedback for all actions
- **Error Handling**: User-friendly error messages
- **Accessibility**: ARIA labels and keyboard navigation

## 📱 Mobile Optimization

- **Touch-friendly**: Large tap targets and gestures
- **Fast Loading**: Optimized images and code splitting
- **Offline Support**: Service worker for basic offline functionality
- **PWA Ready**: Manifest and app icons included

## 🔧 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Optimized package imports
- **Compression**: Gzip compression enabled
- **Caching**: Optimized caching headers

## 📋 Environment Variables

| Variable              | Description          | Default                         |
| --------------------- | -------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://marque.website/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL     | `http://localhost:3000`         |
| `NODE_ENV`            | Environment          | `development`                   |

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t marque-frontend .

# Run container
docker run -p 3000:3000 marque-frontend
```

## 📦 Build Output

The app generates:

- **Static Assets**: Optimized CSS, JS, and images
- **Server Functions**: API routes and middleware
- **Standalone Output**: Self-contained deployment package

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ for MARQUE Fashion Platform**
