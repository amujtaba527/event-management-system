'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function searchStudent(queryStr: string, eventId: number) {
    let sqlText = `SELECT 
            s.id, 
            s.name, 
            s.roll_number as student_identifier, 
            s.current_class as class_name,
            EXISTS(SELECT 1 FROM Tickets t WHERE t.student_id = s.id AND t.event_id = $1) as has_been_issued
        FROM Students s
        WHERE s.is_active = TRUE`;

    const params: any[] = [eventId];

    if (queryStr && queryStr.trim().length > 0) {
        sqlText += ` AND (
            s.name ILIKE $2 OR
            s.roll_number ILIKE $2 OR
            s.current_class ILIKE $2
        )`;
        params.push(`%${queryStr}%`);
        sqlText += ` LIMIT 50`;
    } else {
        sqlText += ` ORDER BY s.name ASC LIMIT 100`;
    }

    const res = await query(sqlText, params);
    return res.rows;
}

export async function getStudentTickets(studentId: number) {
    // studentId is the ID in Students table
    const res = await query(
        `SELECT 
            t.id, 
            t.attendee_name,
            t.attendee_type,
            t.attendee_class as class_name,
            e.name as event_name
        FROM Tickets t
        JOIN Events e ON t.event_id = e.id
        WHERE t.student_id = $1`,
        [studentId]
    );

    return res.rows.map((t: any) => ({
        id: t.id,
        // If guest, show Guest Name (Guest). If student, show valid name.
        attendeeName: t.attendee_type === 'student_guest' ? `${t.attendee_name} (Guest)` : t.attendee_name,
        className: t.attendee_type === 'student_guest' ? `Guest Ticket` : t.class_name,
        eventName: t.event_name,
        type: t.attendee_type
    }));
}

export async function getStudentTicket(studentId: number) {
    const tickets = await getStudentTickets(studentId);
    return tickets.length > 0 ? tickets[0] : null; // This logic might need review if student has multiple tickets for different events
    // But currently frontend seems to expect one? The previous code was "getStudentTicket" singular.
    // If a student has tickets for multiple events, this only returns the first one found.
}

export async function issueTickets(eventId: number, studentId: number, guests: string[], userId: number) {
    const ticketIds: string[] = [];

    // 1. Fetch student details for snapshot
    const studentRes = await query(`SELECT name, current_class FROM Students WHERE id = $1`, [studentId]);
    if (studentRes.rows.length === 0) {
        throw new Error('Student not found');
    }
    const student = studentRes.rows[0];

    // 1b. Fetch event pricing
    const eventRes = await query(`SELECT student_price, other_price FROM Events WHERE id = $1`, [eventId]);
    if (eventRes.rows.length === 0) throw new Error('Event not found');
    const { student_price, other_price } = eventRes.rows[0];

    // 2. Check existing student ticket for THIS event
    const existingRes = await query(
        `SELECT id FROM Tickets WHERE student_id = $1 AND event_id = $2 AND attendee_type = 'student'`,
        [studentId, eventId]
    );

    // Issue Student Ticket if not exists
    if (existingRes.rows.length === 0) {
        const res = await query(
            `INSERT INTO Tickets (event_id, student_id, issued_by_user_id, attendee_name, attendee_class, attendee_type, status, price)
             VALUES ($1, $2, $3, $4, $5, 'student', 'issued', $6)
             RETURNING id`,
            [eventId, studentId, userId, student.name, student.current_class, student_price]
        );
        ticketIds.push(res.rows[0].id);
    }

    // 3. Issue tickets for guests
    for (const guest of guests) {
        if (!guest.trim()) continue;
        const res = await query(
            `INSERT INTO Tickets (event_id, student_id, issued_by_user_id, attendee_name, attendee_class, attendee_type, status, price)
             VALUES ($1, $2, $3, $4, $5, 'student_guest', 'issued', $6)
             RETURNING id`,
            [eventId, studentId, userId, guest, student.current_class, other_price] // Associate guest with student and their class
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
export async function issueOutsiderTicket(eventId: number, name: string, userId: number) {
    if (!name || !name.trim()) {
        throw new Error('Name is required for outsider tickets');
    }

    // 1. Fetch event pricing
    const eventRes = await query(`SELECT other_price FROM Events WHERE id = $1`, [eventId]);
    if (eventRes.rows.length === 0) throw new Error('Event not found');
    const { other_price } = eventRes.rows[0];

    // 2. Issue Ticket
    const res = await query(
        `INSERT INTO Tickets (event_id, issued_by_user_id, attendee_name, attendee_class, attendee_type, status, price)
         VALUES ($1, $2, $3, 'Outsider', 'outsider', 'issued', $4)
         RETURNING id`,
        [eventId, userId, name.trim(), other_price]
    );

    revalidatePath(`/seller/events/${eventId}`);

    return {
        success: true,
        ticketIds: [res.rows[0].id],
        message: `Successfully issued guest ticket for ${name}.`
    };
}
export async function getEventTickets(eventId: number, queryStr: string = '') {
    let sqlText = `
        SELECT 
            t.id,
            t.attendee_name,
            t.attendee_type,
            t.attendee_class,
            t.price,
            t.created_at,
            t.student_id,
            s.roll_number,
            e.name as event_name
        FROM Tickets t
        LEFT JOIN Students s ON t.student_id = s.id
        JOIN Events e ON t.event_id = e.id
        WHERE t.event_id = $1
    `;
    const params: any[] = [eventId];

    if (queryStr) {
        sqlText += ` AND (t.attendee_name ILIKE $2 OR t.attendee_class ILIKE $2 OR s.roll_number ILIKE $2)`;
        params.push(`%${queryStr}%`);
    }

    sqlText += ` ORDER BY t.created_at DESC LIMIT 50`;

    const res = await query(sqlText, params);

    return res.rows.map((t: any) => ({
        id: t.id,
        attendeeName: t.attendee_type === 'student_guest' ? `${t.attendee_name} (Guest)` : t.attendee_name,
        className: t.attendee_class,
        eventName: t.event_name,
        type: t.attendee_type,
        price: t.price,
        studentId: t.student_id,
        rollNumber: t.roll_number,
        createdAt: t.created_at
    }));
}
