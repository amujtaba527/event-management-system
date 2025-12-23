'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Trash2, UserPlus, Shield, User, ScanLine, Edit, Save, X, Eye, EyeOff } from 'lucide-react';
import { createUser, deleteUser, updateUser } from '../actions';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    password_hash: string;
}

export default function UsersClient({ initialUsers }: { initialUsers: UserData[] }) {
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

    const togglePassword = (id: number) => {
        const newSet = new Set(visiblePasswords);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setVisiblePasswords(newSet);
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deletingUser) return;
        await deleteUser(deletingUser.id);
        setDeletingUser(null);
    };

    const cancelEdit = () => {
        setEditingUser(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete User?</h3>
                        <p className="text-slate-500 text-center mb-6 text-sm">
                            Are you sure you want to delete <span className="font-bold text-slate-900">{deletingUser.name}</span>?
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={() => setDeletingUser(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={confirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit User Form */}
            <div className="lg:col-span-1">
                <Card className="p-6 sticky top-8 transition-all duration-300 border-l-4 border-l-slate-900">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        {editingUser ? <Edit className="w-5 h-5 text-indigo-600" /> : <UserPlus className="w-5 h-5 text-indigo-600" />}
                        {editingUser ? 'Edit User' : 'Add New User'}
                    </h3>

                    <form action={async (formData) => {
                        if (editingUser) {
                            await updateUser(editingUser.id, formData);
                            setEditingUser(null);
                        } else {
                            await createUser(formData);
                            // Form reset happens automatically on server action revalidate usually, 
                            // but manual reset might be needed for controlled inputs if we had them.
                            // Since we use key/defaultValue, we can reset by changing a key if needed, or rely on browser.
                            // For simplicty with Uncontrolled inputs, we might want to clear the form.
                            // But standard actions revalidate the page.
                            const form = document.querySelector('form') as HTMLFormElement;
                            form?.reset();
                        }
                    }} className="space-y-4" key={editingUser ? editingUser.id : 'new'}>
                        <Input
                            name="name"
                            label="Full Name"
                            placeholder="e.g. John Doe"
                            required
                            defaultValue={editingUser?.name || ''}
                        />
                        <Input
                            name="email"
                            type="email"
                            label="Email Address"
                            placeholder="john@brick.school"
                            required
                            defaultValue={editingUser?.email || ''}
                        />
                        <Input
                            name="password"
                            type="text"
                            label={editingUser ? "Password (leave plain to keep)" : "Password"}
                            placeholder={editingUser ? "••••••••" : "••••••••"}
                            required={!editingUser} // Only required on create
                            defaultValue={editingUser ? editingUser.password_hash : ''}
                        />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 ml-1">Role</label>
                            <select
                                name="role"
                                className="w-full h-11 rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                required
                                defaultValue={editingUser?.role || 'scanner'}
                            >
                                <option value="admin">Admin</option>
                                <option value="seller">Seller</option>
                                <option value="scanner">Scanner</option>
                            </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1">
                                {editingUser ? <><Save className="w-4 h-4 mr-2" /> Update User</> : 'Create User'}
                            </Button>
                            {editingUser && (
                                <Button type="button" variant="ghost" onClick={cancelEdit}>
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>
            </div>

            {/* Users List */}
            <div className="lg:col-span-2 space-y-4">
                {initialUsers.map((user) => (
                    <div key={user.id} className={`group flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${editingUser?.id === user.id ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : ''}`}>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                        ${user.role === 'admin' ? 'bg-slate-900' :
                                    user.role === 'seller' ? 'bg-indigo-600' : 'bg-green-600'
                                }`}
                            >
                                {user.role === 'admin' && <Shield className="w-5 h-5" />}
                                {user.role === 'seller' && <User className="w-5 h-5" />}
                                {user.role === 'scanner' && <ScanLine className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{user.name}</h4>
                                <p className="text-sm text-slate-500">{user.email}</p>
                                <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                                    <span className="font-mono select-none">
                                        {visiblePasswords.has(user.id) ? user.password_hash : '••••••••'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => togglePassword(user.id)}
                                        className="hover:text-slate-600 focus:outline-none"
                                    >
                                        {visiblePasswords.has(user.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                            <Badge variant={
                                user.role === 'admin' ? 'default' :
                                    user.role === 'seller' ? 'secondary' : 'success'
                            } className="capitalize">
                                {user.role}
                            </Badge>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => handleEdit(user)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => setDeletingUser(user)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
