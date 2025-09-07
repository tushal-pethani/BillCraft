"use client"

import "./globals.css"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { ThemeProvider } from "@/lib/theme-context"
import GlobalNavbar from "@/app/components/GlobalNavbar"
import { SWRConfig } from 'swr'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <SWRConfig value={{
            fetcher: async (resource: RequestInfo, init?: RequestInit) => {
              const res = await fetch(resource, { ...init })
              if (!res.ok) throw new Error('Request failed')
              return res.json()
            },
            dedupingInterval: 30000,
            revalidateOnFocus: false,
            revalidateIfStale: true,
            revalidateOnReconnect: true,
          }}>
            <SessionProvider>
              <GlobalNavbar>{children}</GlobalNavbar>
            </SessionProvider>
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  )
}