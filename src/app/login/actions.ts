'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!email || !password) {
    return { error: 'Por favor completa todos los campos' }
  }

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Manejar errores comunes
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Correo o contraseña incorrectos' }
    }
    return { error: error.message }
  }

  // Redirigir al inicio después de loguear
  redirect('/')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
