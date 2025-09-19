import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Financial Management',
  description: 'Application for managing financial transactions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={"font-sans bg-gradient-to-tr from-primary/5 to-accent/10 min-h-screen text-foreground"}>
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto p-4 md:p-8 max-w-5xl rounded-xl shadow-card bg-white mt-6 mb-8">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
