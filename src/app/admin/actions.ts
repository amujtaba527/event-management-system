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
    const event_startdate = formData.get('event_startdate') as string;
    const event_enddate = formData.get('event_enddate') as string;
    const ticket_sale_start = formData.get('ticket_sales_start') as string;
    const check_in_start = formData.get('check_in_start') as string;

    // Prices
    const student_price = parseFloat(formData.get('student_price') as string) || 0;
    const other_price = parseFloat(formData.get('other_price') as string) || 0;

    const errors: Record<string, string> = {};

    if (!name) errors.name = 'Event name is required';
    if (!event_startdate) errors.event_startdate = 'Start date is required';
    if (!event_enddate) errors.event_enddate = 'End date is required';
    if (!ticket_sale_start) errors.ticket_sales_start = 'Sales start time is required';
    if (!check_in_start) errors.check_in_start = 'Check-in start time is required';
    if (student_price < 0) errors.student_price = 'Price cannot be negative';
    if (other_price < 0) errors.other_price = 'Price cannot be negative';

    if (Object.keys(errors).length > 0) {
        return { success: false, errors, message: 'Please correct the highlighted fields.' };
    }

    const toPKT = (dateStr: string) => new Date(`${dateStr}+05:00`);

    const eventStart = toPKT(event_startdate);
    const eventEnd = toPKT(event_enddate);
    const salesStart = toPKT(ticket_sale_start);
    const checkInStart = toPKT(check_in_start);

    if (eventStart >= eventEnd) {
        return {
            success: false,
            errors: { event_enddate: 'End date must be after start date' } as Record<string, string>,
            message: 'Event end date must be after start date'
        };
    }

    try {
        await query(
            `INSERT INTO Events (name, event_startdate, event_enddate, ticket_sale_start, check_in_start, student_price, other_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [name, eventStart, eventEnd, salesStart, checkInStart, student_price, other_price]
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

    let count = 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(s => s.trim());

        // Safety check for bounds
        if (cols.length < 3) continue;

        const name = cols[nameIdx];
        const studentId = cols[rollIdx]; // This translates to roll_number
        const className = cols[classIdx]; // current_class

        if (studentId && name && className) {
            // Upsert into Students
            await query(
                `INSERT INTO Students (roll_number, name, current_class)
         VALUES ($1, $2, $3)
         ON CONFLICT (roll_number) 
         DO UPDATE SET name = EXCLUDED.name, current_class = EXCLUDED.current_class, is_active = TRUE`,
                [studentId, name, className]
            );
            count++;
        }
    }

    revalidatePath(`/admin/events/${eventId}/attendees`);
    return { success: true, message: `Successfully processed ${count} attendees` };
}

export async function addAttendee(eventId: number, formData: FormData) {
    const name = formData.get('name') as string;
    const studentId = formData.get('student_identifier') as string; // Form still sends student_identifier
    const className = formData.get('class_name') as string;

    if (!name || !studentId || !className) {
        throw new Error('All fields are required');
    }

    try {
        await query(
            `INSERT INTO Students (roll_number, name, current_class)
             VALUES ($1, $2, $3)
             ON CONFLICT (roll_number) 
             DO UPDATE SET name = EXCLUDED.name, current_class = EXCLUDED.current_class, is_active = TRUE`,
            [studentId, name, className]
        );
        revalidatePath(`/admin/events/${eventId}/attendees`);
        return { success: true, message: 'Student added/updated successfully' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to add student' };
    }
}

// Student Management Actions

export async function getStudents(queryStr: string = '', page: number = 1) {
    const limit = 20;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM Students WHERE is_active = TRUE`;
    const params: any[] = [];

    if (queryStr) {
        sql += ` AND (name ILIKE $1 OR roll_number ILIKE $1 OR current_class ILIKE $1)`;
        params.push(`%${queryStr}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    // Total count for pagination
    let countSql = `SELECT COUNT(*) as count FROM Students WHERE is_active = TRUE`;
    if (queryStr) {
        countSql += ` AND (name ILIKE $1 OR roll_number ILIKE $1 OR current_class ILIKE $1)`;
    }

    const [rows, countRes] = await Promise.all([
        query(sql, params),
        query(countSql, params.length > 0 ? params : undefined)
    ]);

    return {
        students: rows.rows,
        total: parseInt(countRes.rows[0].count),
        totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
    };
}

export async function createStudent(formData: FormData) {
    const name = formData.get('name') as string;
    const roll_number = formData.get('roll_number') as string;
    const current_class = formData.get('current_class') as string;

    if (!name || !roll_number || !current_class) {
        return { success: false, message: 'All fields are required' };
    }

    try {
        await query(
            `INSERT INTO Students (roll_number, name, current_class) VALUES ($1, $2, $3)`,
            [roll_number, name, current_class]
        );
        revalidatePath('/admin/students');
        return { success: true, message: 'Student created successfully' };
    } catch (e: any) {
        if (e.code === '23505') {
            return { success: false, message: 'Roll number already exists' };
        }
        return { success: false, message: e.message || 'Failed to create student' };
    }
}

export async function updateStudent(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const roll_number = formData.get('roll_number') as string;
    const current_class = formData.get('current_class') as string;

    if (!name || !roll_number || !current_class) {
        return { success: false, message: 'All fields are required' };
    }

    try {
        await query(
            `UPDATE Students SET name = $1, roll_number = $2, current_class = $3 WHERE id = $4`,
            [name, roll_number, current_class, id]
        );
        revalidatePath('/admin/students');
        return { success: true, message: 'Student updated successfully' };
    } catch (e: any) {
        if (e.code === '23505') {
            return { success: false, message: 'Roll number already exists' };
        }
        return { success: false, message: e.message || 'Failed to update student' };
    }
}

export async function deleteStudent(id: number) {
    try {
        await query(`UPDATE Students SET is_active = FALSE WHERE id = $1`, [id]);
        revalidatePath('/admin/students');
        return { success: true, message: 'Student deleted successfully' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to delete student' };
    }
}
// Event Management Actions

export async function getEvent(id: number) {
    const res = await query(`SELECT * FROM Events WHERE id = $1`, [id]);
    return res.rows[0];
}

export async function updateEvent(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const event_startdate = formData.get('event_startdate') as string;
    const event_enddate = formData.get('event_enddate') as string;
    const ticket_sale_start = formData.get('ticket_sales_start') as string;
    const check_in_start = formData.get('check_in_start') as string;

    // Prices
    const student_price = parseFloat(formData.get('student_price') as string) || 0;
    const other_price = parseFloat(formData.get('other_price') as string) || 0;

    const errors: Record<string, string> = {};

    if (!name) errors.name = 'Event name is required';
    if (!event_startdate) errors.event_startdate = 'Start date is required';
    if (!event_enddate) errors.event_enddate = 'End date is required';
    if (!ticket_sale_start) errors.ticket_sales_start = 'Sales start time is required';
    if (!check_in_start) errors.check_in_start = 'Check-in start time is required';
    if (student_price < 0) errors.student_price = 'Price cannot be negative';
    if (other_price < 0) errors.other_price = 'Price cannot be negative';

    if (Object.keys(errors).length > 0) {
        return { success: false, errors, message: 'Please correct the highlighted fields.' };
    }

    const toPKT = (dateStr: string) => new Date(`${dateStr}+05:00`);

    const eventStart = toPKT(event_startdate);
    const eventEnd = toPKT(event_enddate);
    const salesStart = toPKT(ticket_sale_start);
    const checkInStart = toPKT(check_in_start);

    if (eventStart >= eventEnd) {
        return {
            success: false,
            errors: { event_enddate: 'End date must be after start date' } as Record<string, string>,
            message: 'Event end date must be after start date'
        };
    }

    try {
        await query(
            `UPDATE Events 
             SET name = $1, event_startdate = $2, event_enddate = $3, ticket_sale_start = $4, check_in_start = $5, student_price = $6, other_price = $7
             WHERE id = $8`,
            [name, eventStart, eventEnd, salesStart, checkInStart, student_price, other_price, id]
        );
        revalidatePath('/admin/events');
        return { success: true, message: 'Event updated successfully' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to update event' };
    }
}

export async function bulkUploadStudents(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');

    const text = await file.text();
    const lines = text.split('\n');

    if (lines.length === 0) return { success: false, message: 'File is empty' };

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

    // Default Fallback
    if (nameIdx === -1) nameIdx = 1;
    if (rollIdx === -1) rollIdx = 0;
    if (classIdx === -1) classIdx = 2;

    const startIdx = (header.some(h => h.includes('name') || h.includes('roll') || h.includes('id'))) ? 1 : 0;
    let count = 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(s => s.trim());
        if (cols.length < 3) continue;

        const name = cols[nameIdx];
        const studentId = cols[rollIdx];
        const className = cols[classIdx];

        if (studentId && name && className) {
            await query(
                `INSERT INTO Students (roll_number, name, current_class)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (roll_number) 
                 DO UPDATE SET name = EXCLUDED.name, current_class = EXCLUDED.current_class, is_active = TRUE`,
                [studentId, name, className]
            );
            count++;
        }
    }

    revalidatePath('/admin/students');
    return { success: true, message: `Successfully processed ${count} students` };
}
