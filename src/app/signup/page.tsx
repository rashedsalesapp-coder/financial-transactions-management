'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      toast.error("Signup Failed", { description: error.message })
    } else {
      toast.success("Registration Successful!", { description: "Please check your email to confirm your account." })
      setIsSubmitted(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center pt-20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
          <CardDescription>أدخل بياناتك لإنشاء حساب جديد</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center p-4">
              <h3 className="text-lg font-semibold">شكراً لتسجيلك!</h3>
              <p className="text-muted-foreground mt-2">
                لقد أرسلنا رابط تأكيد إلى بريدك الإلكتروني. بعد تأكيد حسابك، سيحتاج المدير إلى الموافقة عليه قبل أن تتمكن من تسجيل الدخول.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full mt-6" disabled={loading} aria-busy={loading}>
                {loading ? "جاري التسجيل..." : "إنشاء حساب"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-primary hover:underline">
              سجل الدخول
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
