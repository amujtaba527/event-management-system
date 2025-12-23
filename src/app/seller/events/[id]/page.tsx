'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Printer, Plus, X, User as UserIcon, Loader2 } from 'lucide-react';
import { searchStudent, issueTickets } from '../../actions';
import { useRouter } from 'next/navigation';

export default function IssueTicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const [queryStr, setQueryStr] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [guests, setGuests] = useState<string[]>([]);
    const [newGuest, setNewGuest] = useState('');
    const [loading, setLoading] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const { user } = useUser();
    const router = useRouter();

    // Debounced Search implementation manually
    const handleSearch = useCallback(async (val: string) => {
        setQueryStr(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const { id } = await params;
            const data = await searchStudent(val, parseInt(id));
            setResults(data);
        } finally {
            setLoading(false);
        }
    }, [params]);

    const addGuest = () => {
        if (newGuest.trim()) {
            setGuests([...guests, newGuest.trim()]);
            setNewGuest('');
        }
    };

    const removeGuest = (idx: number) => {
        setGuests(guests.filter((_, i) => i !== idx));
    };

    const handleIssue = async () => {
        if (!selectedStudent || !user) return;
        setIssuing(true);
        try {
            const { id } = await params;
            const ticketIds = await issueTickets(parseInt(id), selectedStudent.id, guests, user.id);

            // Navigate to Print View
            // Passing ticket IDs via query param or storing in local storage? 
            // Query param might be too long. 
            // Plan said: /seller/print/[groupId]. The action returned ticket IDs.
            // I don't have a "Group ID" in DB. I can just pass the first ticket ID or generated a UUID for the transaction.
            // Or just join IDs by comma.
            router.push(`/seller/print/${ticketIds.join(',')}?eid=${id}`);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIssuing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-100px)]">
            {/* Left Panel: Search */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold text-slate-900">1. Find Student</h2>
                <div className="relative">
                    <Input
                        value={queryStr}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search name, ID, or class..."
                        className="text-lg py-6 pl-12"
                        icon={<Search className="w-6 h-6" />}
                        autoFocus
                    />
                    {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {results.map((student) => (
                        <Card
                            key={student.id}
                            onClick={() => !student.has_been_issued && setSelectedStudent(student)}
                            className={`p-4 cursor-pointer transition-all hover:bg-slate-50 border-l-4 ${student.has_been_issued
                                    ? 'border-l-slate-200 opacity-60 cursor-not-allowed'
                                    : selectedStudent?.id === student.id
                                        ? 'border-l-blue-500 bg-blue-50/30'
                                        : 'border-l-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-900">{student.name}</h3>
                                    <p className="text-sm text-slate-500">{student.student_identifier} • {student.class_name}</p>
                                </div>
                                {student.has_been_issued && <Badge variant="secondary">Issued</Badge>}
                            </div>
                        </Card>
                    ))}
                    {results.length === 0 && queryStr.length > 1 && !loading && (
                        <div className="text-center py-8 text-slate-500">No students found</div>
                    )}
                </div>
            </div>

            {/* Right Panel: Cart */}
            <div className="flex flex-col gap-4 border-l border-slate-200 pl-8">
                <h2 className="text-xl font-bold text-slate-900">2. Issue Tickets</h2>

                {selectedStudent ? (
                    <Card className="flex-1 flex flex-col p-6 bg-white outline-1 outline-slate-200 shadow-xl">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {selectedStudent.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h3>
                                    <p className="text-slate-500">{selectedStudent.class_name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" /> Guest Tickets
                                </h4>

                                <div className="flex gap-2">
                                    <Input
                                        value={newGuest}
                                        onChange={(e) => setNewGuest(e.target.value)}
                                        placeholder="Guest Name"
                                        onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                                    />
                                    <Button onClick={addGuest} variant="secondary">Add</Button>
                                </div>

                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {guests.map((g, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium">{g} (Guest)</span>
                                            <button onClick={() => removeGuest(i)} className="text-slate-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {guests.length === 0 && <p className="text-sm text-slate-400 italic">No guests added.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-medium text-slate-600">Total Tickets</span>
                                <span className="text-3xl font-bold text-slate-900">{1 + guests.length}</span>
                            </div>
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg"
                                onClick={handleIssue}
                                isLoading={issuing}
                            >
                                <Printer className="w-6 h-6 mr-2" />
                                Print Tickets
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <Search className="w-12 h-12 mb-4 opacity-50" />
                        <p>Select a student to continue</p>
                    </div>
                )}
            </div>
        </div>
    );
}
