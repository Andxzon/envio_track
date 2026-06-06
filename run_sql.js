const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Andxzon14%23A@db.phoetjhrgtfgxhyzjrpe.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    console.log('Connected to Supabase! Running SQL...');
    
    // 0. Vaciar tabla para evitar errores de null
    await client.query('TRUNCATE TABLE public.clientes CASCADE;');
    console.log('Table truncated.');
    
    // 1. Añadimos la columna user_id si no existe
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='user_id') THEN
          ALTER TABLE public.clientes ADD COLUMN user_id UUID DEFAULT auth.uid() NOT NULL;
        END IF;
      END
      $$;
    `);
    console.log('Column user_id ensured.');
    
    // 2. Creamos la llave foránea
    await client.query(`
      ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS fk_user;
      
      ALTER TABLE public.clientes 
      ADD CONSTRAINT fk_user 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) ON DELETE CASCADE;
    `);
    console.log('Foreign key fk_user ensured.');
    
    // 3. Limpiamos políticas viejas
    await client.query(`
      DROP POLICY IF EXISTS "Permitir todo temporalmente" ON public.clientes;
      DROP POLICY IF EXISTS "Dueños absolutos de sus datos" ON public.clientes;
    `);
    
    // 4. Activamos RLS y creamos la política de dueño
    await client.query(`
      ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Dueños absolutos de sus datos" ON public.clientes
      FOR ALL USING (auth.uid() = user_id);
    `);
    console.log('RLS policies established.');

    console.log('¡SQL EXECUTED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
