'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Printer, Plus, X, User as UserIcon, Loader2, Check, Download, History } from 'lucide-react';
import { searchStudent, issueTickets, getStudentTickets, issueOutsiderTicket, getEventTickets } from '../../actions';
import { useRouter } from 'next/navigation';
import TicketDownloader from '@/components/seller/TicketDownloader';

export default function IssueTicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const [activeTab, setActiveTab] = useState<'issue' | 'sold'>('issue');

    // Issue Tab State
    const [queryStr, setQueryStr] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [guests, setGuests] = useState<string[]>([]);
    const [newGuest, setNewGuest] = useState('');
    const [loading, setLoading] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [success, setSuccess] = useState<any>(null);
    const [outsiderName, setOutsiderName] = useState('');
    const [isOutsiderOpen, setIsOutsiderOpen] = useState(false);

    // Sold Tab State
    const [soldQuery, setSoldQuery] = useState('');
    const [soldTickets, setSoldTickets] = useState<any[]>([]);
    const [soldLoading, setSoldLoading] = useState(false);

    const { user } = useUser();
    const router = useRouter();

    // -- Issue Tab Logic --
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

    const handleRedownload = async (studentId: number) => {
        setLoading(true);
        try {
            const tickets = await getStudentTickets(studentId);
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
                const allTickets = await getStudentTickets(selectedStudent.id);
                setSuccess({
                    ticketIds: res.ticketIds,
                    tickets: allTickets,
                    message: res.message
                });
                handleSearch(queryStr);
                setSelectedStudent(null);
                setGuests([]);
                fetchSoldTickets(); // Update sold list
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIssuing(false);
        }
    };

    const handleOutsiderIssue = async () => {
        if (!outsiderName || !user) return;
        setIssuing(true);
        try {
            const { id } = await params;
            const res = await issueOutsiderTicket(parseInt(id), outsiderName, user.id);

            if (res.success) {
                setSuccess({
                    ticketIds: res.ticketIds,
                    message: res.message
                });
                setIsOutsiderOpen(false);
                setOutsiderName('');
                fetchSoldTickets(); // Update sold list
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIssuing(false);
        }
    };

    // -- Sold Tab Logic --
    const fetchSoldTickets = useCallback(async (q: string = soldQuery) => {
        setSoldLoading(true);
        try {
            const { id } = await params;
            const data = await getEventTickets(parseInt(id), q);
            setSoldTickets(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSoldLoading(false);
        }
    }, [params, soldQuery]);

    useEffect(() => {
        if (activeTab === 'sold') {
            fetchSoldTickets();
        }
    }, [activeTab]);

    const handleSoldSearch = (val: string) => {
        setSoldQuery(val);
        fetchSoldTickets(val);
    };

    const handleAddGuestsFromHistory = (ticket: any) => {
        if (!ticket.studentId) return;
        setSelectedStudent({
            id: ticket.studentId,
            name: ticket.attendeeName, // Note: attendeeName might have (Guest) if it was a guest ticket, so ideally we use mapped data correctly.
            // But if type is 'student', name is clean.
            student_identifier: ticket.rollNumber,
            class_name: ticket.className,
            has_been_issued: true
        });
        setActiveTab('issue');
        setSuccess(null); // Clear any previous success modal
    };

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-1">
                <button
                    onClick={() => setActiveTab('issue')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'issue'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Issue Tickets
                </button>
                <button
                    onClick={() => setActiveTab('sold')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'sold'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Sold History
                </button>
            </div>

            {/* Content */}
            {activeTab === 'issue' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
                    {/* Left Panel: Search & List */}
                    <div className="flex flex-col gap-4 h-full">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">1. Find Student</h2>
                            <Button variant="outline" size="sm" onClick={() => setIsOutsiderOpen(true)}>
                                <UserIcon className="w-4 h-4 mr-2" />
                                Sell to Outsider
                            </Button>
                        </div>
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

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 pb-4">
                            {/* Success Modal Area */}
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
                                                    <Button size="sm" variant="outline" onClick={() => handleRedownload(student.id)} title="Redownload PDF">
                                                        <Download className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        setSelectedStudent(student);
                                                    }} title="Add Guests">
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
                    <div className="flex flex-col gap-4 border-l border-slate-200 pl-8 h-full">
                        <h2 className="text-xl font-bold text-slate-900">2. Issue Tickets</h2>

                        {selectedStudent ? (
                            <Card className="flex-1 flex flex-col p-6 bg-white outline-1 outline-slate-200 shadow-xl overflow-hidden">
                                <div className="flex-1 relative overflow-hidden flex flex-col">
                                    <button onClick={() => { setSelectedStudent(null); setGuests([]); }} className="absolute right-0 top-0 text-slate-400 hover:text-slate-600">
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 shrink-0">
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

                                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 shrink-0">
                                            <UserIcon className="w-4 h-4" /> Guest Tickets
                                        </h4>

                                        <div className="flex gap-2 shrink-0">
                                            <Input
                                                value={newGuest}
                                                onChange={(e) => setNewGuest(e.target.value)}
                                                placeholder="Guest Name"
                                                onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                                            />
                                            <Button onClick={addGuest} variant="secondary">Add</Button>
                                        </div>

                                        <div className="space-y-2 overflow-y-auto flex-1">
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

                                <div className="mt-6 pt-6 border-t border-slate-100 shrink-0">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-medium text-slate-600">Total Tickets</span>
                                        <span className="text-3xl font-bold text-slate-900">
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
            ) : (
                <div className="flex flex-col gap-4 h-full">
                    {/* Sold Tickets Tab */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Input
                                value={soldQuery}
                                onChange={(e) => handleSoldSearch(e.target.value)}
                                placeholder="Search history..."
                                icon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => fetchSoldTickets()} isLoading={soldLoading}>
                            <History className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Attendee</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Class</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {soldLoading && soldTickets.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr>
                                    ) : soldTickets.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">No sold tickets found.</td></tr>
                                    ) : (
                                        soldTickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{ticket.attendeeName}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={ticket.type === 'student' ? 'default' : ticket.type === 'student_guest' ? 'secondary' : 'outline'}>
                                                        {ticket.type === 'student_guest' ? 'Guest' : ticket.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{ticket.className}</td>
                                                <td className="px-6 py-4 tabular-nums">PKR {ticket.price}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <TicketDownloader tickets={[ticket]} />

                                                        {ticket.type === 'student' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRedownload(ticket.studentId)}
                                                                >
                                                                    Redownload All
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleAddGuestsFromHistory(ticket)}
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" /> Guests
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {isOutsiderOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOutsiderOpen(false)} />
                    <Card className="w-full max-w-sm relative z-10 p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Sell to Outsider</h3>
                            <button onClick={() => setIsOutsiderOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500">Enter the name of the person (non-student) purchasing the ticket.</p>
                        <Input
                            placeholder="Full Name"
                            value={outsiderName}
                            onChange={(e) => setOutsiderName(e.target.value)}
                            autoFocus
                        />
                        <Button
                            className="w-full"
                            onClick={handleOutsiderIssue}
                            isLoading={issuing}
                            disabled={!outsiderName.trim() || issuing}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Generate & Print
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}
