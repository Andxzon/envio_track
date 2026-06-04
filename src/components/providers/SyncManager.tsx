'use client';

import { useEffect } from 'react';
import { syncPendingClients } from '@/lib/migration-service';

export function SyncManager() {
  useEffect(() => {
    const handleOnline = () => {
      syncPendingClients();
    };

    // Escuchar el evento online
    window.addEventListener('online', handleOnline);

    // Intentar sincronizar al cargar si hay conexión
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncPendingClients();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
