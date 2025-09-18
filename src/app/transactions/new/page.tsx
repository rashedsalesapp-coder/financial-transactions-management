'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { debounce } from 'lodash'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Customer { customer_id: string; full_name: string; }

function NewTransactionForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [goodsPrice, setGoodsPrice] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [totalDebt, setTotalDebt] = useState(0);
  const [profit, setProfit] = useState(0);
  const [endPaymentDate, setEndPaymentDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    const { data } = await supabase.from('customers').select('customer_id, full_name').or(`full_name.ilike.%${query}%,civil_id.ilike.%${query}%,phone_1.ilike.%${query}%`).limit(10);
    setSearchResults(data || []);
    setIsSearching(false);
  }, 300), []);

  useEffect(() => { debouncedSearch(searchQuery); }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const price = parseFloat(goodsPrice) || 0;
    const installment = parseFloat(monthlyInstallment) || 0;
    const count = parseInt(installmentsCount, 10) || 0;
    const newTotalDebt = installment * count;
    setTotalDebt(newTotalDebt);
    setProfit(newTotalDebt - price);
    if (firstPaymentDate && count > 0) {
      const startDate = new Date(firstPaymentDate);
      startDate.setMonth(startDate.getMonth() + count);
      setEndPaymentDate(startDate.toISOString().split('T')[0]);
    } else { setEndPaymentDate(''); }
  }, [goodsPrice, monthlyInstallment, installmentsCount, firstPaymentDate]);

  const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setSearchQuery(customer.full_name); setSearchResults([]); };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!selectedCustomer) { setError('Please select a customer.'); return; }
    const { error } = await supabase.from('transactions').insert({ customer_id: selectedCustomer.customer_id, goods_price: parseFloat(goodsPrice), monthly_installment: parseFloat(monthlyInstallment), installments_count: parseInt(installmentsCount, 10), first_payment_date: firstPaymentDate });
    if (error) { setError(`Error creating transaction: ${error.message}`); } else { setMessage('Transaction created successfully!'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إضافة معاملة جديدة</h1>
      <form onSubmit={handleCreateTransaction} className="max-w-xl bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <label htmlFor="customerSearch" className="block mb-2 text-sm font-medium">ابحث عن عميل</label>
          <input id="customerSearch" type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedCustomer(null); }} className="w-full px-3 py-2 border rounded-md" />
          {isSearching && <p>Searching...</p>}
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg">
              {searchResults.map(customer => ( <li key={customer.customer_id} onClick={() => handleSelectCustomer(customer)} className="p-2 hover:bg-gray-200 cursor-pointer">{customer.full_name}</li> ))}
            </ul>
          )}
        </div>
        <div className="mb-4"> <Link href="/customers/new" className="text-indigo-600 hover:underline">أو قم بإنشاء عميل جديد</Link> </div>
        {selectedCustomer && <p className="mb-4 font-semibold">العميل المحدد: {selectedCustomer.full_name}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div> <label htmlFor="goodsPrice" className="block mb-2 text-sm">سعر السلعة</label> <input id="goodsPrice" type="number" value={goodsPrice} onChange={e => setGoodsPrice(e.target.value)} required className="w-full px-3 py-2 border rounded-md" /> </div>
          <div> <label htmlFor="installmentsCount" className="block mb-2 text-sm">عدد الدفعات</label> <input id="installmentsCount" type="number" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} required className="w-full px-3 py-2 border rounded-md" /> </div>
          <div> <label htmlFor="monthlyInstallment" className="block mb-2 text-sm">القسط الشهري</label> <input id="monthlyInstallment" type="number" value={monthlyInstallment} onChange={e => setMonthlyInstallment(e.target.value)} required className="w-full px-3 py-2 border rounded-md" /> </div>
          <div> <label htmlFor="firstPaymentDate" className="block mb-2 text-sm">تاريخ أول دفعة</label> <input id="firstPaymentDate" type="date" value={firstPaymentDate} onChange={e => setFirstPaymentDate(e.target.value)} required className="w-full px-3 py-2 border rounded-md" /> </div>
        </div>
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h3 className="font-bold text-lg mb-2">الحقول المحسوبة</h3>
          <p>إجمالي الدين: {totalDebt.toFixed(2)}</p><p>الربح: {profit.toFixed(2)}</p><p>تاريخ نهاية السداد: {endPaymentDate}</p>
        </div>
        <button type="submit" className="w-full mt-6 px-4 py-2 text-white bg-indigo-600 rounded-md">إنشاء معاملة</button>
        {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}

export default function NewTransactionPage() {
    return ( <ProtectedRoute> <NewTransactionForm /> </ProtectedRoute> )
}
