// ============================================================================
// EnvioTrack — Servicio WebAuthn (Cliente)
// ============================================================================
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

const CREDENTIAL_KEY = 'enviotrack-webauthn-registered'

/** Verifica si el navegador soporta WebAuthn (biometría) */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  )
}

/** Verifica si el dispositivo tiene un autenticador de plataforma (Face ID, Huella) */
export async function hasPlatformAuthenticator(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** Verifica si ya hay una credencial registrada en este dispositivo */
export function hasStoredCredential(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CREDENTIAL_KEY) === 'true'
}

/** Marca que este dispositivo tiene credencial registrada */
export function markCredentialRegistered(): void {
  localStorage.setItem(CREDENTIAL_KEY, 'true')
}

/** Elimina la marca de credencial registrada */
export function clearCredentialMark(): void {
  localStorage.removeItem(CREDENTIAL_KEY)
}

/**
 * Registra una nueva credencial biométrica para el usuario actual.
 * Se llama automáticamente después del primer login con contraseña.
 */
export async function registerBiometric(): Promise<boolean> {
  try {
    // 1. Pedir opciones de registro al servidor
    const optionsRes = await fetch('/api/webauthn/register-options', { method: 'POST' })
    if (!optionsRes.ok) return false
    const options = await optionsRes.json()

    // 2. Iniciar registro biométrico (dispara Face ID / Huella)
    const registration = await startRegistration({ optionsJSON: options })

    // 3. Verificar en el servidor
    const verifyRes = await fetch('/api/webauthn/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    })

    if (!verifyRes.ok) return false
    const result = await verifyRes.json()

    if (result.verified) {
      markCredentialRegistered()
      return true
    }

    return false
  } catch (error) {
    console.error('Error registrando biometría:', error)
    return false
  }
}

/**
 * Autentica con biometría (Face ID / Huella).
 * Retorna true si la autenticación fue exitosa y se creó la sesión.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    // 1. Pedir opciones de autenticación al servidor
    const optionsRes = await fetch('/api/webauthn/auth-options', { method: 'POST' })
    if (!optionsRes.ok) return false
    const options = await optionsRes.json()

    // 2. Iniciar autenticación biométrica (dispara Face ID / Huella)
    const authentication = await startAuthentication({ optionsJSON: options })

    // 3. Verificar en el servidor (esto también crea la sesión)
    const verifyRes = await fetch('/api/webauthn/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authentication),
    })

    if (!verifyRes.ok) return false
    const result = await verifyRes.json()

    return result.verified === true
  } catch (error) {
    console.error('Error autenticando con biometría:', error)
    return false
  }
}
