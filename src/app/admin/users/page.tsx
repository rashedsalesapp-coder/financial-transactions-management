'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import type { Profile } from '@/contexts/AuthContext'

interface UserView extends Profile { email: string; }
const roles: Array<Profile['role']> = ['admin', 'user', 'viewer'];

function AdminUserManagement() {
  const [users, setUsers] = useState<UserView[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('users_view').select('*')
    if (error) { setMessage(`Error fetching users: ${error.message}`) }
    else { setUsers(data as UserView[]) }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('user_profiles').update({ status: 'active' }).eq('id', userId)
    if (error) { setMessage(`Error approving user: ${error.message}`) }
    else { setMessage('User approved successfully.'); fetchUsers(); }
  }

  const handleChangeRole = async (userId: string, newRole: Profile['role']) => {
    const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
    if (error) { setMessage(`Error changing role: ${error.message}`) }
    else { setMessage('User role updated successfully.'); fetchUsers(); }
  }

  if (loading) return <div>Loading users...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إدارة المستخدمين</h1>
      {message && <p className="mb-4 text-green-600 bg-green-100 p-2 rounded">{message}</p>}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-800 text-white">
            <tr><th className="py-3 px-4 text-right">الاسم الكامل</th><th className="py-3 px-4 text-right">البريد الإلكتروني</th><th className="py-3 px-4 text-right">الدور</th><th className="py-3 px-4 text-right">الحالة</th><th className="py-3 px-4 text-right">الإجراءات</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-3 px-4">{user.full_name}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <select value={user.role} onChange={(e) => handleChangeRole(user.id, e.target.value as Profile['role'])} className="p-1 border rounded-md bg-white">
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ user.status === 'active' ? 'bg-green-100 text-green-800' : user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}>{user.status}</span></td>
                <td className="py-3 px-4">{user.status === 'pending' && ( <button onClick={() => handleApproveUser(user.id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">موافقة</button> )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return ( <AdminRouteGuard> <AdminUserManagement /> </AdminRouteGuard> )
}
