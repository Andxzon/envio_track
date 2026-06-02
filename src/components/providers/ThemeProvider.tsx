// ============================================================================
// EnvioTrack — ThemeProvider (dark/light mode)
// ============================================================================
'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Detectar preferencia del sistema al cargar
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem('enviotrack-storage');
    if (!stored) {
      useAppStore.getState().setDarkMode(mq.matches);
    }
  }, []);

  return <>{children}</>;
}
