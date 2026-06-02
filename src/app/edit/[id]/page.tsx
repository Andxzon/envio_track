// ============================================================================
// EnvioTrack — Página para editar cliente
// ============================================================================
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PackageX } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ClientForm } from '@/components/clients/ClientForm';
import { EmptyState } from '@/components/ui/EmptyState';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const clients = useAppStore((s) => s.clients);
  const client = useMemo(
    () => clients.find((c) => c.id === unwrappedParams.id),
    [clients, unwrappedParams.id]
  );

  if (!client) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-4">
        <EmptyState
          icon={PackageX}
          title="Envío no encontrado"
          description="El cliente que intentas editar no existe o fue eliminado."
          action={
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors"
            >
              Volver al inicio
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background pb-safe px-4 py-4 md:py-8">
      <div className="max-w-xl mx-auto bg-surface sm:border sm:border-border rounded-2xl sm:p-6 sm:shadow-sm">
        <ClientForm editClient={client} />
      </div>
    </main>
  );
}
