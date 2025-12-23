import { Pool } from 'pg';

let pool: Pool;

if (!global.pool) {
    global.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
}
pool = global.pool;

export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
};

export default pool;

// Add type definition for global pool to prevent TS errors
declare global {
    var pool: Pool | undefined;
}
