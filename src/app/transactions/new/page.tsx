'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Customer, CustomerCombobox } from '@/components/CustomerCombobox'

// New Customer Dialog Component
function NewCustomerDialog({ onCustomerCreated }: { onCustomerCreated: (customer: Customer) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [civilId, setCivilId] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');

  const handleCreateCustomer = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customers').insert({ full_name: fullName, civil_id: civilId || null, phone_1: phone1 || null, phone_2: phone2 || null }).select().single();
    if (error) { toast.error("Failed to create customer", { description: error.message }); }
    else {
      toast.success("Customer created successfully!");
      onCustomerCreated(data as Customer);
      setOpen(false);
      setFullName(''); setCivilId(''); setPhone1(''); setPhone2('');
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">إنشاء عميل جديد</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>إضافة عميل جديد</DialogTitle><DialogDescription>أدخل بيانات العميل الجديد هنا.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">الاسم الكامل</Label><Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="civilId" className="text-right">الرقم المدني</Label><Input id="civilId" value={civilId} onChange={e => setCivilId(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone1" className="text-right">الهاتف 1</Label><Input id="phone1" value={phone1} onChange={e => setPhone1(e.target.value)} className="col-span-3" /></div>
          <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="phone2" className="text-right">الهاتف 2</Label><Input id="phone2" value={phone2} onChange={e => setPhone2(e.target.value)} className="col-span-3" /></div>
        </div>
        <DialogFooter><Button onClick={handleCreateCustomer} disabled={loading}>{loading ? "جاري الإنشاء..." : "إنشاء عميل"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewTransactionForm() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [goodsPrice, setGoodsPrice] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [totalDebt, setTotalDebt] = useState(0);
  const [profit, setProfit] = useState(0);
  const [endPaymentDate, setEndPaymentDate] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) { toast.error('Please select a customer.'); return; }
    setLoading(true);
    const { error } = await supabase.from('transactions').insert({ customer_id: selectedCustomer.customer_id, goods_price: parseFloat(goodsPrice), monthly_installment: parseFloat(monthlyInstallment), installments_count: parseInt(installmentsCount, 10), first_payment_date: firstPaymentDate });
    if (error) { toast.error("Failed to create transaction", { description: error.message }); }
    else { toast.success('Transaction created successfully!'); }
    setLoading(false);
  };

  return (
    <section className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl shadow-card mt-8">
      <h1 className="text-3xl font-extrabold text-primary mb-6">إضافة معاملة جديدة</h1>
      <form onSubmit={handleCreateTransaction} className="space-y-6">
        <div className="space-y-2">
          <Label>العميل</Label>
          <div className="flex items-center space-x-2">
            <CustomerCombobox selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} />
            <NewCustomerDialog onCustomerCreated={(customer) => setSelectedCustomer(customer)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label htmlFor="goodsPrice">سعر السلعة</Label><Input id="goodsPrice" type="number" value={goodsPrice} onChange={e => setGoodsPrice(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="installmentsCount">عدد الدفعات</Label><Input id="installmentsCount" type="number" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="monthlyInstallment">القسط الشهري</Label><Input id="monthlyInstallment" type="number" value={monthlyInstallment} onChange={e => setMonthlyInstallment(e.target.value)} required /></div>
            <div className="space-y-1.5"><Label htmlFor="firstPaymentDate">تاريخ أول دفعة</Label><Input id="firstPaymentDate" type="date" value={firstPaymentDate} onChange={e => setFirstPaymentDate(e.target.value)} required /></div>
          </div>
          <Card className="bg-muted"><CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-lg">الحقول المحسوبة</h3>
              <p className="text-sm"><strong>إجمالي الدين:</strong> {totalDebt.toFixed(2)}</p>
              <p className="text-sm"><strong>الربح:</strong> {profit.toFixed(2)}</p>
              <p className="text-sm"><strong>تاريخ نهاية السداد:</strong> {endPaymentDate || 'N/A'}</p>
          </CardContent></Card>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'جاري الإنشاء...' : 'إنشاء معاملة'}</Button>
        </form>
        </CardContent>
      </section>
  )
}

export default function NewTransactionPage() {
    return ( <ProtectedRoute> <NewTransactionForm /> </ProtectedRoute> )
}
