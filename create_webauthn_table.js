const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Andxzon14%23A@db.phoetjhrgtfgxhyzjrpe.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Conectado. Creando tabla webauthn_credentials...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        public_key TEXT NOT NULL,
        counter BIGINT DEFAULT 0,
        transports TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Tabla creada.');

    await client.query(`ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      DROP POLICY IF EXISTS "Solo el dueño accede a sus credenciales" ON public.webauthn_credentials;
      CREATE POLICY "Solo el dueño accede a sus credenciales" ON public.webauthn_credentials
        FOR ALL USING (auth.uid() = user_id);
    `);
    console.log('RLS activado.');

    // También necesitamos una política para el service role (API routes)
    await client.query(`
      DROP POLICY IF EXISTS "Service role full access" ON public.webauthn_credentials;
      CREATE POLICY "Service role full access" ON public.webauthn_credentials
        FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log('Política de servicio creada.');

    console.log('✅ TABLA webauthn_credentials LISTA.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
