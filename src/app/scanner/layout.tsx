'use client';

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ScanLine, LogOut } from 'lucide-react';

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'scanner' && user.role !== 'admin'))) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user || (user.role !== 'scanner' && user.role !== 'admin')) return null;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                    <ScanLine className="w-5 h-5 text-green-500" />
                    <span>Scanner</span>
                </div>
                <button onClick={logout} className="text-slate-400 p-2">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 w-full max-w-md mx-auto">
                {children}
            </main>
        </div>
    );
}
