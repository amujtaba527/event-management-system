import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Calendar, Users, Activity, CheckCircle2 } from 'lucide-react';

async function getStats() {
    const activeEvents = await query(`
    SELECT COUNT(*) as count FROM Events 
    WHERE ticket_sales_end > NOW()
  `);

    const totalStaff = await query(`
    SELECT COUNT(*) as count FROM Users
  `);

    const recentEvents = await query(`
    SELECT * FROM Events 
    ORDER BY id DESC 
    LIMIT 5
  `);

    return {
        activeEvents: activeEvents.rows[0].count,
        totalStaff: totalStaff.rows[0].count,
        recentEvents: recentEvents.rows,
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-2">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 relative group border-l-4 border-l-blue-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Events</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.activeEvents}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 relative group border-l-4 border-l-indigo-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Staff</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalStaff}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 relative group border-l-4 border-l-emerald-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">System Status</p>
                            <h3 className="text-2xl font-bold text-slate-900">Operational</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Recent Events</h2>
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Event Name</th>
                                    <th className="px-6 py-4">Sales End</th>
                                    <th className="px-6 py-4">Check-in Start</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recentEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                                            No events found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    stats.recentEvents.map((event: any) => (
                                        <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{event.name}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(event.ticket_sales_end).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(event.check_in_start).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
