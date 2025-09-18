'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from 'sonner'

interface Customer { full_name: string; civil_id: string; phone_1: string; }
interface Transaction { transaction_id: string; total_debt: number; total_paid: number; remaining_balance: number; transaction_date: string; has_legal_case: boolean; }

function CustomerStatement() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalDebt: 0, totalPaid: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;
      setLoading(true);
      const customerPromise = supabase.from('customers').select('full_name, civil_id, phone_1').eq('customer_id', customerId).single();
      const transactionsPromise = supabase.from('transactions_with_legal_status').select('*').eq('customer_id', customerId);
      const [customerResult, transactionsResult] = await Promise.all([customerPromise, transactionsPromise]);

      if (customerResult.error) { toast.error("Failed to fetch customer details", { description: customerResult.error.message }); setLoading(false); return; }
      setCustomer(customerResult.data);
      if (transactionsResult.error) { toast.error("Failed to fetch transactions", { description: transactionsResult.error.message }); setLoading(false); return; }
      setTransactions(transactionsResult.data);

      setSummary({
        totalDebt: transactionsResult.data.reduce((acc, t) => acc + t.total_debt, 0),
        totalPaid: transactionsResult.data.reduce((acc, t) => acc + t.total_paid, 0),
        totalBalance: transactionsResult.data.reduce((acc, t) => acc + t.remaining_balance, 0)
      });
      setLoading(false);
    };
    fetchData();
  }, [customerId]);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!customer) return <div className="text-center p-10">Customer not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-3xl">{customer.full_name}</CardTitle><CardDescription>الرقم المدني: {customer.civil_id || 'N/A'} | الهاتف: {customer.phone_1 || 'N/A'}</CardDescription></CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>إجمالي الديون</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{summary.totalDebt.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>إجمالي المدفوع</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{summary.totalPaid.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>الرصيد الإجمالي</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{summary.totalBalance.toFixed(2)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>كشف حساب المعاملات</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead className="text-right">المعاملة</TableHead><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">الدين</TableHead><TableHead className="text-right">المدفوع</TableHead><TableHead className="text-right">المتبقي</TableHead><TableHead className="text-right">قضية</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.map(t => (
                <TableRow key={t.transaction_id}>
                  <TableCell><Link href={`/transactions/${t.transaction_id}/statement`} className="text-primary hover:underline">{t.transaction_id.substring(0, 8)}...</Link></TableCell>
                  <TableCell>{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                  <TableCell>{t.total_debt.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600">{t.total_paid.toFixed(2)}</TableCell>
                  <TableCell className="text-red-600">{t.remaining_balance.toFixed(2)}</TableCell>
                  <TableCell>{t.has_legal_case ? 'نعم' : 'لا'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomerStatementPage() {
    return ( <ProtectedRoute> <CustomerStatement /> </ProtectedRoute> )
}
