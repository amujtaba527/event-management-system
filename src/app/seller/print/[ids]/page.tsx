import { query } from '@/lib/db';
import QRCode from 'qrcode';
import { Ticket } from 'lucide-react';
import { redirect } from 'next/navigation';

async function getTickets(idsString: string) {
    // Decode URL-encoded characters (like %2C for comma)
    const decodedIds = decodeURIComponent(idsString);
    // Split by comma to get individual UUIDs
    const ids = decodedIds.split(',').map(id => id.trim()).filter(Boolean);

    if (ids.length === 0) return [];

    const result = await query(
        `SELECT 
            t.id,
            e.name as event_name,
            ei.name as attendee_name,
            ei.class_name,
            t.created_at
         FROM Tickets t
         JOIN Events e ON t.event_id = e.id
         JOIN EventInvitees ei ON t.associated_invitee_id = ei.id
         WHERE t.id = ANY($1)`,
        [ids]
    );
    return result.rows;
}

export default async function PrintPage({ params }: { params: Promise<{ ids: string }> }) {
    const { ids } = await params;
    const tickets = await getTickets(ids);

    if (tickets.length === 0) {
        return <div>No tickets found</div>;
    }

    // Generate QRs
    const ticketsWithQr = await Promise.all(tickets.map(async (t: any) => ({
        ...t,
        qrDataUrl: await QRCode.toDataURL(t.id)
    })));

    return (
        <div className="bg-white min-h-screen text-black">
            <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

            {/* Auto-print script */}
            <script dangerouslySetInnerHTML={{ __html: 'window.onload = function() { window.print(); }' }} />

            <div className="p-8 max-w-3xl mx-auto space-y-8 print:p-0 print:max-w-none print:mx-0">
                {ticketsWithQr.map((t: any) => (
                    <div
                        key={t.id}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center text-center break-after-page print:border-none print:break-inside-avoid"
                        style={{ pageBreakAfter: 'always' }}
                    >
                        <h1 className="text-3xl font-bold mb-2 uppercase tracking-widest">{t.event_name}</h1>
                        <div className="text-xl font-medium mb-8 text-slate-600">OFFICIAL TICKET</div>

                        <img src={t.qrDataUrl} alt="QR Code" className="w-64 h-64 mb-6" />

                        <div className="text-2xl font-bold mb-2">{t.attendee_name}</div>
                        <div className="text-lg uppercase tracking-wide bg-black text-white px-4 py-1 rounded-full mb-8">
                            {t.attendee_type}
                        </div>

                        <div className="text-xs font-mono text-slate-400 mt-auto">
                            ID: {t.id} <br />
                            ISSUED: {new Date().toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
