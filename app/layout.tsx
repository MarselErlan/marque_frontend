"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { CatalogProvider } from "@/contexts/CatalogContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { GlobalCatalogWrapper } from "@/components/GlobalCatalogWrapper"
import { Header } from "@/components/Header"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://marquebwithd-production.up.railway.app" />
        <link rel="dns-prefetch" href="https://marquebwithd-production.up.railway.app" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`font-sans antialiased min-h-screen bg-background text-foreground`}>
        <LanguageProvider>
          <CatalogProvider>
            <ErrorBoundary>
              {/* Global Header - appears on all pages */}
              <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <Header />
              </header>
              
              {/* Page Content */}
              <main>
                {children}
              </main>
            </ErrorBoundary>
            <GlobalCatalogWrapper />
            <Toaster richColors position="top-right" />
          </CatalogProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
