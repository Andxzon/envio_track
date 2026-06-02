// ============================================================================
// EnvioTrack — Página para agregar cliente
// ============================================================================
import { ClientForm } from '@/components/clients/ClientForm';

export default function NewClientPage() {
  return (
    <main className="min-h-dvh bg-background pb-safe px-4 py-4 md:py-8">
      <div className="max-w-xl mx-auto bg-surface sm:border sm:border-border rounded-2xl sm:p-6 sm:shadow-sm">
        <ClientForm />
      </div>
    </main>
  );
}
