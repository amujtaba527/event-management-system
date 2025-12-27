import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, Users, Calendar, Ticket, Coins, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getEventStats(id: number) {
    const sql = `
        SELECT
            e.name,
            e.event_startdate,
            e.student_price,
            e.other_price,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id) as total_sold,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id AND status = 'checked-in') as checked_in_count,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE event_id = e.id) as total_revenue,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE event_id = e.id AND attendee_type = 'student') as revenue_student,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE event_id = e.id AND attendee_type = 'student_guest') as revenue_guest,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE event_id = e.id AND attendee_type = 'outsider') as revenue_outsider,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id AND attendee_type = 'student') as count_student,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id AND attendee_type = 'student_guest') as count_guest,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id AND attendee_type = 'outsider') as count_outsider
        FROM Events e
        WHERE e.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0];
}

export default async function EventReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const stats = await getEventStats(parseInt(id));

    if (!stats) return <div className="p-8">Event not found</div>;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    const totalSold = parseInt(stats.total_sold) || 0;
    const totalCheckedIn = parseInt(stats.checked_in_count) || 0;
    const turnoutRate = totalSold > 0 ? ((totalCheckedIn / totalSold) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex items-center gap-4">
                <Link href="/admin/reports">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
                    </Button>
                </Link>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{stats.name}</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(stats.event_startdate).toLocaleDateString(undefined, {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            hour: 'numeric', minute: 'numeric'
                        })}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Placeholder for export functionality */}
                    {/* <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export CSV</Button> */}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-emerald-500 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Coins className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.total_revenue)}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-indigo-500 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Tickets Sold</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.total_sold}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-green-500 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Checked In</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.checked_in_count}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-purple-500 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Turnout Rate</p>
                        <h3 className="text-2xl font-bold text-slate-900">{turnoutRate}%</h3>
                    </div>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Breakdown */}
                <Card className="p-0 overflow-hidden border-t-4 border-t-emerald-500 shadow-sm">
                    <div className="p-6 pb-2">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Coins className="w-4 h-4 text-emerald-500" /> Financial Breakdown
                        </h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Sales Volume</th>
                                <th className="px-6 py-3 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="px-6 py-4 font-medium">Students</td>
                                <td className="px-6 py-4">{stats.count_student}</td>
                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(stats.revenue_student)}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Guests</td>
                                <td className="px-6 py-4">{stats.count_guest}</td>
                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(stats.revenue_guest)}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Outsiders</td>
                                <td className="px-6 py-4">{stats.count_outsider}</td>
                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(stats.revenue_outsider)}</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                                <td className="px-6 py-4">Total</td>
                                <td className="px-6 py-4">{totalSold}</td>
                                <td className="px-6 py-4 text-right">{formatCurrency(stats.total_revenue)}</td>
                            </tr>
                        </tbody>
                    </table>
                </Card>

                {/* Pricing Info */}
                <Card className="p-6 border-t-4 border-t-blue-500 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-900 mb-4">Event Pricing Configuration</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">Student Ticket</p>
                                <p className="text-xs text-slate-500">Base price for registered students</p>
                            </div>
                            <span className="text-xl font-bold text-blue-600">{formatCurrency(stats.student_price)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-900">Guest/Outsider Ticket</p>
                                <p className="text-xs text-slate-500">Price for external attendees</p>
                            </div>
                            <span className="text-xl font-bold text-blue-600">{formatCurrency(stats.other_price)}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
