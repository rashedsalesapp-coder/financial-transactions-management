'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type CustomerExcel = { 'كود': number; 'أسماء العملاء': string; 'Mobile'?: number; 'Mobile2'?: number; }
type TransactionExcel = { 'رقم العميل': number; 'رقم البيع': number; 'سعر السلعة': number; 'إجمالي السعر': number; 'عدد الدفعات': number; 'القسط الشهرى': number; 'تاريخ بدء القرض': number; }
type PaymentExcel = { 'كود': number; 'رقم البيع': number; 'تاريخ الدفعة': number; 'قيمة الدفعة'?: number; 'التحصيل'?: number; }

function ExcelDateToJSDate(serial: number) {
  if (typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate()).toISOString().split('T')[0];
}

function MigrationTool() {
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [paymentsFile, setPaymentsFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [customerLegacyIdMap, setCustomerLegacyIdMap] = useState<Map<number, string> | null>(null);
  const [transactionLegacyIdMap, setTransactionLegacyIdMap] = useState<Map<number, string> | null>(null);

  const parseFile = <T,>(file: File): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const json = XLSX.utils.sheet_to_json<T>(workbook.Sheets[workbook.SheetNames[0]]);
          resolve(json);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImportCustomers = async () => {
    if (!customersFile) { toast.error('Please select a customers file.'); return; }
    setLoading('customers');
    try {
      const json = await parseFile<CustomerExcel>(customersFile);
      const customersToInsert = json.map(row => ({ legacy_id: row['كود'], full_name: row['أسماء العملاء'], phone_1: row['Mobile']?.toString() || null, phone_2: row['Mobile2']?.toString() || null }));
      const { data, error } = await supabase.from('customers').insert(customersToInsert.map(c => ({ full_name: c.full_name, phone_1: c.phone_1, phone_2: c.phone_2 }))).select();
      if (error) throw error;
      const newMap = new Map<number, string>();
      data.forEach((newCust, index) => { newMap.set(customersToInsert[index].legacy_id, newCust.customer_id); });
      setCustomerLegacyIdMap(newMap);
      toast.success(`Successfully imported ${data.length} customers.`);
    } catch (err: any) { toast.error("Customer import failed", { description: err.message }); }
    setLoading(null);
  };

  const handleImportTransactions = async () => {
    if (!transactionsFile || !customerLegacyIdMap) { toast.error('Please import customers and select a transactions file.'); return; }
    setLoading('transactions');
    try {
      const json = await parseFile<TransactionExcel>(transactionsFile);
      const transactionsToInsert = json.map(row => {
        const new_customer_id = customerLegacyIdMap.get(row['رقم العميل']);
        if (!new_customer_id) throw new Error(`Customer with legacy ID ${row['رقم العميل']} not found.`);
        return { legacy_id: row['رقم البيع'], customer_id: new_customer_id, goods_price: row['سعر السلعة'], monthly_installment: row['القسط الشهرى'], installments_count: row['عدد الدفعات'], first_payment_date: ExcelDateToJSDate(row['تاريخ بدء القرض']) };
      });
      const { data, error } = await supabase.from('transactions').insert(transactionsToInsert.map(t => ({ customer_id: t.customer_id, goods_price: t.goods_price, monthly_installment: t.monthly_installment, installments_count: t.installments_count, first_payment_date: t.first_payment_date }))).select();
      if (error) throw error;
      const newMap = new Map<number, string>();
      data.forEach((newTrans, index) => { newMap.set(transactionsToInsert[index].legacy_id, newTrans.transaction_id); });
      setTransactionLegacyIdMap(newMap);
      toast.success(`Successfully imported ${data.length} transactions.`);
    } catch (err: any) { toast.error("Transaction import failed", { description: err.message }); }
    setLoading(null);
  };

  const handleImportPayments = async () => {
    if (!paymentsFile || !transactionLegacyIdMap) { toast.error('Please import transactions and select a payments file.'); return; }
    setLoading('payments');
    try {
      const json = await parseFile<PaymentExcel>(paymentsFile);
      const paymentsToInsert = json.map(row => {
        const new_transaction_id = transactionLegacyIdMap.get(row['رقم البيع']);
        if (!new_transaction_id) throw new Error(`Transaction with legacy ID ${row['رقم البيع']} not found.`);
        return { transaction_id: new_transaction_id, payment_amount: row['قيمة الدفعة'] || row['التحصيل'] || 0, payment_date: ExcelDateToJSDate(row['تاريخ الدفعة']) };
      });
      const { error } = await supabase.from('payments').insert(paymentsToInsert);
      if (error) throw error;
      toast.success(`Successfully imported ${json.length} payments. Migration complete!`);
    } catch (err: any) { toast.error("Payment import failed", { description: err.message }); }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">أداة ترحيل البيانات</h1>
        <Card>
            <CardHeader><CardTitle>الخطوة 1: استيراد العملاء</CardTitle><CardDescription>قم بتحميل ملف Customers.xlsx</CardDescription></CardHeader>
            <CardContent className="flex items-center space-x-4">
                <Input type="file" onChange={e => setCustomersFile(e.target.files?.[0] || null)} accept=".xlsx" className="max-w-xs"/>
                <Button onClick={handleImportCustomers} disabled={loading !== null}>{loading === 'customers' ? 'جاري الاستيراد...' : 'استيراد العملاء'}</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>الخطوة 2: استيراد المعاملات</CardTitle><CardDescription>قم بتحميل ملف Transactions.xlsx</CardDescription></CardHeader>
            <CardContent className="flex items-center space-x-4">
                <Input type="file" onChange={e => setTransactionsFile(e.target.files?.[0] || null)} accept=".xlsx" className="max-w-xs"/>
                <Button onClick={handleImportTransactions} disabled={!customerLegacyIdMap || loading !== null}>{loading === 'transactions' ? 'جاري الاستيراد...' : 'استيراد المعاملات'}</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>الخطوة 3: استيراد الدفعات</CardTitle><CardDescription>قم بتحميل ملف Payments.xlsx</CardDescription></CardHeader>
            <CardContent className="flex items-center space-x-4">
                <Input type="file" onChange={e => setPaymentsFile(e.target.files?.[0] || null)} accept=".xlsx" className="max-w-xs"/>
                <Button onClick={handleImportPayments} disabled={!transactionLegacyIdMap || loading !== null}>{loading === 'payments' ? 'جاري الاستيراد...' : 'استيراد الدفعات'}</Button>
            </CardContent>
        </Card>
    </div>
  );
}

export default function MigratePage() {
  return ( <AdminRouteGuard> <MigrationTool /> </AdminRouteGuard> )
}
