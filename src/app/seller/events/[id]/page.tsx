'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Printer, Plus, X, User as UserIcon, Loader2, Check, Download } from 'lucide-react';
import { searchStudent, issueTickets, getStudentTickets } from '../../actions';
import { useRouter } from 'next/navigation';
import TicketDownloader from '@/components/seller/TicketDownloader';

export default function IssueTicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const [queryStr, setQueryStr] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [guests, setGuests] = useState<string[]>([]);
    const [newGuest, setNewGuest] = useState('');
    const [loading, setLoading] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [success, setSuccess] = useState<any>(null);
    const { user } = useUser();
    const router = useRouter();

    // Initial load
    useEffect(() => {
        handleSearch('');
    }, []);

    const handleSearch = useCallback(async (val: string) => {
        setQueryStr(val);
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

    const handleRedownload = async (student: any) => {
        setLoading(true);
        try {
            const tickets = await getStudentTickets(student.id);
            if (tickets && tickets.length > 0) {
                setSuccess({ tickets, message: "Tickets retrieved for redownload." });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleIssue = async () => {
        if (!selectedStudent || !user) return;
        setIssuing(true);
        try {
            const { id } = await params;
            const res = await issueTickets(parseInt(id), selectedStudent.id, guests, user.id);

            if (res.success) {
                // Fetch ALL tickets for this student now (updated list)
                const allTickets = await getStudentTickets(selectedStudent.id);
                setSuccess({
                    ticketIds: res.ticketIds,
                    tickets: allTickets,
                    message: res.message
                });
                // Refresh list
                handleSearch(queryStr);
                setSelectedStudent(null);
                setGuests([]);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIssuing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-100px)]">
            {/* Left Panel: Search & List */}
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
                    {/* Success/Redownload Modal Area (Inline for simplicity or Overlay) */}
                    {success && (
                        <Card className="p-4 mb-4 bg-green-50 border-green-200 animate-slide-up relative">
                            <button onClick={() => setSuccess(null)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex gap-4 items-start">
                                <div className="bg-green-100 p-2 rounded-full text-green-600">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h3 className="font-bold text-green-800">Done!</h3>
                                    {success.message && <p className="text-sm text-green-700">{success.message}</p>}

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {success.ticketIds && success.ticketIds.length > 0 && (
                                            <Button size="sm" onClick={() => router.push(`/seller/print/${success.ticketIds.join(',')}?eid=1`)}>
                                                <Printer className="w-3 h-3 mr-2" /> Print
                                            </Button>
                                        )}
                                        {success.tickets && (
                                            <TicketDownloader tickets={success.tickets} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="text-center py-8 text-slate-500">No students found</div>
                    )}

                    {results.map((student) => (
                        <Card
                            key={student.id}
                            className={`p-4 transition-all hover:bg-slate-50 border-l-4 ${student.has_been_issued
                                ? 'border-l-slate-200 bg-slate-50/50'
                                : selectedStudent?.id === student.id
                                    ? 'border-l-blue-500 bg-blue-50/30'
                                    : 'border-l-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-center bg-transparent">
                                <div
                                    className="cursor-pointer flex-1"
                                    onClick={() => !student.has_been_issued && setSelectedStudent(student)}
                                >
                                    <h3 className="font-bold text-slate-900">{student.name}</h3>
                                    <p className="text-sm text-slate-500">{student.student_identifier} • {student.class_name}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {student.has_been_issued ? (
                                        <>
                                            <Badge variant="secondary">Issued</Badge>
                                            <Button size="sm" variant="outline" onClick={() => handleRedownload(student)} title="Redownload PDF">
                                                <Download className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedStudent(student)} title="Add Guests">
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </>
                                    ) : (
                                        selectedStudent?.id === student.id ? (
                                            <Badge className="bg-blue-100 text-blue-700">Selected</Badge>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(student)}>
                                                Select
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Panel: Issue / Cart */}
            <div className="flex flex-col gap-4 border-l border-slate-200 pl-8">
                <h2 className="text-xl font-bold text-slate-900">2. Issue Tickets</h2>

                {selectedStudent ? (
                    <Card className="flex-1 flex flex-col p-6 bg-white outline-1 outline-slate-200 shadow-xl">
                        <div className="flex-1 relative">
                            <button onClick={() => { setSelectedStudent(null); setGuests([]); }} className="absolute right-0 top-0 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {selectedStudent.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h3>
                                    <p className="text-slate-500">{selectedStudent.class_name}</p>
                                    {selectedStudent.has_been_issued && (
                                        <p className="text-xs text-amber-600 font-medium mt-1 bg-amber-50 px-2 py-0.5 rounded inline-block">
                                            Already Issued (Adding Guests Only)
                                        </p>
                                    )}
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
                                <span className="text-3xl font-bold text-slate-900">
                                    {/* If issuing new student ticket: 1. If only guests: 0 + guests */}
                                    {(selectedStudent.has_been_issued ? 0 : 1) + guests.length}
                                </span>
                            </div>
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg"
                                onClick={handleIssue}
                                isLoading={issuing}
                                disabled={issuing || ((selectedStudent.has_been_issued ? 0 : 1) + guests.length === 0)}
                            >
                                <Printer className="w-6 h-6 mr-2" />
                                {selectedStudent.has_been_issued ? 'Issue Guest Tickets' : 'Issue & Print'}
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
