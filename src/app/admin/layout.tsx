'use client';

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) { // Simple loading state while auth checks
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') return null; // Prevent flash content

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-50">
                <Sidebar className="border-r border-slate-800" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-64 animate-slide-right">
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
                    <span className="font-bold text-slate-900">Admin Portal</span>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>

                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
