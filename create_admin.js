const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Andxzon14%23A@db.phoetjhrgtfgxhyzjrpe.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connectado a Supabase. Creando usuario administrador...');

    // 1. Verificar si el usuario ya existe
    const res = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@enviotrack.com'`);
    let userId;

    if (res.rows.length > 0) {
      console.log('El usuario ya existía. Actualizando su contraseña...');
      userId = res.rows[0].id;
      
      // Actualizar password
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = crypt('Andrea90#', gen_salt('bf')),
            email_confirmed_at = NOW()
        WHERE id = $1
      `, [userId]);
      
    } else {
      console.log('Usuario no existe. Insertando en auth.users...');
      
      // Insertar usuario
      const insertUserRes = await client.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
          'admin@enviotrack.com', crypt('Andrea90#', gen_salt('bf')), NOW(),
          '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
        ) RETURNING id;
      `);
      
      userId = insertUserRes.rows[0].id;

      // Insertar identidad
      await client.query(`
        INSERT INTO auth.identities (
          id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, format('{"sub":"%s","email":"%s"}', $1::text, 'admin@enviotrack.com')::jsonb, 
          'email', NOW(), NOW(), NOW()
        );
      `, [userId]);
    }

    console.log('✅ USUARIO ADMINISTRADOR CREADO CON ÉXITO.');
    console.log('Usuario: 1047968778');
    console.log('Contraseña: Andrea90#');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
