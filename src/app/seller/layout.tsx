'use client';

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, Ticket } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'seller' && user.role !== 'admin'))) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/seller" className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <Ticket className="w-5 h-5" />
                        </div>
                        <span>Ticket Seller Point</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 hidden sm:inline">Logged in as {user.name}</span>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-6">
                {children}
            </main>
        </div>
    );
}
