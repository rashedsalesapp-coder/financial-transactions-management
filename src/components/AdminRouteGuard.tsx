'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile || profile.role !== 'admin') {
        router.push('/')
      }
    }
  }, [profile, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (profile?.role === 'admin') {
    return <>{children}</>
  }

  return null
}
