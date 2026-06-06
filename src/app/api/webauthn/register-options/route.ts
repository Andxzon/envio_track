import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const rpID = request.headers.get('host')?.split(':')[0] || 'localhost'

    // Buscar credenciales existentes del usuario
    const { data: existingCreds } = await supabase
      .from('webauthn_credentials')
      .select('id')
      .eq('user_id', user.id)

    const options = await generateRegistrationOptions({
      rpName: 'EnvioTrack',
      rpID,
      userName: user.email || 'admin',
      userDisplayName: 'Administrador',
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Solo sensores del dispositivo (Face ID, Huella)
        userVerification: 'required',
        residentKey: 'preferred',
      },
      excludeCredentials: (existingCreds || []).map(cred => ({
        id: cred.id,
        type: 'public-key',
      })),
    })

    // Guardar el challenge en una cookie para verificarlo después
    const response = NextResponse.json(options)
    response.cookies.set('webauthn-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 300, // 5 minutos
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Error generating registration options:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
