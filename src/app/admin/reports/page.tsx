import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { BarChart3, Users, Calendar, Ticket } from 'lucide-react';

async function getStats() {
    // Parallelize queries for better performance
    const [eventsRes, inviteesRes, ticketsRes, usersRes] = await Promise.all([
        query('SELECT count(*) as count FROM Events'),
        query('SELECT count(*) as count FROM EventInvitees'),
        query("SELECT count(*) as count FROM Tickets WHERE status = 'checked-in'"),
        query('SELECT count(*) as count FROM Users')
    ]);

    return {
        totalEvents: parseInt(eventsRes.rows[0].count),
        totalAttendees: parseInt(inviteesRes.rows[0].count),
        totalCheckedIn: parseInt(ticketsRes.rows[0].count),
        totalUsers: parseInt(usersRes.rows[0].count)
    };
}

async function getHighAttendanceEvents() {
    // Get top 5 events by check-in count using subqueries for accuracy
    const sql = `
        SELECT 
            e.id,
            e.name, 
            (SELECT COUNT(*) FROM EventInvitees WHERE event_id = e.id) as total_invitees,
            (SELECT COUNT(*) FROM Tickets WHERE event_id = e.id AND status = 'checked-in') as entered_count
        FROM Events e
        ORDER BY entered_count DESC
        LIMIT 5
    `;
    const res = await query(sql);
    return res.rows;
}

export default async function ReportsPage() {
    const stats = await getStats();
    const topEvents = await getHighAttendanceEvents();

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Reports</h1>
                <p className="text-slate-500 mt-1">Overview of system utilization and event performance.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-blue-500">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Events</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalEvents}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-indigo-500">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Invitees</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalAttendees}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-green-500">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Successful Entries</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalCheckedIn}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 bg-white border-l-4 border-l-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Admin/Staff</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.totalUsers}</h3>
                    </div>
                </Card>
            </div>

            {/* Detailed Event Table */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Top Performing Events</h2>
                <Card className="p-0 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Event Name</th>
                                <th className="px-6 py-4">Total Invitees</th>
                                <th className="px-6 py-4">Actual Turnout</th>
                                <th className="px-6 py-4">Turnout Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        No event data available yet.
                                    </td>
                                </tr>
                            ) : (
                                topEvents.map((event: any, idx: number) => {
                                    const total = parseInt(event.total_invitees) || 0;
                                    const entered = parseInt(event.entered_count) || 0;
                                    const rate = total > 0 ? ((entered / total) * 100).toFixed(1) : '0.0';

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{event.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{total}</td>
                                            <td className="px-6 py-4 text-slate-600">{entered}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full"
                                                            style={{ width: `${Math.min(parseFloat(rate), 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">{rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
}
