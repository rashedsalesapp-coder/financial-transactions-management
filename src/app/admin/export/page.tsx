'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import Papa from 'papaparse'

interface DuePayment { transaction_id: string; monthly_installment: number; full_name: string; phone_1: string; due_date: string; }

function CsvExportTool() {
    const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const handleGenerateCsv = async () => {
        setStatus('Generating CSV...');
        setError('');
        if (!targetMonth) { setError('Please select a month.'); setStatus(''); return; }
        try {
            const { data, error: rpcError } = await supabase.rpc('get_due_payments_for_month', { target_month: targetMonth });
            if (rpcError) throw rpcError;
            if (!data || data.length === 0) { setStatus('No due payments found for the selected month.'); return; }
            const csvData = (data as DuePayment[]).map(payment => {
                const nameParts = payment.full_name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || firstName;
                const mobileNumber = payment.phone_1 ? `965${payment.phone_1.replace(/\s/g, '')}` : '';
                return {
                    'Description': `Monthly Installment for Transaction #${payment.transaction_id.substring(0, 8)}`,
                    'Amount': payment.monthly_installment.toFixed(2),
                    'First Name': firstName, 'Last Name': lastName, 'Email Address': '',
                    'Mobile Number': mobileNumber, 'Due Date': payment.due_date,
                    'Reference': payment.transaction_id, 'Notes': '', 'Expiry': payment.due_date,
                };
            });
            const csvString = Papa.unparse(csvData);
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `due_payments_${targetMonth}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setStatus(`Successfully generated CSV for ${data.length} payments.`);
        } catch (err: any) { setError(`Error generating CSV: ${err.message}`); setStatus(''); }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">تصدير CSV شهري للدفعات المستحقة</h1>
            <div className="max-w-md bg-white p-8 rounded-lg shadow-md">
                <div className="mb-4">
                    <label htmlFor="month-input" className="block mb-2 text-sm font-medium">اختر الشهر (YYYY-MM)</label>
                    <input id="month-input" type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} className="w-full px-3 py-2 border rounded-md"/>
                </div>
                <button onClick={handleGenerateCsv} className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">إنشاء وتنزيل CSV</button>
                {status && <p className="mt-4 text-center text-sm text-green-600">{status}</p>}
                {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
}

export default function ExportPage() {
    return ( <AdminRouteGuard> <CsvExportTool /> </AdminRouteGuard> )
}
