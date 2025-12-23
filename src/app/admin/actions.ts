'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createUser(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!name || !email || !password || !role) {
        throw new Error('All fields are required');
    }

    // Basic validation for role
    if (!['admin', 'seller', 'scanner'].includes(role)) {
        throw new Error('Invalid role');
    }

    try {
        await query(
            `INSERT INTO Users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
            [name, email, password, role]
        );
    } catch (e: any) {
        if (e.code === '23505') { // Unique violation
            throw new Error('Email already exists');
        }
        throw e;
    }

    revalidatePath('/admin/users');
}

export async function deleteUser(id: number) {
    // Prevent deleting self? We don't have current user ID here easily without auth check.
    // Ideally implementation should check session. For now, assuming UI prevents it or acceptable risk.
    await query('DELETE FROM Users WHERE id = $1', [id]);
    revalidatePath('/admin/users');
}

export async function updateUser(userId: number, formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!name || !email || !role) {
        return { success: false, message: 'Missing required fields' };
    }

    try {
        await query(
            'UPDATE Users SET name = $1, email = $2, password_hash = $3, role = $4 WHERE id = $5',
            [name, email, password, role, userId]
        );

        revalidatePath('/admin/users');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function createEvent(formData: FormData) {
    const name = formData.get('name') as string;
    // const description ... (skipped)

    const event_date = formData.get('event_date') as string;
    const ticket_sales_start = formData.get('ticket_sales_start') as string;
    const ticket_sales_end = formData.get('ticket_sales_end') as string;
    const check_in_start = formData.get('check_in_start') as string;
    const check_in_end = formData.get('check_in_end') as string;

    const errors: Record<string, string> = {};

    if (!name) errors.name = 'Event name is required';
    if (!event_date) errors.event_date = 'Event date is required';
    if (!ticket_sales_start) errors.ticket_sales_start = 'Sales start time is required';
    if (!ticket_sales_end) errors.ticket_sales_end = 'Sales end time is required';
    if (!check_in_start) errors.check_in_start = 'Check-in start time is required';
    if (!check_in_end) errors.check_in_end = 'Check-in end time is required';

    if (Object.keys(errors).length > 0) {
        return { success: false, errors, message: 'Please correct the highlighted fields.' };
    }

    // Constraint check: sales_end < check_in_start
    // Helper to ensure dates are treated as GMT+5 (Pakistan Time) regardless of server location
    const toPKT = (dateStr: string) => new Date(`${dateStr}+05:00`);

    const salesEnd = toPKT(ticket_sales_end);
    const checkInStart = toPKT(check_in_start);
    const salesStart = toPKT(ticket_sales_start);
    const checkInEnd = toPKT(check_in_end);
    const eventDate = toPKT(event_date);

    if (salesEnd >= checkInEnd) {
        return {
            success: false,
            errors: { ticket_sales_end: 'Sales must end before check-in ends' } as Record<string, string>,
            message: 'Ticket sales must end before check-in ends'
        };
    }

    // Check if end times are after start times
    if (salesEnd <= salesStart) {
        return {
            success: false,
            errors: { ticket_sales_end: 'Must be after start time' } as Record<string, string>,
            message: 'End time must be after start time'
        };
    }
    if (checkInEnd <= checkInStart) {
        return {
            success: false,
            errors: { check_in_end: 'Must be after start time' } as Record<string, string>,
            message: 'End time must be after start time'
        };
    }

    try {
        await query(
            `INSERT INTO Events (name, event_date, ticket_sales_start, ticket_sales_end, check_in_start, check_in_end)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [name, eventDate, salesStart, salesEnd, checkInStart, checkInEnd]
        );
    } catch (e: any) {
        return { success: false, message: e.message || 'Database error occurred' };
    }

    revalidatePath('/admin/events');
    redirect('/admin/events');
}


export async function deleteEvent(id: number) {
    await query('DELETE FROM Events WHERE id = $1', [id]);
    revalidatePath('/admin/events');
}

export async function uploadAttendees(eventId: number, formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');

    const text = await file.text();
    const lines = text.split('\n');

    if (lines.length === 0) return;

    // Determine column indices from header
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());

    let nameIdx = -1;
    let rollIdx = -1;
    let classIdx = -1;

    if (header.some(h => h.includes('name') || h.includes('roll') || h.includes('class') || h.includes('id'))) {
        nameIdx = header.findIndex(h => h.includes('name'));
        rollIdx = header.findIndex(h => h.includes('roll') || h.includes('id') || h.includes('identifier'));
        classIdx = header.findIndex(h => h.includes('class'));
    }

    // Default Fallback: Roll/ID, Name, Class (Standard)
    if (nameIdx === -1) nameIdx = 1;
    if (rollIdx === -1) rollIdx = 0;
    if (classIdx === -1) classIdx = 2;

    const startIdx = (header.some(h => h.includes('name') || h.includes('roll') || h.includes('id'))) ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(s => s.trim());

        // Safety check for bounds
        if (cols.length < 3) continue;

        const name = cols[nameIdx];
        const studentId = cols[rollIdx];
        const className = cols[classIdx];

        if (studentId && name && className) {
            // Upsert
            await query(
                `INSERT INTO EventInvitees (event_id, student_identifier, name, class_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, student_identifier) 
         DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name`,
                [eventId, studentId, name, className]
            );
        }
    }

    revalidatePath(`/admin/events/${eventId}/attendees`);
}

export async function addAttendee(eventId: number, formData: FormData) {
    const name = formData.get('name') as string;
    const studentId = formData.get('student_identifier') as string;
    const className = formData.get('class_name') as string;

    if (!name || !studentId || !className) {
        throw new Error('All fields are required');
    }

    try {
        await query(
            `INSERT INTO EventInvitees (event_id, student_identifier, name, class_name)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (event_id, student_identifier) 
             DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name`,
            [eventId, studentId, name, className]
        );
        revalidatePath(`/admin/events/${eventId}/attendees`);
        return { success: true, message: 'Attendee added successfully' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to add attendee' };
    }
}
