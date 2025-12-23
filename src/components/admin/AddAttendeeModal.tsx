'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserPlus, X } from 'lucide-react';
import { addAttendee } from '../../app/admin/actions';
import { useRouter } from 'next/navigation';

export default function AddAttendeeModal({ eventId }: { eventId: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError('');

        const res = await addAttendee(eventId, formData);

        if (res.success) {
            setIsOpen(false);
            router.refresh();
        } else {
            setError(res.message || 'Failed to add attendee');
        }
        setLoading(false);
    }

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 relative animate-scale-in">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-slate-900 mb-4">Add Start Student</h2>

                <form action={handleSubmit} className="space-y-4">
                    <Input
                        name="student_identifier"
                        label="Student ID / Roll No"
                        placeholder="e.g. 2023-CS-101"
                        required
                        autoFocus
                    />
                    <Input
                        name="name"
                        label="Full Name"
                        placeholder="e.g. Ali Khan"
                        required
                    />
                    <Input
                        name="class_name"
                        label="Class / Section"
                        placeholder="e.g. BSCS-3A"
                        required
                    />

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Add Student
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
