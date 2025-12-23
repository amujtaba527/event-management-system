import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Upload, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { uploadAttendees } from '../../../actions';
import CsvUploader from '@/components/admin/CsvUploader';
import DownloadSampleCsv from '@/components/admin/DownloadSampleCsv';
import AddAttendeeModal from '@/components/admin/AddAttendeeModal';

async function getAttendees(eventId: number, search?: string) {
    let sql = 'SELECT * FROM EventInvitees WHERE event_id = $1';
    const params: any[] = [eventId];

    if (search) {
        sql += ' AND (name ILIKE $2 OR student_identifier ILIKE $2)';
        params.push(`%${search}%`);
    }

    sql += ' ORDER BY name ASC LIMIT 100'; // Limit for performance

    const res = await query(sql, params);
    return res.rows;
}

async function getEvent(id: number) {
    const res = await query('SELECT name FROM Events WHERE id = $1', [id]);
    return res.rows[0];
}

export default async function AttendeesPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ q?: string }>
}) {
    const { id } = await params;
    const { q } = await searchParams;
    const eventId = parseInt(id);
    const event = await getEvent(eventId);
    const attendees = await getAttendees(eventId, q);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col gap-4">
                <Link href="/admin/events" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Events
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendees</h1>
                        <p className="text-slate-500 mt-1">Managing list for <span className="font-semibold text-slate-900">{event?.name}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Actions would go here */}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">

                {/* Top Row: Search & Manual Add */}
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <form className="flex-1 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            name="q"
                            placeholder="Search student by name or ID..."
                            defaultValue={q}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                        />
                    </form>

                    <div className="flex items-center gap-2">
                        <AddAttendeeModal eventId={eventId} />
                    </div>
                </div>

                {/* Bottom Row: Import Actions */}
                <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-500 flex-1">
                        <span className="font-medium text-slate-700">Bulk Import:</span> Upload a CSV file with "Student ID, Name, Class" columns.
                    </div>
                    <div className="flex items-center gap-2">
                        <DownloadSampleCsv />
                        <CsvUploader eventId={eventId} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="p-0 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {attendees.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                    No attendees found. Upload a CSV list.
                                </td>
                            </tr>
                        ) : (
                            attendees.map((student: any) => (
                                <tr key={student.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{student.student_identifier}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{student.class_name}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant={student.has_been_issued ? 'success' : 'secondary'}>
                                            {student.has_been_issued ? 'Ticket Issued' : 'Pending'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
