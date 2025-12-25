import { query } from '@/lib/db';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

async function getUsers() {
    const result = await query('SELECT * FROM Users ORDER BY id ASC');
    return result.rows;
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                <p className="text-slate-500 mt-2">Manage access and roles for the system.</p>
            </div>

            <UsersClient initialUsers={users} />
        </div>
    );
}
