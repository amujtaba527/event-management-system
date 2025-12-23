'use client';

import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface TicketData {
    id: string;
    attendeeName: string;
    className: string;
    eventName: string;
}

export default function TicketDownloader({ tickets }: { tickets: TicketData[] }) {
    const [loading, setLoading] = useState(false);
    const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
    // We used a dynamic list of refs logic, but simpler is to use IDs
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const generateQRs = async () => {
            const urls: Record<string, string> = {};
            for (const t of tickets) {
                try {
                    urls[t.id] = await QRCode.toDataURL(t.id, { width: 300, margin: 2 });
                } catch (e) {
                    console.error('QR Gen Error', e);
                }
            }
            setQrUrls(urls);
        };
        if (tickets.length > 0) {
            generateQRs();
        }
    }, [tickets]);

    const handleDownload = async () => {
        if (!containerRef.current) return;
        setLoading(true);

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a6'
            });

            const ticketElements = containerRef.current.children;

            for (let i = 0; i < ticketElements.length; i++) {
                const element = ticketElements[i] as HTMLElement;

                // Skip if not a ticket container (safety)
                if (!element.dataset.ticketId) continue;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true
                } as any);

                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            // Filename
            const first = tickets[0];
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Tickets_${first.eventName}_${first.attendeeName}_${timestamp}.pdf`
                .replace(/\s+/g, '_')
                .replace(/[^\w\d_.-]/g, '');

            pdf.save(filename);
        } catch (error) {
            console.error('Failed to generate PDF', error);
        } finally {
            setLoading(false);
        }
    };

    if (!tickets || tickets.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Hidden Ticket Templates for Capture */}
            <div className="fixed left-[-9999px] top-0 overflow-hidden" ref={containerRef}>
                {tickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        data-ticket-id={ticket.id}
                        style={{
                            width: '350px',
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            fontFamily: 'Arial, sans-serif',
                            padding: '24px',
                            borderRadius: '12px',
                            border: '4px solid #0f172a',
                            position: 'relative',
                            boxSizing: 'border-box',
                            marginBottom: '40px' // Spacing just in case
                        }}
                    >
                        {/* Decorative Circles */}
                        <div style={{ position: 'absolute', top: '50%', left: '-16px', marginTop: '-16px', height: '32px', width: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', border: '4px solid #0f172a' }}></div>
                        <div style={{ position: 'absolute', top: '50%', right: '-16px', marginTop: '-16px', height: '32px', width: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', border: '4px solid #0f172a' }}></div>

                        {/* Header */}
                        <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '24px', marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', color: '#64748b' }}>Event Ticket</div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '8px 0 0 0' }}>{ticket.eventName}</h2>
                        </div>

                        {/* Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Attendee Info Box */}
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Attendee</div>
                                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>{ticket.attendeeName}</div>
                                <div style={{ fontSize: '14px', color: '#475569' }}>{ticket.className}</div>
                            </div>

                            {/* QR Code */}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                                {qrUrls[ticket.id] ? (
                                    <img src={qrUrls[ticket.id]} alt="QR" style={{ width: '192px', height: '192px', display: 'block' }} />
                                ) : (
                                    <div style={{ width: '192px', height: '192px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                        Loading...
                                    </div>
                                )}
                            </div>

                            {/* Ticket ID */}
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-block', backgroundColor: '#0f172a', color: '#ffffff', padding: '4px 16px', borderRadius: '9999px', fontSize: '14px', fontFamily: 'monospace' }}>
                                    {ticket.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                            Brick School Event Management System
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={handleDownload} disabled={loading || Object.keys(qrUrls).length < tickets.length} className="w-full" variant="outline">
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4 mr-2" /> Download All ({tickets.length}) Tickets
                    </>
                )}
            </Button>
        </div>
    );
}
