'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

interface TransactionDetails { customer_id: string; monthly_installment: number; total_debt: number; total_paid: number; remaining_balance: number; transaction_date: string; first_payment_date: string; has_legal_case: boolean; }
interface Payment { payment_id: string; payment_amount: number; payment_date: string; }
interface Customer { full_name: string; }

function TransactionStatement() {
  const params = useParams();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [lastPaymentDate, setLastPaymentDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        if (!transactionId) return;
        setLoading(true);
        const { data: transData, error: transError } = await supabase.from('transactions_with_legal_status').select('*').eq('transaction_id', transactionId).single();
        if (transError || !transData) { setError('Transaction not found.'); setLoading(false); return; }
        setTransaction(transData);
        const { data: custData } = await supabase.from('customers').select('full_name').eq('customer_id', transData.customer_id).single();
        setCustomer(custData);
        const { data: paymentsData } = await supabase.from('payments').select('*').eq('transaction_id', transactionId).order('payment_date', { ascending: false });
        setPayments(paymentsData || []);
        if(paymentsData && paymentsData.length > 0) { setLastPaymentDate(paymentsData[0].payment_date); }
        const firstPayment = new Date(transData.first_payment_date);
        const monthsElapsed = (new Date().getFullYear() - firstPayment.getFullYear()) * 12 + (new Date().getMonth() - firstPayment.getMonth());
        if (monthsElapsed > 0) {
            const expectedPaid = monthsElapsed * transData.monthly_installment;
            setOverdueAmount(Math.max(0, expectedPaid - transData.total_paid));
        }
        setLoading(false);
    };
    fetchData();
  }, [transactionId]);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!transaction) return null;

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6"><h1 className="text-3xl font-bold mb-2">كشف حساب المعاملة</h1><p>المعاملة رقم: {transactionId.substring(0, 8)}...</p>{customer && <p>العميل: <Link href={`/customers/${transaction.customer_id}/statement`} className="text-indigo-600 hover:underline">{customer.full_name}</Link></p>}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-2xl font-bold mb-4">ملخص المعاملة</h2>
            <div className="space-y-2">
                <p><strong>إجمالي الدين:</strong> {transaction.total_debt.toFixed(2)}</p>
                <p><strong>إجمالي المدفوع:</strong> <span className="text-green-600">{transaction.total_paid.toFixed(2)}</span></p>
                <p><strong>الرصيد المتبقي:</strong> <span className="text-red-600">{transaction.remaining_balance.toFixed(2)}</span></p>
                <p><strong>المبلغ المتأخر:</strong> <span className="text-red-700 font-bold">{overdueAmount.toFixed(2)}</span></p>
                <p><strong>تاريخ آخر دفعة:</strong> {lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString() : 'لا يوجد'}</p>
                <p><strong>قضية قانونية:</strong> {transaction.has_legal_case ? 'نعم' : 'لا'}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-2xl font-bold mb-4">الدفعات المسددة</h2>
          <div className="overflow-y-auto h-64">
            <table className="min-w-full">
                <thead className="bg-gray-200"><tr><th className="py-2 px-4 text-right">التاريخ</th><th className="py-2 px-4 text-right">المبلغ</th></tr></thead>
                <tbody>
                    {payments.map(p => ( <tr key={p.payment_id} className="border-b"><td className="py-2 px-4">{new Date(p.payment_date).toLocaleDateString()}</td><td className="py-2 px-4">{p.payment_amount.toFixed(2)}</td></tr> ))}
                    {payments.length === 0 && <tr><td colSpan={2} className="text-center p-4">لا توجد دفعات مسددة.</td></tr>}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionStatementPage() {
    return ( <ProtectedRoute> <TransactionStatement /> </ProtectedRoute> )
}
