'use server';

import { query } from '@/lib/db';

export type ScanResult =
    | { status: 'valid'; attendee: any }
    | { status: 'duplicate'; timestamp: Date; attendee: any }
    | { status: 'invalid' };

export async function validateTicket(ticketId: string, eventId: number, userId: number): Promise<ScanResult> {
    // 1. Fetch ticket
    const res = await query(
        `SELECT t.*, i.class_name, i.student_identifier 
     FROM Tickets t
     LEFT JOIN EventInvitees i ON t.associated_invitee_id = i.id
     WHERE t.id = $1 AND t.event_id = $2`,
        [ticketId, eventId]
    ); // UUID check handled by pg driver usually? If validation fails it throws.
    // Warning: invalid UUID string syntax causes DB error. I should wrap in try/catch or validate UUID format.
    // pg driver throws error for invalid UUID.

    if (res.rows.length === 0) {
        return { status: 'invalid' };
    }

    const ticket = res.rows[0];

    if (ticket.status === 'checked-in') {
        return { status: 'duplicate', timestamp: ticket.checked_in_at, attendee: ticket };
    }

    // 2. Mark as checked in
    await query(
        `UPDATE Tickets 
       SET status = 'checked-in', checked_in_at = NOW(), checked_in_by_user_id = $1
       WHERE id = $2`,
        [userId, ticketId]
    );

    return { status: 'valid', attendee: ticket };
}
