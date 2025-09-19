'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="text-center p-12 text-lg font-semibold text-primary animate-pulse">جاري التحميل...</div>
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl shadow-card p-10 w-full max-w-2xl text-center">
        <h1 className="text-5xl font-extrabold text-primary mb-4 drop-shadow-sm">نظام إدارة المعاملات المالية</h1>
        <p className="text-xl text-muted-foreground mb-6">مرحباً بك في نظام إدارة الديون والأقساط والقضايا القانونية للعملاء.</p>
        {!user && (
          <Link href="/login" className="inline-block bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg text-lg font-bold shadow transition-all duration-150">
            ابدأ بتسجيل الدخول
          </Link>
        )}
      </div>
    </section>
  )
}
