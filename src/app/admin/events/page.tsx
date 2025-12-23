import { query } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { deleteEvent } from '../actions';

async function getEvents() {
    const result = await query('SELECT * FROM Events ORDER BY ticket_sales_start DESC');
    return result.rows;
}

export default async function EventsPage() {
    const events = await getEvents();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Events</h1>
                    <p className="text-slate-500 mt-2">Manage your events and ticket windows.</p>
                </div>
                <Link href="/admin/events/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {events.length === 0 ? (
                    <Card className="p-12 text-center text-slate-500 bg-slate-50/50 dashed-border">
                        <p>No events found. Create your first event to get started.</p>
                    </Card>
                ) : (
                    events.map((event: any) => (
                        <Card key={event.id} className="p-6 transition-all hover:shadow-lg hover:border-slate-300">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-slate-900">{event.name}</h3>
                                        <Badge variant={new Date(event.ticket_sales_end) > new Date() ? 'success' : 'secondary'}>
                                            {new Date(event.ticket_sales_end) > new Date() ? 'Sales Open' : 'Sales Closed'}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600">
                                        <p>Sales: {new Date(event.ticket_sales_start).toLocaleDateString()} - {new Date(event.ticket_sales_end).toLocaleDateString()}</p>
                                        <p>Check-in: {new Date(event.check_in_start).toLocaleDateString()} - {new Date(event.check_in_end).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/events/${event.id}/attendees`}>
                                        <Button variant="outline" size="sm">
                                            <Users className="w-4 h-4 mr-2" />
                                            Attendees
                                        </Button>
                                    </Link>
                                    <form action={async () => {
                                        'use server';
                                        await deleteEvent(event.id);
                                    }}>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
