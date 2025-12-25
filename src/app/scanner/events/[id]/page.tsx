'use client';

import { useState, useCallback } from 'react';
import { QrScanner } from '@/components/scanner/QrScanner';
import { validateTicket, ScanResult } from '../../actions';
import { useUser } from '@/context/UserContext';
import { CheckCircle, AlertTriangle, XCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
    const [lastScan, setLastScan] = useState<ScanResult | null>(null);
    const [history, setHistory] = useState<{ name: string, time: string, status: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { user } = useUser();

    const handleScan = useCallback(async (ticketId: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Play beep
        // const audio = new Audio('/beep.mp3'); audio.play().catch(() => {});

        try {
            const { id } = await params;
            if (!user) return; // Should cause redirect via layout but safely handle type

            const result: ScanResult = await validateTicket(ticketId, parseInt(id), user.id);

            setLastScan(result);

            // Add to history if valid or duplicate (known attendee)
            if (result.status === 'valid' || result.status === 'duplicate') {
                setHistory(prev => [
                    {
                        name: result.attendee.attendee_name,
                        time: new Date().toLocaleTimeString(),
                        status: result.status
                    },
                    ...prev.slice(0, 4)
                ]);
            }

            // Auto clear valid after 2.5s
            if (result.status === 'valid') {
                setTimeout(() => {
                    setLastScan(null);
                    setIsProcessing(false);
                }, 2500);
            } else {
                // Errors require manual dismiss
            }

        } catch (e) {
            console.error(e);
            setLastScan({ status: 'invalid' }); // Probably invalid UUID
        }
    }, [params, user, isProcessing]);

    const dismissOverlay = () => {
        setLastScan(null);
        setIsProcessing(false);
    };

    return (
        <div className="h-[calc(100vh-60px)] flex flex-col relative">
            {/* Top 50%: Camera */}
            <div className="flex-1 bg-black relative">
                <QrScanner onScan={handleScan} isPaused={isProcessing} />
            </div>

            {/* Bottom 50%: History */}
            <div className="flex-1 bg-slate-900 p-4 overflow-y-auto">
                <h3 className="text-slate-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent Scans
                </h3>
                <div className="space-y-3">
                    {history.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="text-white font-medium">{item.name}</div>
                            <div className="text-right">
                                <div className={cn("text-xs font-bold uppercase", item.status === 'valid' ? "text-green-400" : "text-red-400")}>
                                    {item.status}
                                </div>
                                <div className="text-xs text-slate-500">{item.time}</div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="text-slate-600 text-center py-8">No scans yet</div>}
                </div>
            </div>

            {/* Overlays */}
            {lastScan && (
                <div
                    className={cn(
                        "absolute inset-0 z-50 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-200",
                        lastScan.status === 'valid' && "bg-green-600",
                        lastScan.status === 'duplicate' && "bg-red-600",
                        lastScan.status === 'invalid' && "bg-slate-800"
                    )}
                    onClick={() => lastScan.status !== 'valid' && dismissOverlay()}
                >
                    {lastScan.status === 'valid' && (
                        <>
                            <CheckCircle className="w-32 h-32 text-white mb-4 animate-bounce" />
                            <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">VALID</h1>
                            <div className="text-2xl text-white font-medium text-center">
                                {lastScan.attendee.attendee_name}
                            </div>
                            <div className="text-white/80 mt-2">
                                {lastScan.attendee.attendee_type} • {lastScan.attendee.class_name || 'Guest'}
                            </div>
                        </>
                    )}

                    {lastScan.status === 'duplicate' && (
                        <>
                            <AlertTriangle className="w-32 h-32 text-white mb-4 animate-pulse" />
                            <h1 className="text-4xl font-black text-white mb-2 text-center leading-tight">ALREADY USED</h1>
                            <div className="bg-black/20 p-4 rounded-lg text-center backdrop-blur-sm">
                                <p className="text-white/80 text-sm">Scanned previously at:</p>
                                <p className="text-2xl font-mono text-white mt-1">
                                    {new Date(lastScan.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="mt-8 text-white/60 text-sm uppercase tracking-widest animate-pulse">Tap to dismiss</div>
                        </>
                    )}

                    {lastScan.status === 'invalid' && (
                        <>
                            <XCircle className="w-32 h-32 text-red-500 mb-4" />
                            <h1 className="text-4xl font-black text-white mb-4">INVALID TICKET</h1>
                            <div className="mt-8 text-white/60 text-sm uppercase tracking-widest">Tap to dismiss</div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
