'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Customer, CustomerCombobox } from '@/components/CustomerCombobox'

interface TransactionWithBalance { transaction_id: string; total_debt: number; monthly_installment: number; remaining_balance: number; total_paid: number; }

function NewPaymentForm() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<TransactionWithBalance[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithBalance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setSelectedTransaction(null);
      if (!selectedCustomer) { setCustomerTransactions([]); return; }
      const { data, error } = await supabase.from('transactions_with_balance').select('*').eq('customer_id', selectedCustomer.customer_id).gt('remaining_balance', 0);
      if (error) { toast.error('Error fetching transactions.'); } else { setCustomerTransactions(data || []); }
    };
    fetchTransactions();
  }, [selectedCustomer]);

  const handleSelectTransaction = (transaction: TransactionWithBalance) => {
    setSelectedTransaction(transaction);
    setPaymentAmount(transaction.monthly_installment.toString());
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) { toast.error('Please select a transaction.'); return; }
    setLoading(true);
    const { error } = await supabase.from('payments').insert({ transaction_id: selectedTransaction.transaction_id, payment_amount: parseFloat(paymentAmount), payment_date: paymentDate });
    if (error) { toast.error("Failed to create payment", { description: error.message }); }
    else {
      toast.success('Payment created successfully!');
      setSelectedTransaction(null);
      setPaymentAmount('');
      // Refetch transactions to update list
      const { data } = await supabase.from('transactions_with_balance').select('*').eq('customer_id', selectedCustomer!.customer_id).gt('remaining_balance', 0);
      setCustomerTransactions(data || []);
    }
    setLoading(false);
  };

  return (
      <section className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl shadow-card mt-8">
        <h1 className="text-3xl font-extrabold text-primary mb-6">إضافة دفعة جديدة</h1>
        <form onSubmit={handleCreatePayment} className="space-y-6">
        <div className="space-y-2">
          <Label>العميل</Label>
          <CustomerCombobox selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} />
        </div>

        {selectedCustomer && (
          <Card><CardHeader><CardTitle>معاملات العميل النشطة</CardTitle></CardHeader>
            <CardContent>
              {customerTransactions.length > 0 ? (
                <div className="space-y-2">{customerTransactions.map(t => (
                    <div key={t.transaction_id} onClick={() => handleSelectTransaction(t)} className={`p-3 border rounded-md cursor-pointer ${selectedTransaction?.transaction_id === t.transaction_id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                      <p>المعاملة رقم: {t.transaction_id.substring(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">الرصيد المتبقي: {t.remaining_balance.toFixed(2)}</p>
                    </div>
                ))}</div>
              ) : <p>لا يوجد معاملات نشطة لهذا العميل.</p>}
            </CardContent>
          </Card>
        )}

        {selectedTransaction && (
            <Card className="bg-muted"><CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-lg">تفاصيل الدفعة للمعاملة: {selectedTransaction.transaction_id.substring(0,8)}</h3>
              <p className="text-sm"><strong>إجمالي الدين:</strong> {selectedTransaction.total_debt.toFixed(2)}</p>
              <p className="text-sm"><strong>إجمالي المدفوع:</strong> {selectedTransaction.total_paid.toFixed(2)}</p>
              <p className="text-sm font-bold"><strong>الرصيد المتبقي:</strong> {selectedTransaction.remaining_balance.toFixed(2)}</p>
            </CardContent></Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="paymentAmount">قيمة الدفعة</Label><Input id="paymentAmount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label htmlFor="paymentDate">تاريخ الدفعة</Label><Input id="paymentDate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required /></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ الدفعة'}</Button>
        )}
      </CardContent>
      </section>
  )
}

export default function NewPaymentPage() {
    return ( <ProtectedRoute> <NewPaymentForm /> </ProtectedRoute> )
}
