const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Andxzon14%23A@db.phoetjhrgtfgxhyzjrpe.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS reportes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log('Table "reportes" created successfully.');

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

createTable();
