'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { hasStoredCredential } from '@/lib/webauthn-service';

export function BiometricEnforcer() {
  const pathname = usePathname();
  const router = useRouter();
  const { biometricInterval } = useAppStore();

  useEffect(() => {
    // Si estamos en la página de login, actualizar el temporizador de verificación
    if (pathname === '/login') {
      sessionStorage.setItem('last_biometric_verification', Date.now().toString());
      return;
    }

    // Si el usuario eligió "nunca" o no tiene biometría configurada, no hacer nada
    if (biometricInterval === 'never') return;
    if (!hasStoredCredential()) return;

    const checkVerification = () => {
      // Ignorar si estamos en login
      if (window.location.pathname === '/login') return;

      const lastVerifiedStr = sessionStorage.getItem('last_biometric_verification');
      const lastVerified = lastVerifiedStr ? parseInt(lastVerifiedStr, 10) : 0;
      const now = Date.now();
      const elapsedMinutes = (now - lastVerified) / 1000 / 60;

      let shouldVerify = false;

      if (biometricInterval === 'always') {
        // En 'always', si ha pasado más de 10 segundos desde la última vez (para evitar loops)
        // requerimos verificación si la app se fue al background
        shouldVerify = (now - lastVerified) > 10000;
      } else if (biometricInterval === '5min') {
        shouldVerify = elapsedMinutes >= 5;
      } else if (biometricInterval === '10min') {
        shouldVerify = elapsedMinutes >= 10;
      }

      if (shouldVerify) {
        // Forzar a re-loguear (se le mostrará el prompt biométrico porque ya está logueado en backend)
        router.replace('/login');
      }
    };

    // Verificar cuando la app vuelve al primer plano (foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVerification();
      }
    };

    // Verificar también periódicamente por si está usando la app sin cambiar de pestaña
    const intervalId = setInterval(checkVerification, 30000); 
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificación inicial al cargar el componente
    checkVerification();

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, biometricInterval, router]);

  return null;
}
