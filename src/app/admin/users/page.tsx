'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import type { Profile } from '@/contexts/AuthContext'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserView extends Profile { email: string; }
const roles: Array<Profile['role']> = ['admin', 'user', 'viewer'];

function AdminUserManagement() {
  const [users, setUsers] = useState<UserView[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('users_view').select('*').order('full_name', { ascending: true })
    if (error) { toast.error("Failed to fetch users", { description: error.message }) }
    else { setUsers(data as UserView[]) }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('user_profiles').update({ status: 'active' }).eq('id', userId)
    if (error) { toast.error("Failed to approve user", { description: error.message }) }
    else { toast.success("User approved successfully."); fetchUsers(); }
  }

  const handleChangeRole = async (userId: string, newRole: Profile['role']) => {
    const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
    if (error) { toast.error("Failed to change role", { description: error.message }) }
    else { toast.success("User role updated successfully."); fetchUsers(); }
  }

  if (loading) return <div>Loading users...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم الكامل</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(value) => handleChangeRole(user.id, value as Profile['role'])}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ user.status === 'active' ? 'bg-green-100 text-green-800' : user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}>
                        {user.status}
                    </span>
                </TableCell>
                <TableCell>
                  {user.status === 'pending' && (
                    <Button onClick={() => handleApproveUser(user.id)} size="sm">
                      Approve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function AdminUsersPage() {
  return ( <AdminRouteGuard> <AdminUserManagement /> </AdminRouteGuard> )
}
