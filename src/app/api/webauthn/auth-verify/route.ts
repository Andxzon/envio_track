import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const challenge = request.cookies.get('webauthn-challenge')?.value

    if (!challenge) {
      return NextResponse.json({ error: 'Desafío expirado' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Buscar la credencial en la base de datos
    const { data: credential, error: credError } = await adminSupabase
      .from('webauthn_credentials')
      .select('*')
      .eq('id', body.id)
      .single()

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credencial no encontrada' }, { status: 404 })
    }

    const rpID = request.headers.get('host')?.split(':')[0] || 'localhost'
    const origin = request.headers.get('origin') || `http://${rpID}:3000`

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: credential.id,
        publicKey: isoBase64URL.toBuffer(credential.public_key),
        counter: credential.counter,
        transports: credential.transports || [],
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verificación biométrica falló' }, { status: 400 })
    }

    // Actualizar el contador para prevenir ataques de replay
    await adminSupabase
      .from('webauthn_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('id', credential.id)

    // Generar un magic link para crear sesión sin contraseña
    const { data: userData } = await adminSupabase.auth.admin.getUserById(credential.user_id)
    if (!userData?.user?.email) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    })

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 })
    }

    // Usar el token para crear una sesión directamente en el servidor
    const supabaseResponse = NextResponse.json({ verified: true })
    supabaseResponse.cookies.delete('webauthn-challenge')

    // Crear el cliente Supabase con cookies del response para establecer sesión
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Verificar el OTP token para establecer la sesión
    const token_hash = linkData.properties?.hashed_token
    if (token_hash) {
      await supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
    }

    return supabaseResponse
  } catch (error: any) {
    console.error('Error verifying authentication:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
