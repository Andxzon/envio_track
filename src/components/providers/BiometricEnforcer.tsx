'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { hasStoredCredential } from '@/lib/webauthn-service';

export function BiometricEnforcer() {
  const pathname = usePathname();
  const router = useRouter();
  const { biometricInterval } = useAppStore();
  const hiddenTimeRef = useRef<number>(0);

  useEffect(() => {
    // Si la biometría está en "nunca" o no hay credenciales, no hacer nada
    if (biometricInterval === 'never' || !hasStoredCredential()) return;

    if (pathname === '/login') {
      // Registramos que acabamos de pasar por el login
      sessionStorage.setItem('last_biometric_verification', Date.now().toString());
      sessionStorage.setItem('last_active_time', Date.now().toString());
      return;
    }

    const checkLock = (isComingFromBackground = false) => {
      if (window.location.pathname === '/login') return;

      const lastVerifiedStr = sessionStorage.getItem('last_biometric_verification');
      const lastActiveStr = sessionStorage.getItem('last_active_time');
      
      const lastVerified = lastVerifiedStr ? parseInt(lastVerifiedStr, 10) : 0;
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
      const now = Date.now();

      let shouldLock = false;

      // 1. Si nunca se ha verificado en esta sesión de la pestaña (ej: abrió nueva pestaña)
      if (lastVerified === 0) {
        shouldLock = true;
      } 
      // 2. Lógica según el intervalo
      else if (biometricInterval === 'always') {
        // 'always' significa que pide biometría solo si la app se fue al fondo y volvió
        if (isComingFromBackground) {
           shouldLock = true;
        }
      } 
      else if (biometricInterval === '5min') {
        const inactiveMinutes = (now - lastActive) / 1000 / 60;
        if (inactiveMinutes >= 5) shouldLock = true;
      } 
      else if (biometricInterval === '10min') {
        const inactiveMinutes = (now - lastActive) / 1000 / 60;
        if (inactiveMinutes >= 10) shouldLock = true;
      }

      if (shouldLock) {
        router.replace('/login');
      } else {
        // Si no se bloquea, actualizamos el tiempo de actividad
        sessionStorage.setItem('last_active_time', now.toString());
      }
    };

    // Revisión inmediata al cargar/navegar
    checkLock(false);

    // Revisión al cambiar de pestaña / minimizar la app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const timeHidden = Date.now() - hiddenTimeRef.current;
        // Solo bloquear si estuvo oculta por más de 1 segundo (evita falsos positivos rápidos)
        const isComingFromBackground = timeHidden > 1000;
        checkLock(isComingFromBackground);
      }
    };

    // Actualizar "last_active_time" al interactuar con la pantalla (clicks, scrolls)
    const handleUserActivity = () => {
      sessionStorage.setItem('last_active_time', Date.now().toString());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    // Revisar periódicamente por inactividad
    const intervalId = setInterval(() => checkLock(false), 60000); // Cada 1 minuto

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(intervalId);
    };
  }, [pathname, biometricInterval, router]);

  return null;
}
