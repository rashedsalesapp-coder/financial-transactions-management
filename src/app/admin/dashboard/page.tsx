'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface MonthlyStats {
    month: string;
    new_customers: number;
    total_revenue: number;
    total_profit: number;
}
interface OverallStats { total_outstanding_debt: number; }

function Dashboard() {
    const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            const today = new Date();
            const endDate = today.toISOString().split('T')[0];
            const startDate = new Date(new Date().setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
            const { data: monthly, error: monthlyError } = await supabase.rpc('get_monthly_stats', { start_date: startDate, end_date: endDate });
            if (monthlyError) { setError(`Failed to fetch monthly stats: ${monthlyError.message}`); }
            else { setMonthlyData(monthly); }
            const { data: overall, error: overallError } = await supabase.rpc('get_overall_stats');
            if (overallError) { setError(prev => `${prev}\nFailed to fetch overall stats: ${overallError.message}`); }
            else { setOverallStats(overall[0]); }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-4">Loading dashboard...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">لوحة التحكم والتقارير</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow"><h2 className="text-xl font-bold text-gray-600">إجمالي الديون القائمة</h2><p className="text-3xl font-semibold text-red-600 mt-2">{overallStats?.total_outstanding_debt?.toFixed(2) || '0.00'}</p></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">الإيرادات والأرباح الشهرية</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="total_revenue" fill="#8884d8" name="الإيرادات" /><Bar dataKey="total_profit" fill="#82ca9d" name="الأرباح" /></BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">العملاء الجدد شهرياً</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="new_customers" stroke="#ff7300" name="العملاء الجدد" /></LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return ( <AdminRouteGuard> <Dashboard /> </AdminRouteGuard> )
}
