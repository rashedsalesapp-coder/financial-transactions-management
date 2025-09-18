'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'

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
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
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
    if (!customersFile) { setError('Please select a customers file.'); return; }
    setStatus('Importing customers...'); setError('');
    try {
      const json = await parseFile<CustomerExcel>(customersFile);
      const customersToInsert = json.map(row => ({ legacy_id: row['كود'], full_name: row['أسماء العملاء'], phone_1: row['Mobile']?.toString() || null, phone_2: row['Mobile2']?.toString() || null }));
      const { data, error } = await supabase.from('customers').insert(customersToInsert.map(c => ({ full_name: c.full_name, phone_1: c.phone_1, phone_2: c.phone_2 }))).select();
      if (error) throw error;
      const newMap = new Map<number, string>();
      data.forEach((newCust, index) => { newMap.set(customersToInsert[index].legacy_id, newCust.customer_id); });
      setCustomerLegacyIdMap(newMap);
      setStatus(`Successfully imported ${data.length} customers. You can now import transactions.`);
    } catch (err: any) { setError(`Error importing customers: ${err.message}`); setStatus(''); }
  };

  const handleImportTransactions = async () => {
    if (!transactionsFile || !customerLegacyIdMap) { setError('Please import customers and select a transactions file.'); return; }
    setStatus('Importing transactions...'); setError('');
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
      setStatus(`Successfully imported ${data.length} transactions. You can now import payments.`);
    } catch (err: any) { setError(`Error importing transactions: ${err.message}`); setStatus(''); }
  };

  const handleImportPayments = async () => {
    if (!paymentsFile || !transactionLegacyIdMap) { setError('Please import transactions and select a payments file.'); return; }
    setStatus('Importing payments...'); setError('');
    try {
      const json = await parseFile<PaymentExcel>(paymentsFile);
      const paymentsToInsert = json.map(row => {
        const new_transaction_id = transactionLegacyIdMap.get(row['رقم البيع']);
        if (!new_transaction_id) throw new Error(`Transaction with legacy ID ${row['رقم البيع']} not found.`);
        return { transaction_id: new_transaction_id, payment_amount: row['قيمة الدفعة'] || row['التحصيل'] || 0, payment_date: ExcelDateToJSDate(row['تاريخ الدفعة']) };
      });
      const { error } = await supabase.from('payments').insert(paymentsToInsert);
      if (error) throw error;
      setStatus(`Successfully imported ${json.length} payments. Migration complete!`);
    } catch (err: any) { setError(`Error importing payments: ${err.message}`); setStatus(''); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">أداة ترحيل البيانات من Excel</h1>
      <div className="space-y-6">
        <div className="p-4 border rounded-lg bg-white shadow-sm"><h2 className="text-xl font-semibold">الخطوة 1: استيراد العملاء</h2><input type="file" onChange={e => setCustomersFile(e.target.files?.[0] || null)} accept=".xlsx" className="my-2 block"/><button onClick={handleImportCustomers} className="bg-indigo-600 text-white px-4 py-2 rounded">استيراد العملاء</button></div>
        <div className="p-4 border rounded-lg bg-white shadow-sm"><h2 className="text-xl font-semibold">الخطوة 2: استيراد المعاملات</h2><input type="file" onChange={e => setTransactionsFile(e.target.files?.[0] || null)} accept=".xlsx" className="my-2 block"/><button onClick={handleImportTransactions} disabled={!customerLegacyIdMap} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-400">استيراد المعاملات</button></div>
        <div className="p-4 border rounded-lg bg-white shadow-sm"><h2 className="text-xl font-semibold">الخطوة 3: استيراد الدفعات</h2><input type="file" onChange={e => setPaymentsFile(e.target.files?.[0] || null)} accept=".xlsx" className="my-2 block"/><button onClick={handleImportPayments} disabled={!transactionLegacyIdMap} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:bg-gray-400">استيراد الدفعات</button></div>
        {status && <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">{status}</div>}
        {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      </div>
    </div>
  );
}

export default function MigratePage() {
  return ( <AdminRouteGuard> <MigrationTool /> </AdminRouteGuard> )
}
