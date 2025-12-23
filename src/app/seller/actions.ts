'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function searchStudent(queryStr: string, eventId: number) {
    let sqlText = `SELECT 
            i.id, 
            i.name, 
            i.student_identifier, 
            i.class_name,
            i.has_been_issued
        FROM EventInvitees i
        WHERE i.event_id = $1`;

    const params: any[] = [eventId];

    if (queryStr && queryStr.trim().length > 0) {
        sqlText += ` AND (
            i.name ILIKE $2 OR
            i.student_identifier ILIKE $2 OR
            i.class_name ILIKE $2
        )`;
        params.push(`%${queryStr}%`);
        sqlText += ` LIMIT 50`;
    } else {
        sqlText += ` ORDER BY i.name ASC LIMIT 100`;
    }

    const res = await query(sqlText, params);
    return res.rows;
}

export async function getStudentTickets(inviteeId: number) {
    // inviteeId is the student's ID in EventInvitees
    const res = await query(
        `SELECT 
            t.id, 
            t.attendee_name,
            t.attendee_type,
            i.class_name,
            e.name as event_name
        FROM Tickets t
        JOIN EventInvitees i ON t.associated_invitee_id = i.id
        JOIN Events e ON t.event_id = e.id
        WHERE t.associated_invitee_id = $1`,
        [inviteeId]
    );

    return res.rows.map((t: any) => ({
        id: t.id,
        // If guest, show Guest Name (Guest). If student, show valid name.
        attendeeName: t.attendee_type === 'guest' ? `${t.attendee_name} (Guest)` : t.attendee_name,
        className: t.attendee_type === 'guest' ? `Guest Ticket` : t.class_name,
        eventName: t.event_name
    }));
}

export async function getStudentTicket(inviteeId: number) {
    const tickets = await getStudentTickets(inviteeId);
    return tickets.length > 0 ? tickets[0] : null;
}

export async function issueTickets(eventId: number, studentId: number, guests: string[], userId: number) {
    const ticketIds: string[] = [];

    // Check existing student ticket
    // attendee_type = 'student' ensures we check for the student's own ticket
    const existingRes = await query(
        `SELECT id FROM Tickets WHERE associated_invitee_id = $1 AND attendee_type = 'student'`,
        [studentId]
    );

    if (existingRes.rows.length === 0) {
        // Fetch student name for the ticket record
        const studentRes = await query(`SELECT name FROM EventInvitees WHERE id = $1`, [studentId]);
        const studentName = studentRes.rows[0]?.name || 'Unknown';

        // Mark as issued in EventInvitees
        await query(`UPDATE EventInvitees SET has_been_issued = TRUE WHERE id = $1`, [studentId]);

        const res = await query(
            `INSERT INTO Tickets (event_id, associated_invitee_id, issued_by_user_id, attendee_name, attendee_type, status)
             VALUES ($1, $2, $3, $4, 'student', 'issued')
             RETURNING id`,
            [eventId, studentId, userId, studentName]
        );
        ticketIds.push(res.rows[0].id);
    }

    // Issue tickets for guests
    for (const guest of guests) {
        if (!guest.trim()) continue;
        const res = await query(
            `INSERT INTO Tickets (event_id, associated_invitee_id, issued_by_user_id, attendee_name, attendee_type, status)
             VALUES ($1, $2, $3, $4, 'guest', 'issued')
             RETURNING id`,
            [eventId, studentId, userId, guest]
        );
        ticketIds.push(res.rows[0].id);
    }

    revalidatePath(`/seller/events/${eventId}`);

    return {
        success: true,
        ticketIds,
        message: `Successfully issued ${ticketIds.length} tickets.`
    };
}
