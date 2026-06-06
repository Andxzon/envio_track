'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function PwaUpdater() {
  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;

    // Cuando el SW toma control de la página (por ejemplo después de un skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // Si ya hay un SW esperando cuando cargamos la app
      if (registration.waiting) {
        showUpdateToast(registration.waiting);
      }

      // Si se instala un nuevo SW mientras usamos la app
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // Se instaló y está esperando a ser activado
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(newWorker);
          }
        });
      });
    });

    function showUpdateToast(worker: ServiceWorker) {
      addToast({
        type: 'info',
        message: '¡Nueva versión disponible!',
        actionLabel: 'Actualizar',
        action: () => {
          worker.postMessage({ type: 'SKIP_WAITING' });
        },
      });
    }
  }, [addToast]);

  return null;
}
