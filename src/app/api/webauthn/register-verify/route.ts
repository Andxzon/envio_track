import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const challenge = request.cookies.get('webauthn-challenge')?.value

    if (!challenge) {
      return NextResponse.json({ error: 'Desafío expirado. Intenta de nuevo.' }, { status: 400 })
    }

    const rpID = request.headers.get('host')?.split(':')[0] || 'localhost'
    const origin = request.headers.get('origin') || `http://${rpID}:3000`

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verificación biométrica falló' }, { status: 400 })
    }

    const { credential, credentialDeviceType } = verification.registrationInfo

    // Guardar credencial en Supabase
    const { error: dbError } = await supabase
      .from('webauthn_credentials')
      .upsert({
        id: credential.id,
        user_id: user.id,
        public_key: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter,
        transports: body.response?.transports || [],
      })

    if (dbError) {
      console.error('Error guardando credencial:', dbError)
      return NextResponse.json({ error: 'Error guardando la credencial biométrica' }, { status: 500 })
    }

    // Limpiar cookie del challenge
    const response = NextResponse.json({ verified: true })
    response.cookies.delete('webauthn-challenge')

    return response
  } catch (error: any) {
    console.error('Error verifying registration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
