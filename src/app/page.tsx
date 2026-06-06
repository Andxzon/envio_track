// ============================================================================
// EnvioTrack — Página Principal (Dashboard)
// ============================================================================
'use client';

import { useEffect, useState, useRef } from 'react';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/filters/FilterBar';
import { ClientList } from '@/components/clients/ClientList';
import { BottomNav } from '@/components/ui/BottomNav';
import { ConnectionIndicator } from '@/components/ui/ConnectionIndicator';
import { syncFromSupabase } from '@/lib/migration-service';
import { useAppStore } from '@/lib/store';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const addToast = useAppStore((s) => s.addToast);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncFromSupabase();
      addToast({ type: 'success', message: 'Datos actualizados desde la nube' });
    } catch (e: any) {
      console.error(e);
      // Opcional: mostrar error silencioso o solo cuando el usuario lo pida explícitamente
    } finally {
      setIsRefreshing(false);
      setPullProgress(0);
    }
  };

  useEffect(() => {
    // Sincronizar automáticamente al abrir la aplicación
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Solo permitir pull-to-refresh si estamos exactamente en el tope de la ventana
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || startY.current === 0) return;
    
    // Doble verificación: solo hacer el pull si seguimos en el tope
    if (window.scrollY <= 0) {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY.current;
      
      // Solo consideramos el pull hacia abajo
      if (pullDistance > 0) {
        // Hacemos que el pull sea más "duro" usando una raíz cuadrada o dividiendo
        const resistance = pullDistance / 2;
        setPullProgress(Math.min(resistance / 80, 1));
        
        // Prevenir scroll nativo si estamos haciendo pull to refresh
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (startY.current === 0) return;
    
    if (pullProgress > 0.6 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullProgress(0);
    }
    startY.current = 0;
  };

  return (
    <>
      <main 
        ref={mainRef}
        className="flex-1 pb-safe overflow-x-hidden overflow-y-auto relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        <div 
          className="w-full flex justify-center items-end overflow-hidden transition-all duration-200"
          style={{ height: pullProgress > 0 || isRefreshing ? 60 : 0, opacity: pullProgress > 0 || isRefreshing ? 1 : 0 }}
        >
          <div className="bg-surface shadow-md rounded-full p-2 mb-2 flex items-center justify-center">
            <RefreshCw className={`w-5 h-5 text-accent ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 360}deg)` }} />
          </div>
        </div>

        {/* Header simple */}
        <header className="sticky top-0 z-30 glass border-b border-border-light px-4 py-3">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
              EnvioTrack
            </h1>
            <ConnectionIndicator />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {/* Estadísticas */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 px-1">Resumen</h2>
            <StatsBar />
          </section>

          {/* Búsqueda y Filtros */}
          <section className="space-y-3 sticky top-16 z-20 bg-background/80 backdrop-blur-md py-2 -mx-4 px-4">
            <SearchBar />
            <FilterBar />
          </section>

          {/* Lista de envíos */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Envíos activos</h2>
            </div>
            <ClientList />
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
