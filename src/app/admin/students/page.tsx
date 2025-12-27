'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, bulkUploadStudents } from '../actions';
import { useDebounce } from '@/hooks/useDebounce';
import CsvUploader from '@/components/admin/CsvUploader';

export default function StudentsPage() {
    // State
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal State
    const [isaddOpen, setIsAddOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    const debouncedSearch = useDebounce(search, 500);

    // Fetch Data
    async function fetchStudents() {
        setLoading(true);
        try {
            const res = await getStudents(debouncedSearch, page);
            setStudents(res.students);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStudents();
    }, [debouncedSearch, page]);

    // Handlers
    async function handleSubmit(formData: FormData) {
        setFormLoading(true);
        setError('');

        let res;
        if (editingStudent) {
            res = await updateStudent(editingStudent.id, formData);
        } else {
            res = await createStudent(formData);
        }

        if (res.success) {
            setIsAddOpen(false);
            setEditingStudent(null);
            fetchStudents();
        } else {
            setError(res.message || 'Operation failed');
        }
        setFormLoading(false);
    }

    async function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this student?')) {
            const res = await deleteStudent(id);
            if (res.success) {
                fetchStudents();
            } else {
                alert(res.message);
            }
        }
    }

    const openEdit = (student: any) => {
        setEditingStudent(student);
        setIsAddOpen(true);
    };

    const closeRecs = () => {
        setIsAddOpen(false);
        setEditingStudent(null);
        setError('');
    };

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students</h1>
                    <p className="text-slate-500 mt-2">Manage the global student directory.</p>
                </div>
                <div className="flex gap-3">
                    <CsvUploader
                        action={bulkUploadStudents}
                        buttonText="Import CSV"
                        onSuccess={() => { /* maybe show toast? */ }}
                    />
                    <Button onClick={() => setIsAddOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, roll number, or class..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Roll Number</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Loading students...
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-600">{student.roll_number}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline">{student.current_class}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={student.is_active ? 'success' : 'secondary'}>
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(student)}>
                                                    <Pencil className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                                                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                        <span className="text-sm text-slate-500">
                            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} results
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modal */}
            {isaddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeRecs} />
                    <Card className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingStudent ? 'Edit Student' : 'Add New Student'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={closeRecs}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-4">
                            <Input
                                name="roll_number"
                                label="Roll Number / ID"
                                placeholder="e.g. 2024-001"
                                defaultValue={editingStudent?.roll_number}
                                required
                            />
                            <Input
                                name="name"
                                label="Full Name"
                                placeholder="e.g. John Doe"
                                defaultValue={editingStudent?.name}
                                required
                            />
                            <Input
                                name="current_class"
                                label="Class / Grade"
                                placeholder="e.g. 10-A"
                                defaultValue={editingStudent?.current_class}
                                required
                            />

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={closeRecs}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={formLoading}>
                                    {editingStudent ? 'Save Changes' : 'Create Student'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
