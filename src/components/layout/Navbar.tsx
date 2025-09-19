"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-navbar border-b border-border sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition-all">
          إدارة المعاملات المالية
        </Link>
        <div className="flex items-center gap-4">
          {user && profile ? (
            <>
              {profile.role === 'admin' && (
                <>
                  <Link href="/admin/dashboard" className="navbar-link">لوحة التحكم</Link>
                  <Link href="/admin/users" className="navbar-link">إدارة المستخدمين</Link>
                  <Link href="/admin/migrate" className="navbar-link">ترحيل البيانات</Link>
                  <Link href="/admin/export" className="navbar-link">تصدير CSV</Link>
                </>
              )}
              <Link href="/transactions/new" className="navbar-link">معاملة جديدة</Link>
              <Link href="/payments/new" className="navbar-link">دفعة جديدة</Link>
              <span className="text-gray-300">|</span>
              <span className="font-semibold">{profile.full_name}</span>
              <button
                onClick={signOut}
                className="bg-primary px-3 py-1 rounded-md text-sm font-semibold text-white hover:bg-primary-dark transition-all"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <Link href="/login" className="navbar-link">تسجيل الدخول</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
