import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient()

    // Buscar TODAS las credenciales registradas (solo hay un usuario)
    const { data: credentials, error } = await adminSupabase
      .from('webauthn_credentials')
      .select('id, transports')

    if (error || !credentials || credentials.length === 0) {
      return NextResponse.json({ error: 'No hay credenciales biométricas registradas' }, { status: 404 })
    }

    const rpID = request.headers.get('host')?.split(':')[0] || 'localhost'

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(cred => ({
        id: cred.id,
        type: 'public-key' as const,
        transports: cred.transports || [],
      })),
      userVerification: 'required',
    })

    // Guardar challenge en cookie
    const response = NextResponse.json(options)
    response.cookies.set('webauthn-challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 300,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Error generating auth options:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
