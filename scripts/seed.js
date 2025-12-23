const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        const schemaPath = path.join(__dirname, '../src/lib/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema.sql...');
        await pool.query(schemaSql);
        console.log('Database seeded successfully.');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await pool.end();
    }
}

seed();
