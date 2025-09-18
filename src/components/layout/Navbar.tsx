'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold">
          إدارة المعاملات المالية
        </Link>
        <div className="flex items-center space-x-4">
          {user && profile ? (
            <>
              {profile.role === 'admin' && (
                <>
                  <Link href="/admin/dashboard" className="hover:text-gray-300">لوحة التحكم</Link>
                  <Link href="/admin/users" className="hover:text-gray-300">إدارة المستخدمين</Link>
                  <Link href="/admin/migrate" className="hover:text-gray-300">ترحيل البيانات</Link>
                  <Link href="/admin/export" className="hover:text-gray-300">تصدير CSV</Link>
                </>
              )}
              <Link href="/transactions/new" className="hover:text-gray-300">معاملة جديدة</Link>
              <Link href="/payments/new" className="hover:text-gray-300">دفعة جديدة</Link>
              <span className="text-gray-400">|</span>
              <span className="font-semibold">{profile.full_name}</span>
              <button
                onClick={signOut}
                className="bg-indigo-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-indigo-700"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gray-300">تسجيل الدخول</Link>
              <Link href="/signup" className="hover:text-gray-300">إنشاء حساب</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
