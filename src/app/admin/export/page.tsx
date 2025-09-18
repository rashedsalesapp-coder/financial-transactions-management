'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface DuePayment { transaction_id: string; monthly_installment: number; full_name: string; phone_1: string; due_date: string; }

function CsvExportTool() {
    const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(false);

    const handleGenerateCsv = async () => {
        setLoading(true);
        if (!targetMonth) { toast.error('Please select a month.'); setLoading(false); return; }

        try {
            const { data, error: rpcError } = await supabase.rpc('get_due_payments_for_month', { target_month: targetMonth });
            if (rpcError) throw rpcError;
            if (!data || data.length === 0) { toast.info('No due payments found for the selected month.'); setLoading(false); return; }

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
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `due_payments_${targetMonth}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Successfully generated CSV for ${data.length} payments.`);
        } catch (err: any) { toast.error("Error generating CSV", { description: err.message }); }
        setLoading(false);
    };

    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>تصدير CSV شهري</CardTitle>
                <CardDescription>إنشاء ملف CSV للدفعات المستحقة في شهر معين.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="month-input">اختر الشهر (YYYY-MM)</Label>
                    <Input id="month-input" type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} />
                </div>
                <Button onClick={handleGenerateCsv} disabled={loading} className="w-full">
                    {loading ? 'جاري الإنشاء...' : 'إنشاء وتنزيل CSV'}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function ExportPage() {
    return ( <AdminRouteGuard> <CsvExportTool /> </AdminRouteGuard> )
}
