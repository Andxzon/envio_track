'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!username || !password) {
    return { error: 'Por favor completa todos los campos' }
  }

  // Supabase requiere un formato de correo válido. 
  // Algunos validadores rechazan correos que empiezan solo con números.
  const email = username === '1047968778' ? 'admin@enviotrack.com' : `user_${username}@enviotrack.com`

  if (secretKey) {
    // Si tenemos clave secreta, validamos Turnstile (protección antibots)
    if (!turnstileToken) {
      return { error: 'Verificación de seguridad fallida. Por favor, resuelve el desafío.' }
    }

    const verifyFormData = new FormData()
    verifyFormData.append('secret', secretKey)
    verifyFormData.append('response', turnstileToken)

    try {
      const cfResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        body: verifyFormData,
        method: 'POST',
      })
      
      const outcome = await cfResult.json()
      if (!outcome.success) {
        return { error: 'No pudimos verificar que eres un humano. Intenta de nuevo.' }
      }
    } catch (err) {
      return { error: 'Error de conexión con el servidor de seguridad.' }
    }
  }

  // 2. Intento de inicio de sesión con Supabase Auth
  const supabase = await createClient()

  // Lógica de auto-inicialización para el administrador solicitado
  if (username === '1047968778' && password === 'Andrea90#') {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Si falla, es porque no existe. Lo creamos (Supabase lo hasheará y guardará seguro).
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signUpError) {
        return { error: 'No se pudo inicializar el administrador en la base de datos: ' + signUpError.message }
      }
      
      // Intentamos login una vez más ahora que ya está creado
      await supabase.auth.signInWithPassword({ email, password })
    }
  } else {
    // Para cualquier otra persona (o intentos incorrectos)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Usuario o contraseña incorrectos' }
      }
      return { error: error.message }
    }
  }

  // Redirigir al inicio después de loguear
  redirect('/')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
