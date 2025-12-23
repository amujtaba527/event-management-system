import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

async function getActiveSalesEvents() {
    const result = await query(`
    SELECT * FROM Events 
    WHERE NOW() BETWEEN ticket_sales_start AND ticket_sales_end
    ORDER BY ticket_sales_end ASC
  `);
    return result.rows;
}

export default async function SellerDashboard() {
    const events = await getActiveSalesEvents();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center py-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Select Event</h1>
                <p className="text-slate-500 mt-2">Choose an event to start issuing tickets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No Active Events</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            There are currently no events with open ticket sales windows.
                        </p>
                    </div>
                ) : (
                    events.map((event: any) => (
                        <Card key={event.id} className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-blue-500 to-indigo-600" />

                            <div className="p-2 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{event.name}</h3>
                                    <p className="text-sm text-slate-500">
                                        Sales close: {new Date(event.ticket_sales_end).toLocaleDateString()}
                                        <br />
                                        {new Date(event.ticket_sales_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <Link href={`/seller/events/${event.id}`} className="block">
                                    <Button className="w-full justify-between group-hover:shadow-lg transition-all">
                                        Issue Tickets <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
