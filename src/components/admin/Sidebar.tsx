'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, Users, BarChart3, LogOut, Ticket, ScanLine, ExternalLink } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const items = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Events', icon: Calendar, href: '/admin/events' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
];

const portals = [
    { label: 'Seller Portal', icon: Ticket, href: '/seller' },
    { label: 'Scanner Portal', icon: ScanLine, href: '/scanner' },
];

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { logout } = useUser();

    return (
        <div className={cn("flex flex-col h-full bg-slate-900 text-white w-64", className)}>
            <div className="p-6">
                <h2 className="text-xl font-bold tracking-tight">Brick School</h2>
                <p className="text-xs text-slate-400 mt-1">Admin Portal</p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="pt-6 mt-6 border-t border-slate-800">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Portals
                    </p>
                    {portals.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors group"
                        >
                            <item.icon className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                            {item.label}
                            <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/50 w-full transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
