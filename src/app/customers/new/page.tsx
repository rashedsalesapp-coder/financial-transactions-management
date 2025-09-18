'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

function NewCustomerForm() {
  const [fullName, setFullName] = useState('')
  const [civilId, setCivilId] = useState('')
  const [phone1, setPhone1] = useState('')
  const [phone2, setPhone2] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const { error } = await supabase.from('customers').insert({ full_name: fullName, civil_id: civilId || null, phone_1: phone1 || null, phone_2: phone2 || null });
    if (error) { setError(`Error creating customer: ${error.message}`); }
    else {
      setMessage('Customer created successfully! Redirecting to new transaction page...');
      setTimeout(() => { router.push('/transactions/new'); }, 2000);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إضافة عميل جديد</h1>
      <form onSubmit={handleCreateCustomer} className="max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4"><label htmlFor="fullName" className="block mb-2 text-sm font-medium text-gray-700">الاسم الكامل</label><input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
        <div className="mb-4"><label htmlFor="civilId" className="block mb-2 text-sm font-medium text-gray-700">الرقم المدني</label><input id="civilId" type="text" value={civilId} onChange={(e) => setCivilId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
        <div className="mb-4"><label htmlFor="phone1" className="block mb-2 text-sm font-medium text-gray-700">رقم الهاتف 1</label><input id="phone1" type="text" value={phone1} onChange={(e) => setPhone1(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
        <div className="mb-4"><label htmlFor="phone2" className="block mb-2 text-sm font-medium text-gray-700">رقم الهاتف 2</label><input id="phone2" type="text" value={phone2} onChange={(e) => setPhone2(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
        <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">إنشاء عميل</button>
        {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}

export default function NewCustomerPage() {
    return ( <ProtectedRoute> <NewCustomerForm /> </ProtectedRoute> )
}
