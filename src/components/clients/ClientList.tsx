// ============================================================================
// EnvioTrack — ClientList
// ============================================================================
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ClientCard } from './ClientCard';
import { TrackingModal } from '@/components/tracking/TrackingModal';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Client } from '@/lib/types';

export function ClientList() {
  const router = useRouter();
  const allClients = useAppStore((s) => s.clients);
  const filters = useAppStore((s) => s.filters);
  const softDelete = useAppStore((s) => s.softDelete);
  const restore = useAppStore((s) => s.restore);
  const addToast = useAppStore((s) => s.addToast);
  const updateClient = useAppStore((s) => s.updateClient);

  const clients = useMemo(() => {
    let filtered = allClients.filter((c) => c.deletedAt === null);

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.trackingNumber.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search) ||
          c.phone.includes(search)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.provider !== 'all') {
      filtered = filtered.filter((c) => c.shippingProvider === filters.provider);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const start = new Date();
      switch (filters.dateRange) {
        case 'today': start.setHours(0, 0, 0, 0); break;
        case 'week': start.setDate(now.getDate() - 7); break;
        case 'month': start.setMonth(now.getMonth() - 1); break;
      }
      filtered = filtered.filter((c) => new Date(c.shipDate) >= start);
    }

    return filtered;
  }, [allClients, filters]);

  const [trackingClient, setTrackingClient] = useState<Client | null>(null);

  const handleDelete = (client: Client) => {
    softDelete(client.id);
    addToast({
      type: 'undo',
      message: `"${client.name}" movido a la papelera`,
      actionLabel: 'Deshacer',
      action: () => restore(client.id),
    });
  };

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Sin resultados"
        description="No se encontraron envíos con los filtros actuales. Intenta ajustar la búsqueda o agrega un nuevo cliente."
        action={
          <button
            onClick={() => router.push('/new')}
            className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors"
          >
            Agregar cliente
          </button>
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {clients.map((client, index) => (
            <ClientCard
              key={client.id}
              client={client}
              index={index}
              onTrack={() => setTrackingClient(client)}
              onEdit={() => router.push(`/edit/${client.id}`)}
              onDelete={() => handleDelete(client)}
              onStatusChange={(status) => updateClient(client.id, { status })}
              onTogglePayment={() => updateClient(client.id, { isPaid: !client.isPaid })}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Modal de rastreo */}
      <TrackingModal
        client={trackingClient}
        isOpen={!!trackingClient}
        onClose={() => setTrackingClient(null)}
      />
    </>
  );
}
