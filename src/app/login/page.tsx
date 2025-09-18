'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(`Error logging in: ${error.message}`); return; }
    if (user) {
      const { data: profile, error: profileError } = await supabase.from('user_profiles').select('status').eq('id', user.id).single()
      if (profileError) { setMessage(`Error fetching user profile: ${profileError.message}`); await supabase.auth.signOut(); return; }
      if (profile) {
        if (profile.status === 'active') { router.push('/'); return; }
        else if (profile.status === 'pending') { setMessage('Your account is awaiting admin approval.') }
        else if (profile.status === 'inactive') { setMessage('Your account has been deactivated.') }
        await supabase.auth.signOut()
      }
    }
  }

  return (
    <div className="flex items-center justify-center mt-10">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-center">تسجيل الدخول</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">كلمة المرور</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
          </div>
          <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">دخول</button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-red-600 bg-red-100 p-3 rounded">{message}</p>}
        <p className="text-center mt-4 text-sm">
          ليس لديك حساب؟{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline">أنشئ حساباً جديداً</Link>
        </p>
      </div>
    </div>
  )
}
