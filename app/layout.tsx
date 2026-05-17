import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/footer"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

function siteUrl(): URL {
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL)
    }
  } catch {
    /* ignore invalid env */
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`)
  }
  return new URL("http://localhost:3000")
}

const siteDescription =
  "Track shared grocery and household expenses with family or roommates. Dashboards, categories, receipts, and balances — mobile-first with secure Firebase sign-in."

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(220 20% 97%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(222 47% 6%)" },
  ],
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Household Expenses — shared spending for your home",
    template: "%s · Household Expenses",
  },
  description: siteDescription,
  keywords: [
    "household expenses",
    "shared budget",
    "groceries",
    "roommates",
    "family finance",
    "Firebase",
    "expense tracker",
  ],
  authors: [{ name: "Astronil", url: "https://poudelanil.com" }],
  creator: "Astronil",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Household Expenses",
    title: "Household Expenses",
    description: siteDescription,
    images: [
      {
        url: "/spending.png",
        width: 512,
        height: 512,
        alt: "Household Expenses app icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Household Expenses",
    description: siteDescription,
    images: ["/spending.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/spending.png",
    apple: "/spending.png",
  },
  applicationName: "Household Expenses",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} min-h-dvh font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="app-mesh flex min-h-dvh flex-col">
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Toaster />
            </div>
          </AuthProvider>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
