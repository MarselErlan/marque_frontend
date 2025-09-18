/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://marquebackend-production.up.railway.app/api/v1',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://marque.website',
  },
  images: {
    unoptimized: true,
    domains: ['marque.website', 'marquebackend-production.up.railway.app'],
  },
  // Enable output standalone for Docker
  output: 'standalone',
  // Optimize for production
  swcMinify: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Compress responses
  compress: true,
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Runtime proxy to backend for any relative API calls
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://marquebackend-production.up.railway.app/api/v1/:path*',
      },
    ]
  },
}

export default nextConfig
