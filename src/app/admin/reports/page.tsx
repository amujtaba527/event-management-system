import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, Users, Calendar, Ticket, Coins, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getStats() {
    // Consolidated query for atomic snapshot
    const sql = `
        SELECT
            (SELECT count(*) FROM Events) as total_events,
            (SELECT count(*) FROM Tickets) as total_tickets_sold,
            (SELECT count(*) FROM Tickets WHERE status = 'checked-in') as total_checked_in,
            (SELECT count(*) FROM Users) as total_users,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets) as total_revenue,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE attendee_type = 'student') as revenue_student,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE attendee_type = 'student_guest') as revenue_guest,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE attendee_type = 'outsider') as revenue_outsider
    `;
    const res = await query(sql);
    const row = res.rows[0];

    return {
        totalEvents: parseInt(row.total_events),
        totalSold: parseInt(row.total_tickets_sold),
        totalCheckedIn: parseInt(row.total_checked_in),
        totalUsers: parseInt(row.total_users),
        totalRevenue: parseFloat(row.total_revenue),
        revenueStudent: parseFloat(row.revenue_student),
        revenueGuest: parseFloat(row.revenue_guest),
        revenueOutsider: parseFloat(row.revenue_outsider),
    };
}

async function getAllEventsStats() {
    const sql = `
        SELECT 
            e.id,
            e.name,
            e.event_startdate,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id) as total_sold,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id AND status = 'checked-in') as checked_in_count,
            (SELECT COALESCE(SUM(price), 0) FROM Tickets WHERE event_id = e.id) as event_revenue
        FROM Events e
        ORDER BY e.event_startdate DESC
    `;
    const res = await query(sql);
    return res.rows;
}

export default async function ReportsPage() {
    const stats = await getStats();
    const allEvents = await getAllEventsStats();

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Reports</h1>
                <p className="text-slate-500 mt-1">Financial overview and event performance analytics.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Coins className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Tickets Sold</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalSold}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Checked In</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalCheckedIn}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Events</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalEvents}</h3>
                    </div>
                </Card>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 col-span-1 border-t-4 border-t-emerald-500 shadow-sm transition-all hover:bg-emerald-50/10">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-500" /> Revenue Breakdown
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-600 bg-white px-2 py-0.5 rounded shadow-sm">Student Sales</span>
                            <span className="font-bold text-slate-900">{formatCurrency(stats.revenueStudent)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-600 bg-white px-2 py-0.5 rounded shadow-sm">Guest Sales</span>
                            <span className="font-bold text-slate-900">{formatCurrency(stats.revenueGuest)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-600 bg-white px-2 py-0.5 rounded shadow-sm">Outsider Sales</span>
                            <span className="font-bold text-slate-900">{formatCurrency(stats.revenueOutsider)}</span>
                        </div>
                    </div>
                </Card>

                {/* Events Directory Table */}
                <Card className="col-span-1 lg:col-span-2 p-0 overflow-hidden border-t-4 border-t-indigo-500 shadow-sm">
                    <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold text-slate-900">Events Directory</h3>
                        <p className="text-sm text-slate-500">Click view for details</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Event Name</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Sold</th>
                                    <th className="px-6 py-4">Revenue</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {allEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                            No event data available yet.
                                        </td>
                                    </tr>
                                ) : (
                                    allEvents.map((event: any) => {
                                        const total = parseInt(event.total_sold) || 0;
                                        const revenue = parseFloat(event.event_revenue) || 0;

                                        return (
                                            <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{event.name}</td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {new Date(event.event_startdate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{total}</td>
                                                <td className="px-6 py-4 font-medium text-emerald-600 tabular-nums">
                                                    {formatCurrency(revenue)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/admin/reports/${event.id}`}>
                                                        <Button size="sm" variant="ghost" className="hover:bg-blue-50 hover:text-blue-600">
                                                            View Report <ArrowRight className="w-3 h-3 ml-2" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
