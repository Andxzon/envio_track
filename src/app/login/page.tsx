'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'
import { loginAction } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [isTurnstileSolved, setIsTurnstileSolved] = useState(!siteKey)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
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
            <p className="text-sm text-muted mt-1 text-center">Ingresa con tus credenciales para administrar tus envíos.</p>
          </div>

          <form action={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </motion.div>
            )}

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
        </div>
      </motion.div>
    </div>
  )
}
