import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Unsafe plain text password check as requested
        const result = await query(
            'SELECT id, name, email, role FROM Users WHERE email = $1 AND password_hash = $2',
            [email, password]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.rows[0];
        return NextResponse.json({ user });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
