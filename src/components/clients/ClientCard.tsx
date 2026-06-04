// ============================================================================
// EnvioTrack — ClientCard
// ============================================================================
'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { MapPin, Scan, Pencil, Trash2, Cloud, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PROVIDER_LABELS, type Client, type ShipmentStatus } from '@/lib/types';

interface ClientCardProps {
  client: Client;
  index: number;
  onTrack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ShipmentStatus) => void;
  onTogglePayment: () => void;
}

export function ClientCard({ client, index, onTrack, onEdit, onDelete, onStatusChange, onTogglePayment }: ClientCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="card p-4 space-y-3 active:scale-[0.98] transition-transform"
    >
      {/* Header: nombre + estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
            {client.isSyncing ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
            ) : client.syncedToCloud ? (
              <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3 h-3 text-muted shrink-0" />
            <span className="text-xs text-muted truncate">{client.city}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">
              {PROVIDER_LABELS[client.shippingProvider]}
            </span>
          </div>
        </div>
        <Badge status={client.status} size="sm" onChange={onStatusChange} />
      </div>

      {/* Info de guía */}
      <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2">
        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Guía</span>
        <span className="text-sm font-mono font-medium text-foreground flex-1 truncate">
          {client.trackingNumber}
        </span>
        <span className="text-[10px] text-muted">
          {format(new Date(client.shipDate), 'd MMM', { locale: es })}
        </span>
      </div>

      {/* Precio y estado de pago */}
      {(client.price > 0) && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-foreground">
            ${(client.price || 0).toLocaleString('es-CO')}
          </span>
          <button
            onClick={onTogglePayment}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
              client.isPaid
                ? 'bg-emerald-500/15 text-emerald-600'
                : 'bg-red-500/15 text-red-500'
            }`}
          >
            {client.isPaid ? '✅ Pagado' : '💰 Por cobrar'}
          </button>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={onTrack}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover active:scale-95 transition-all"
        >
          <Scan className="w-3.5 h-3.5" />
          Rastrear
        </button>
        <button
          onClick={onEdit}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-elevated border border-border text-muted hover:text-foreground active:scale-95 transition-all"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
