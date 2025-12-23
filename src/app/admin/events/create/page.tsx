'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createEvent } from '../../actions';
import { useState } from 'react';

export default function CreateEventPage() {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [globalError, setGlobalError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setFieldErrors({});
        setGlobalError('');

        try {
            const res = await createEvent(formData);
            if (res && !res.success) {
                if (res.errors) {
                    setFieldErrors(res.errors);
                }
                if (res.message) {
                    setGlobalError(res.message);
                }
                setLoading(false);
            }
            // If success, logic inside server action will redirect. 
            // We don't need to do anything here except maybe ensure loading stays true until redirect happens.
        } catch (e: any) {
            setGlobalError(e.message || 'An unexpected error occurred');
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
            <div>
                <Link href="/admin/events" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Events
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Event</h1>
                <p className="text-slate-500 mt-2">Set up ticket sales and check-in windows.</p>
            </div>

            <Card className="p-8">
                <form action={handleSubmit} className="space-y-6">
                    <Input
                        name="name"
                        label="Event Name"
                        placeholder="e.g. Annual Sports Day 2024"
                        required
                        error={fieldErrors.name}
                    />

                    <Input
                        type="datetime-local"
                        name="event_date"
                        label="Event Date & Time"
                        required
                        error={fieldErrors.event_date}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Sales Window</h3>
                            <Input
                                type="datetime-local"
                                name="ticket_sales_start"
                                label="Sales Start"
                                required
                                error={fieldErrors.ticket_sales_start}
                            />
                            <Input
                                type="datetime-local"
                                name="ticket_sales_end"
                                label="Sales End"
                                required
                                error={fieldErrors.ticket_sales_end}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Check-in Window</h3>
                            <Input
                                type="datetime-local"
                                name="check_in_start"
                                label="Check-in Start"
                                required
                                error={fieldErrors.check_in_start}
                            />
                            <Input
                                type="datetime-local"
                                name="check_in_end"
                                label="Check-in End"
                                required
                                error={fieldErrors.check_in_end}
                            />
                        </div>
                    </div>

                    {globalError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center animate-shake">
                            <span className="mr-2">⚠️</span>
                            {globalError}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                            Create Event
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
