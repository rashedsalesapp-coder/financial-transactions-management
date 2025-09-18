'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Customer { full_name: string; civil_id: string; phone_1: string; }
interface Transaction { transaction_id: string; total_debt: number; total_paid: number; remaining_balance: number; transaction_date: string; has_legal_case: boolean; }

function CustomerStatement() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalDebt: 0, totalPaid: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;
      setLoading(true);
      const { data: customerData, error: customerError } = await supabase.from('customers').select('full_name, civil_id, phone_1').eq('customer_id', customerId).single();
      if (customerError) { setError('Failed to fetch customer details.'); setLoading(false); return; }
      setCustomer(customerData);
      const { data: transactionsData, error: transactionsError } = await supabase.from('transactions_with_legal_status').select('*').eq('customer_id', customerId);
      if (transactionsError) { setError('Failed to fetch transactions.'); setLoading(false); return; }
      setTransactions(transactionsData);
      setSummary({
        totalDebt: transactionsData.reduce((acc, t) => acc + t.total_debt, 0),
        totalPaid: transactionsData.reduce((acc, t) => acc + t.total_paid, 0),
        totalBalance: transactionsData.reduce((acc, t) => acc + t.remaining_balance, 0)
      });
      setLoading(false);
    };
    fetchData();
  }, [customerId]);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!customer) return <div className="text-center p-10">Customer not found.</div>;

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6"><h1 className="text-3xl font-bold mb-2">{customer.full_name}</h1><p>الرقم المدني: {customer.civil_id || 'N/A'}</p><p>الهاتف: {customer.phone_1 || 'N/A'}</p></div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div><h2 className="text-lg font-bold text-gray-600">إجمالي الديون</h2><p className="text-2xl font-semibold">{summary.totalDebt.toFixed(2)}</p></div>
        <div><h2 className="text-lg font-bold text-gray-600">إجمالي المدفوع</h2><p className="text-2xl font-semibold text-green-600">{summary.totalPaid.toFixed(2)}</p></div>
        <div><h2 className="text-lg font-bold text-gray-600">الرصيد الإجمالي</h2><p className="text-2xl font-semibold text-red-600">{summary.totalBalance.toFixed(2)}</p></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-2xl font-bold mb-4">كشف حساب المعاملات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200"><tr><th className="py-2 px-4 text-right">المعاملة</th><th className="py-2 px-4 text-right">التاريخ</th><th className="py-2 px-4 text-right">الدين</th><th className="py-2 px-4 text-right">المدفوع</th><th className="py-2 px-4 text-right">المتبقي</th><th className="py-2 px-4 text-right">قضية</th></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.transaction_id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4"><Link href={`/transactions/${t.transaction_id}/statement`} className="text-indigo-600 hover:underline">{t.transaction_id.substring(0, 8)}...</Link></td>
                  <td className="py-2 px-4">{new Date(t.transaction_date).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{t.total_debt.toFixed(2)}</td>
                  <td className="py-2 px-4 text-green-600">{t.total_paid.toFixed(2)}</td>
                  <td className="py-2 px-4 text-red-600">{t.remaining_balance.toFixed(2)}</td>
                  <td className="py-2 px-4">{t.has_legal_case ? 'نعم' : 'لا'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CustomerStatementPage() {
    return ( <ProtectedRoute> <CustomerStatement /> </ProtectedRoute> )
}
