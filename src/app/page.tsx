// ============================================================================
// EnvioTrack — Página Principal (Dashboard)
// ============================================================================
import { StatsBar } from '@/components/dashboard/StatsBar';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterBar } from '@/components/filters/FilterBar';
import { ClientList } from '@/components/clients/ClientList';
import { BottomNav } from '@/components/ui/BottomNav';
import { ConnectionIndicator } from '@/components/ui/ConnectionIndicator';

export default function Home() {
  return (
    <>
      <main className="flex-1 pb-safe overflow-x-hidden">
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
