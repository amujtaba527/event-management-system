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

export default function TicketDownloader({ ticket }: { ticket: TicketData }) {
    const [loading, setLoading] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const ticketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate QR Code URL
        QRCode.toDataURL(ticket.id, { width: 300, margin: 2 }, (err, url) => {
            if (!err) setQrUrl(url);
        });
    }, [ticket.id]);

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setLoading(true);

        try {
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2, // Higher resolution
                backgroundColor: '#ffffff',
                useCORS: true
            } as any);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a6' // Postcard size is good for tickets
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Filename: EventName_HolderName_Class.pdf
            const filename = `${ticket.eventName}_${ticket.attendeeName}_${ticket.className}.pdf`
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .replace(/[^\w\d_.-]/g, ''); // Remove special chars

            pdf.save(filename);
        } catch (error) {
            console.error('Failed to generate PDF', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Hidden Ticket Template for render */}
            <div className="absolute top-[-9999px] left-[-9999px]">
                <div
                    ref={ticketRef}
                    className="w-[400px] bg-white p-8 border-4 border-slate-900 font-sans flex flex-col items-center text-center space-y-6"
                >
                    <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Official Entry Ticket</div>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">{ticket.eventName}</h1>
                    </div>

                    <div className="w-full border-t-2 border-dashed border-slate-300 my-4" />

                    <div className="space-y-4 w-full">
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-semibold">Attendee</div>
                            <div className="text-2xl font-bold text-slate-900">{ticket.attendeeName}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 uppercase font-semibold">Class / Section</div>
                            <div className="text-xl font-mono text-slate-700">{ticket.className}</div>
                        </div>
                    </div>

                    <div className="w-full border-t-2 border-dashed border-slate-300 my-4" />

                    {qrUrl && (
                        <div className="bg-white p-2 border-2 border-slate-900 rounded-xl">
                            <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                        </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono pt-4">
                        TID: {ticket.id}
                    </div>
                </div>
            </div>

            <Button onClick={handleDownload} disabled={loading} size="lg" className="w-full bg-slate-900 text-white hover:bg-slate-800">
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Download Ticket PDF
            </Button>
        </div>
    );
}
