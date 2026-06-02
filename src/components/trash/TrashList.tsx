// ============================================================================
// EnvioTrack — TrashList
// ============================================================================
'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Trash2, RotateCcw, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function TrashList() {
  const clients = useAppStore((s) => s.clients);
  const restore = useAppStore((s) => s.restore);
  const permanentDelete = useAppStore((s) => s.permanentDelete);
  const emptyTrash = useAppStore((s) => s.emptyTrash);
  const addToast = useAppStore((s) => s.addToast);

  const trashClients = useMemo(
    () => clients.filter((c) => c.deletedAt !== null),
    [clients]
  );

  const handleRestore = (id: string, name: string) => {
    restore(id);
    addToast({ type: 'success', message: `"${name}" restaurado correctamente` });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar permanentemente a "${name}"? Esta acción no se puede deshacer.`)) {
      permanentDelete(id);
      addToast({ type: 'info', message: `"${name}" eliminado permanentemente` });
    }
  };

  const handleEmptyTrash = () => {
    if (window.confirm('¿Estás seguro de vaciar la papelera? Todos los envíos se eliminarán permanentemente.')) {
      emptyTrash();
      addToast({ type: 'info', message: 'Papelera vaciada' });
    }
  };

  if (trashClients.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="Papelera vacía"
        description="Los envíos eliminados aparecerán aquí. Podrás restaurarlos o eliminarlos permanentemente."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Aviso y botón vaciar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-500">
            Los elementos en la papelera ocupan espacio de almacenamiento.
          </p>
        </div>
        <button
          onClick={handleEmptyTrash}
          className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          Vaciar papelera
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {trashClients.map((client) => (
            <motion.div
              key={client.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {client.name}
                  </h3>
                  <Badge status={client.status} size="sm" />
                </div>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                  <span className="font-mono bg-surface-elevated px-1.5 py-0.5 rounded">
                    {client.trackingNumber}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Eliminado{' '}
                    {client.deletedAt
                      ? formatDistanceToNow(new Date(client.deletedAt), {
                          addSuffix: true,
                          locale: es,
                        })
                      : 'recientemente'}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(client.id, client.name)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated border border-border text-foreground text-sm font-medium hover:bg-border-light transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors"
                  title="Eliminar permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
