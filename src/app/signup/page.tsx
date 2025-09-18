'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) { setError(`Error signing up: ${error.message}`) }
    else { setMessage('Registration successful! Please check your email to confirm your account. An admin will need to approve your account before you can log in.') }
  }

  return (
    <div className="flex items-center justify-center mt-10">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-center">إنشاء حساب جديد</h1>
        {message ? (
          <p className="mt-4 text-center text-green-600 bg-green-100 p-3 rounded">{message}</p>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="mb-4">
              <label htmlFor="fullName" className="block mb-2 text-sm font-medium text-gray-700">الاسم الكامل</label>
              <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">كلمة المرور</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
            </div>
            <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">تسجيل</button>
            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
          </form>
        )}
        <p className="text-center mt-4 text-sm">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">سجل الدخول</Link>
        </p>
      </div>
    </div>
  )
}
