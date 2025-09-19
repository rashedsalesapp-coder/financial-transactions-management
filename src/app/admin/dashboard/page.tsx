'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminRouteGuard from '@/components/AdminRouteGuard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface MonthlyStats { month: string; new_customers: number; total_revenue: number; total_profit: number; }
interface OverallStats { total_outstanding_debt: number; }


import { Skeleton } from '@/components/ui/skeleton';

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
            if (monthlyResult.error) { toast.error("فشل في جلب بيانات التقارير الشهرية", { description: monthlyResult.error.message }); }
            else { setMonthlyData(monthlyResult.data); }
            if (overallResult.error) { toast.error("فشل في جلب الإحصائيات العامة", { description: overallResult.error.message }); }
            else { setOverallStats(overallResult.data[0]); }
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-1">لوحة التحكم والتقارير</h1>
                    <p className="text-base md:text-lg text-muted-foreground">نظرة عامة على الأداء المالي والتقارير الرئيسية</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* KPI Card: إجمالي الديون القائمة */}
                <Card className="shadow-card border-0 bg-gradient-to-br from-primary/10 to-white flex flex-col justify-between min-h-[120px]">
                    <CardHeader className="pb-2"><CardTitle className="text-base md:text-lg text-primary">إجمالي الديون القائمة</CardTitle></CardHeader>
                    <CardContent className="flex items-end justify-between">
                        {loading ? <Skeleton className="h-8 w-24 rounded bg-gray-200" /> : <p className="text-2xl md:text-3xl font-extrabold text-red-600">{overallStats?.total_outstanding_debt?.toFixed(2) || '0.00'}</p>}
                    </CardContent>
                </Card>
                {/* Add more KPI cards here as needed */}
                <Card className="shadow-card border-0 bg-gradient-to-br from-accent/10 to-white flex flex-col justify-between min-h-[120px]">
                    <CardHeader className="pb-2"><CardTitle className="text-base md:text-lg text-accent">بطاقة إحصائية</CardTitle></CardHeader>
                    <CardContent className="flex items-end justify-between">
                        {loading ? <Skeleton className="h-8 w-20 rounded bg-gray-200" /> : <p className="text-2xl md:text-3xl font-extrabold text-accent">—</p>}
                    </CardContent>
                </Card>
                <Card className="shadow-card border-0 bg-gradient-to-br from-secondary/10 to-white flex flex-col justify-between min-h-[120px]">
                    <CardHeader className="pb-2"><CardTitle className="text-base md:text-lg text-secondary">بطاقة إحصائية</CardTitle></CardHeader>
                    <CardContent className="flex items-end justify-between">
                        {loading ? <Skeleton className="h-8 w-20 rounded bg-gray-200" /> : <p className="text-2xl md:text-3xl font-extrabold text-secondary">—</p>}
                    </CardContent>
                </Card>
                <Card className="shadow-card border-0 bg-gradient-to-br from-muted/10 to-white flex flex-col justify-between min-h-[120px]">
                    <CardHeader className="pb-2"><CardTitle className="text-base md:text-lg text-muted-foreground">بطاقة إحصائية</CardTitle></CardHeader>
                    <CardContent className="flex items-end justify-between">
                        {loading ? <Skeleton className="h-8 w-20 rounded bg-gray-200" /> : <p className="text-2xl md:text-3xl font-extrabold text-muted-foreground">—</p>}
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="shadow-card border-0">
                    <CardHeader><CardTitle>الإيرادات والأرباح الشهرية</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-72 w-full rounded bg-gray-200" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="total_revenue" fill="#2563eb" name="الإيرادات" /><Bar dataKey="total_profit" fill="#10b981" name="الأرباح" /></BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-card border-0">
                    <CardHeader><CardTitle>العملاء الجدد شهرياً</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-72 w-full rounded bg-gray-200" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="new_customers" stroke="#f59e42" name="العملاء الجدد" /></LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return ( <AdminRouteGuard> <Dashboard /> </AdminRouteGuard> )
}
