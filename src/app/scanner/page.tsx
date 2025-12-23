import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';

async function getCheckInEvents() {
    const result = await query(`
    SELECT * FROM Events 
    WHERE NOW() BETWEEN check_in_start AND check_in_end
    ORDER BY check_in_start ASC
  `);
    return result.rows;
}

export default async function ScannerDashboard() {
    const events = await getCheckInEvents();

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Select Event</h1>
                <p className="text-slate-400 text-sm">Tap an event to start scanning.</p>
            </div>

            <div className="space-y-4">
                {events.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        No events active for check-in right now.
                    </div>
                ) : (
                    events.map((event: any) => (
                        <Link key={event.id} href={`/scanner/events/${event.id}`}>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between active:scale-95 transition-transform">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{event.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            Ends: {new Date(event.check_in_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-600" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
