'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from 'sonner'

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

  useEffect(() => {
    const fetchData = async () => {
        if (!transactionId) return;
        setLoading(true);
        const { data: transData, error: transError } = await supabase.from('transactions_with_legal_status').select('*').eq('transaction_id', transactionId).single();
        if (transError || !transData) { toast.error('Transaction not found.'); setLoading(false); return; }
        setTransaction(transData);

        const customerPromise = supabase.from('customers').select('full_name').eq('customer_id', transData.customer_id).single();
        const paymentsPromise = supabase.from('payments').select('*').eq('transaction_id', transactionId).order('payment_date', { ascending: false });
        const [custResult, paymentsResult] = await Promise.all([customerPromise, paymentsPromise]);

        if(custResult.data) setCustomer(custResult.data);
        if(paymentsResult.data) {
            setPayments(paymentsResult.data);
            if (paymentsResult.data.length > 0) setLastPaymentDate(paymentsResult.data[0].payment_date);
        }

        const firstPayment = new Date(transData.first_payment_date);
        const monthsElapsed = (new Date().getFullYear() - firstPayment.getFullYear()) * 12 + (new Date().getMonth() - firstPayment.getMonth());
        if (monthsElapsed > 0) {
            setOverdueAmount(Math.max(0, (monthsElapsed * transData.monthly_installment) - transData.total_paid));
        }
        setLoading(false);
    };
    fetchData();
  }, [transactionId]);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!transaction) return <div className="text-center p-10 font-semibold">Transaction not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">كشف حساب المعاملة</CardTitle>
          <CardDescription>
            المعاملة رقم: {transactionId.substring(0, 8)}...
            {customer && <span> | العميل: <Link href={`/customers/${transaction.customer_id}/statement`} className="text-primary hover:underline">{customer.full_name}</Link></span>}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle>ملخص المعاملة</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>إجمالي الدين:</strong> {transaction.total_debt.toFixed(2)}</p>
                <p><strong>إجمالي المدفوع:</strong> <span className="text-green-600 font-semibold">{transaction.total_paid.toFixed(2)}</span></p>
                <p><strong>الرصيد المتبقي:</strong> <span className="text-red-600 font-semibold">{transaction.remaining_balance.toFixed(2)}</span></p>
                <p><strong>المبلغ المتأخر:</strong> <span className="text-red-700 font-bold">{overdueAmount.toFixed(2)}</span></p>
                <p><strong>تاريخ آخر دفعة:</strong> {lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString() : 'لا يوجد'}</p>
                <p><strong>قضية قانونية:</strong> {transaction.has_legal_case ? 'نعم' : 'لا'}</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>الدفعات المسددة</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-y-auto h-48">
              <Table>
                  <TableHeader><TableRow><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">المبلغ</TableHead></TableRow></TableHeader>
                  <TableBody>
                      {payments.map(p => ( <TableRow key={p.payment_id}><TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell><TableCell>{p.payment_amount.toFixed(2)}</TableCell></TableRow> ))}
                      {payments.length === 0 && <TableRow><TableCell colSpan={2} className="text-center">لا توجد دفعات مسددة.</TableCell></TableRow>}
                  </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TransactionStatementPage() {
    return ( <ProtectedRoute> <TransactionStatement /> </ProtectedRoute> )
}
