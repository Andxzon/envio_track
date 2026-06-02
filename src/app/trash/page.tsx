// ============================================================================
// EnvioTrack — Página de Papelera
// ============================================================================
import { TrashList } from '@/components/trash/TrashList';
import { BottomNav } from '@/components/ui/BottomNav';

export default function TrashPage() {
  return (
    <>
      <main className="flex-1 pb-safe">
        <header className="sticky top-0 z-30 glass border-b border-border-light px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-foreground">Papelera</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <TrashList />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
