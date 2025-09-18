'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { debounce } from 'lodash'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Customer { customer_id: string; full_name: string; }
interface TransactionWithBalance { transaction_id: string; total_debt: number; monthly_installment: number; remaining_balance: number; total_paid: number; }

function NewPaymentForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<TransactionWithBalance[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithBalance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from('customers').select('customer_id, full_name').or(`full_name.ilike.%${query}%,civil_id.ilike.%${query}%,phone_1.ilike.%${query}%`).limit(10);
    setSearchResults(data || []);
  }, 300), []);

  useEffect(() => { debouncedSearch(searchQuery); }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedCustomer) { setCustomerTransactions([]); return; }
      const { data, error } = await supabase.from('transactions_with_balance').select('*').eq('customer_id', selectedCustomer.customer_id).gt('remaining_balance', 0);
      if (error) { setError('Error fetching transactions.'); } else { setCustomerTransactions(data || []); }
    };
    fetchTransactions();
  }, [selectedCustomer]);

  const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setSearchQuery(customer.full_name); setSearchResults([]); };
  const handleSelectTransaction = (transaction: TransactionWithBalance) => { setSelectedTransaction(transaction); setPaymentAmount(transaction.monthly_installment.toString()); };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) { setError('Please select a transaction.'); return; }
    const { error } = await supabase.from('payments').insert({ transaction_id: selectedTransaction.transaction_id, payment_amount: parseFloat(paymentAmount), payment_date: paymentDate });
    if (error) { setError(`Error creating payment: ${error.message}`); }
    else {
      setMessage('Payment created successfully!');
      setSelectedTransaction(null);
      setPaymentAmount('');
      const { data } = await supabase.from('transactions_with_balance').select('*').eq('customer_id', selectedCustomer!.customer_id).gt('remaining_balance', 0);
      setCustomerTransactions(data || []);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">إضافة دفعة جديدة</h1>
      <div className="max-w-xl bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4 relative">
          <label htmlFor="customerSearch" className="block mb-2 text-sm font-medium">ابحث عن عميل</label>
          <input id="customerSearch" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          {searchResults.length > 0 && ( <ul className="absolute z-10 w-full bg-white border mt-1">{searchResults.map(customer => ( <li key={customer.customer_id} onClick={() => handleSelectCustomer(customer)} className="p-2 hover:bg-gray-200 cursor-pointer">{customer.full_name}</li> ))}</ul> )}
        </div>
        {selectedCustomer && (
          <div className="mb-4"><h2 className="text-lg font-bold">معاملات العميل النشطة</h2>
            {customerTransactions.length > 0 ? ( <ul className="border rounded-md mt-2">{customerTransactions.map(t => ( <li key={t.transaction_id} onClick={() => handleSelectTransaction(t)} className={`p-3 cursor-pointer ${selectedTransaction?.transaction_id === t.transaction_id ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}> المعاملة رقم: {t.transaction_id.substring(0, 8)} | الرصيد المتبقي: {t.remaining_balance.toFixed(2)} </li> ))}</ul> ) : <p>لا يوجد معاملات نشطة لهذا العميل.</p>}
          </div>
        )}
        {selectedTransaction && (
          <form onSubmit={handleCreatePayment} className="mt-6 border-t pt-6">
            <h3 className="text-xl font-bold mb-2">تفاصيل الدفعة</h3>
            <div className="p-4 bg-gray-100 rounded-md mb-4"><p>إجمالي الدين: {selectedTransaction.total_debt.toFixed(2)}</p><p>إجمالي المدفوع: {selectedTransaction.total_paid.toFixed(2)}</p><p className="font-bold">الرصيد المتبقي: {selectedTransaction.remaining_balance.toFixed(2)}</p></div>
            <div className="mb-4"> <label htmlFor="paymentAmount" className="block mb-2 text-sm">قيمة الدفعة</label> <input id="paymentAmount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required className="w-full px-3 py-2 border rounded-md" /> </div>
            <div className="mb-4"> <label htmlFor="paymentDate" className="block mb-2 text-sm">تاريخ الدفعة</label> <input id="paymentDate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="w-full px-3 py-2 border rounded-md" /> </div>
            <button type="submit" className="w-full mt-4 px-4 py-2 text-white bg-green-600 rounded-md">حفظ الدفعة</button>
          </form>
        )}
        {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

export default function NewPaymentPage() {
    return ( <ProtectedRoute> <NewPaymentForm /> </ProtectedRoute> )
}
