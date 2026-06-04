'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Verificar estado inicial
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-border text-xs font-medium transition-colors">
      {isOnline ? (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-600">En línea</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Sin conexión</span>
        </>
      )}
    </div>
  );
}
