'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function searchStudent(queryStr: string, eventId: number) {
    if (!queryStr) return [];
    const res = await query(
        `SELECT * FROM EventInvitees 
     WHERE event_id = $1 
     AND (name ILIKE $2 OR student_identifier ILIKE $2 OR class_name ILIKE $2)
     LIMIT 10`,
        [eventId, `%${queryStr}%`]
    );
    return res.rows;
}

export async function issueTickets(eventId: number, studentId: number, guestNames: string[], issuedByUserId: number) {
    // Check if student already has a ticket
    const studentCheck = await query(
        'SELECT has_been_issued, name FROM EventInvitees WHERE id = $1',
        [studentId]
    );

    if (studentCheck.rows.length === 0) throw new Error('Student not found');
    if (studentCheck.rows[0].has_been_issued) throw new Error('Tickets already issued for this student');

    // Start transaction (simplified)
    try {
        await query('BEGIN');

        // 1. Mark student as issued
        await query('UPDATE EventInvitees SET has_been_issued = TRUE WHERE id = $1', [studentId]);

        // 2. Create Ticket for Student
        const studentName = studentCheck.rows[0].name;
        const studentTicketRes = await query(
            `INSERT INTO Tickets (event_id, associated_invitee_id, issued_by_user_id, attendee_name, attendee_type, status)
         VALUES ($1, $2, $3, $4, 'student', 'issued') RETURNING id`,
            [eventId, studentId, issuedByUserId, studentName]
        );

        const ticketIds = [studentTicketRes.rows[0].id];

        // 3. Create Tickets for Guests
        for (const guestName of guestNames) {
            if (!guestName.trim()) continue;
            const guestTicketRes = await query(
                `INSERT INTO Tickets (event_id, associated_invitee_id, issued_by_user_id, attendee_name, attendee_type, status)
             VALUES ($1, $2, $3, $4, 'guest', 'issued') RETURNING id`,
                [eventId, studentId, issuedByUserId, guestName]
            );
            ticketIds.push(guestTicketRes.rows[0].id);
        }

        await query('COMMIT');
        return ticketIds; // Return IDs to print
    } catch (e) {
        await query('ROLLBACK');
        throw e;
    }
}
