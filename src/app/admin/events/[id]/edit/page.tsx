import { getEvent, updateEvent } from '../../../actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEvent(parseInt(id));

    if (!event) {
        redirect('/admin/events');
    }

    async function handleSubmit(formData: FormData) {
        'use server';
        await updateEvent(event.id, formData);
        redirect('/admin/events');
    }

    // Helper to format date for input[type="datetime-local"]
    // PostgreSQL timestamp is ISO-like but might lack T or have offset
    // Simplest: use toISOString().slice(0, 16) but need to account for timezone if specific.
    // For now assuming existing values are compatible or standard Date object.
    const toInputVal = (date: Date) => {
        if (!date) return '';
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // Adjust to local
        return d.toISOString().slice(0, 16);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/events">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Event</h1>
                    <p className="text-slate-500 mt-1">Update details for {event.name}</p>
                </div>
            </div>

            <Card className="p-8">
                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Event Details</h3>
                        <Input
                            name="name"
                            label="Event Name"
                            defaultValue={event.name}
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="datetime-local"
                                name="event_startdate"
                                label="Event Start"
                                defaultValue={toInputVal(event.event_startdate)}
                                required
                            />
                            <Input
                                type="datetime-local"
                                name="event_enddate"
                                label="Event End"
                                defaultValue={toInputVal(event.event_enddate)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Ticket Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="number"
                                name="student_price"
                                label="Student Price (PKR)"
                                defaultValue={event.student_price?.toString() || '0'}
                                min="0"
                            />
                            <Input
                                type="number"
                                name="other_price"
                                label="Guest/Outsider Price (PKR)"
                                defaultValue={event.other_price?.toString() || '0'}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Control Windows</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                type="datetime-local"
                                name="ticket_sales_start"
                                label="Ticket Sales Start"
                                defaultValue={toInputVal(event.ticket_sale_start)}
                                required
                            />
                            <Input
                                type="datetime-local"
                                name="check_in_start"
                                label="Check-in Start"
                                defaultValue={toInputVal(event.check_in_start)}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Link href="/admin/events">
                            <Button variant="ghost" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
