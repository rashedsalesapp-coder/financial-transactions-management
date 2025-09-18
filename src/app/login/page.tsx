'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error("Login Failed", { description: error.message })
      setLoading(false)
      return
    }

    if (user) {
      const { data: profile, error: profileError } = await supabase.from('user_profiles').select('status').eq('id', user.id).single()

      if (profileError) {
        toast.error("Error fetching profile", { description: profileError.message })
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (profile) {
        if (profile.status === 'active') {
          toast.success("Login Successful!")
          router.push('/')
          return
        } else {
          let description = "Please contact an administrator."
          if (profile.status === 'pending') description = 'Your account is awaiting admin approval.'
          if (profile.status === 'inactive') description = 'Your account has been deactivated.'
          toast.warning("Account Not Active", { description })
          await supabase.auth.signOut()
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm">
            ليس لديك حساب؟{' '}
            <Link href="/signup" className="text-primary hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
