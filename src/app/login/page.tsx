'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Mail, Lock, AlertCircle, Loader2, Fingerprint } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import { loginAction } from './actions'
import {
  isWebAuthnAvailable,
  hasPlatformAuthenticator,
  hasStoredCredential,
  registerBiometric,
  authenticateWithBiometric,
} from '@/lib/webauthn-service'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [isTurnstileSolved, setIsTurnstileSolved] = useState(!siteKey)

  useEffect(() => {
    async function checkBiometric() {
      const supported = await hasPlatformAuthenticator()
      setBiometricSupported(supported)
      const registered = hasStoredCredential()
      setHasBiometric(supported && registered)
      // Si no tiene biometría registrada, mostrar formulario directamente
      if (!supported || !registered) {
        setShowPasswordForm(true)
      }
    }
    checkBiometric()
  }, [])

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true)
    setError(null)
    try {
      const success = await authenticateWithBiometric()
      if (success) {
        window.location.href = '/'
      } else {
        setError('No se pudo verificar tu identidad. Intenta con contraseña.')
        setShowPasswordForm(true)
      }
    } catch (e: any) {
      setError('Error de biometría. Usa tu contraseña.')
      setShowPasswordForm(true)
    } finally {
      setIsBiometricLoading(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      // Login exitoso — registrar biometría automáticamente si el dispositivo lo soporta
      if (biometricSupported && !hasStoredCredential()) {
        try {
          await registerBiometric()
        } catch {
          // Silencioso: si falla el registro biométrico, no importa
        }
      }
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-background via-surface to-background relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Acceso Seguro</h1>
            <p className="text-sm text-muted mt-1 text-center">
              {hasBiometric && !showPasswordForm
                ? 'Usa tu biometría para acceder rápidamente.'
                : 'Ingresa con tus credenciales para administrar tus envíos.'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 mb-5"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </motion.div>
          )}

          {/* Botón biométrico (aparece primero si está registrado) */}
          {hasBiometric && !showPasswordForm && (
            <div className="space-y-4">
              <button
                onClick={handleBiometricLogin}
                disabled={isBiometricLoading}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-accent to-accent-hover text-white font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-3 text-lg"
              >
                {isBiometricLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-7 h-7" />
                    Acceder con Biometría
                  </>
                )}
              </button>

              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full text-sm text-muted hover:text-foreground transition-colors py-2"
              >
                Usar contraseña en su lugar
              </button>
            </div>
          )}

          {/* Formulario de contraseña */}
          {showPasswordForm && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <form action={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-muted" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="Usuario o ID"
                      className="w-full pl-11 pr-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-muted" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Contraseña"
                      className="w-full pl-11 pr-4 py-3.5 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Widget de Cloudflare */}
                {siteKey ? (
                  <div className="flex justify-center py-2 min-h-[65px]">
                    <Turnstile 
                      siteKey={siteKey} 
                      options={{ theme: 'auto' }} 
                      onSuccess={() => setIsTurnstileSolved(true)}
                      onError={() => setIsTurnstileSolved(false)}
                      onExpire={() => setIsTurnstileSolved(false)}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-center text-amber-500 border border-amber-500/20 bg-amber-500/10 rounded-lg py-2">
                    ⚠️ Modo de desarrollo: Cloudflare Turnstile desactivado.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !isTurnstileSolved}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:active:scale-100 flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando credenciales...
                    </>
                  ) : (
                    'Iniciar Sesión Segura'
                  )}
                </button>
              </form>

              {/* Link para volver a biometría */}
              {hasBiometric && (
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="w-full text-sm text-muted hover:text-foreground transition-colors py-3 mt-2 flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  Volver a biometría
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
