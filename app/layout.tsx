import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { CatalogProvider } from "@/contexts/CatalogContext"
import { GlobalCatalogWrapper } from "@/components/GlobalCatalogWrapper"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: "MARQUE - Premium Fashion E-commerce",
    template: "%s | MARQUE"
  },
  description: "Discover premium fashion and lifestyle products from top brands. Shop the latest collections with fast delivery in Kyrgyzstan.",
  keywords: ["fashion", "clothing", "lifestyle", "shopping", "premium", "brands", "Kyrgyzstan", "марке", "одежда"],
  authors: [{ name: "MARQUE Team" }],
  creator: "MARQUE",
  publisher: "MARQUE",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://marque.website"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://marque.website",
    siteName: "MARQUE",
    title: "MARQUE - Premium Fashion E-commerce",
    description: "Discover premium fashion and lifestyle products from top brands",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MARQUE Fashion E-commerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MARQUE - Premium Fashion E-commerce",
    description: "Discover premium fashion and lifestyle products from top brands",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#8E7FE7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://marquebackend-production.up.railway.app" />
        <link rel="dns-prefetch" href="https://marquebackend-production.up.railway.app" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`font-sans antialiased min-h-screen bg-background text-foreground`}>
        <CatalogProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <GlobalCatalogWrapper />
          <Toaster richColors position="top-right" />
        </CatalogProvider>
      </body>
    </html>
  )
}
