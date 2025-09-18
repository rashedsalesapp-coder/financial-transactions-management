'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="text-center p-10">Loading...</div>
  }

  return (
    <div className="text-center mt-10">
      <h1 className="text-4xl font-bold mb-4">نظام إدارة المعاملات المالية</h1>
      <p className="text-lg text-gray-600">
        مرحباً بك في نظام إدارة الديون والأقساط والقضايا القانونية للعملاء.
      </p>

      {!user && (
        <div className="mt-8">
          <Link href="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-md text-lg font-semibold hover:bg-indigo-700">
            ابدأ بتسجيل الدخول
          </Link>
        </div>
      )}
    </div>
  )
}
