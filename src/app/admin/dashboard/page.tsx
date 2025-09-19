'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface MonthlyStats { month: string; new_customers: number; total_revenue: number; total_profit: number; }
interface OverallStats { total_outstanding_debt: number; }

function Dashboard() {
    const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const today = new Date();
            const endDate = today.toISOString().split('T')[0];
            const startDate = new Date(new Date().setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];

            const monthlyPromise = supabase.rpc('get_monthly_stats', { start_date: startDate, end_date: endDate });
            const overallPromise = supabase.rpc('get_overall_stats');

            const [monthlyResult, overallResult] = await Promise.all([monthlyPromise, overallPromise]);

            if (monthlyResult.error) { toast.error("Failed to fetch monthly stats", { description: monthlyResult.error.message }); }
            else { setMonthlyData(monthlyResult.data); }

            if (overallResult.error) { toast.error("Failed to fetch overall stats", { description: overallResult.error.message }); }
            else { setOverallStats(overallResult.data[0]); }

            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-lg font-semibold text-primary animate-pulse">جاري تحميل لوحة التحكم...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-extrabold text-primary mb-2">لوحة التحكم والتقارير</h1>
            <p className="text-lg text-muted-foreground mb-6">نظرة عامة على الأداء المالي والتقارير الرئيسية</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="shadow-card border-0 bg-gradient-to-br from-primary/10 to-white">
                    <CardHeader><CardTitle className="text-lg text-primary">إجمالي الديون القائمة</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-extrabold text-red-600">{overallStats?.total_outstanding_debt?.toFixed(2) || '0.00'}</p></CardContent>
                </Card>
                {/* Other KPI cards can be added here */}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>الإيرادات والأرباح الشهرية</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="total_revenue" fill="#8884d8" name="الإيرادات" /><Bar dataKey="total_profit" fill="#82ca9d" name="الأرباح" /></BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>العملاء الجدد شهرياً</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="new_customers" stroke="#ff7300" name="العملاء الجدد" /></LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return ( <AdminRouteGuard> <Dashboard /> </AdminRouteGuard> )
}
