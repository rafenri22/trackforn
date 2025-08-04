'use client'

import React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#3b82f6" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <title>TJA Tracking System [BETA]</title>
        <meta name="description" content="Real-time Trijaya Agung tracking and management system" />
        <meta name="keywords" content="bus, tracking, transport, real-time, purbalingga" />
        <meta name="author" content="TJA Tracking Team" />
      </head>
      <body className="font-sans antialiased">
        <div id="root">{children}</div>
        <Toaster />
      </body>
    </html>
  )
}
