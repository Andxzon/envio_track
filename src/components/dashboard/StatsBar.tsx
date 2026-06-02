// ============================================================================
// EnvioTrack — Dashboard Stats Bar
// ============================================================================
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Package, CheckCircle, Truck, RotateCcw, Clock, XCircle, CircleDollarSign, Wallet } from 'lucide-react';

const statCards = [
  { key: 'total' as const, label: 'Total', icon: Package, color: 'text-foreground', bg: 'bg-accent/10' },
  { key: 'recibido' as const, label: 'Recibidos', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { key: 'en_camino' as const, label: 'En camino', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { key: 'devolucion' as const, label: 'Devueltos', icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-500/10' },
  { key: 'pendiente' as const, label: 'Pendientes', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'cancelado' as const, label: 'Cancelados', icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
];

export function StatsBar() {
  // Select the raw clients array (primitive reference — stable between renders)
  const clients = useAppStore((s) => s.clients);

  // Compute stats from the raw data — useMemo keeps it cached
  const stats = useMemo(() => {
    const active = clients.filter((c) => c.deletedAt === null);
    const totalCollected = active.reduce((acc, c) => acc + (c.isPaid ? (c.price || 0) : 0), 0);
    const totalPending = active.reduce((acc, c) => acc + (!c.isPaid ? (c.price || 0) : 0), 0);

    return {
      total: active.length,
      recibido: active.filter((c) => c.status === 'recibido').length,
      en_camino: active.filter((c) => c.status === 'en_camino').length,
      devolucion: active.filter((c) => c.status === 'devolucion').length,
      pendiente: active.filter((c) => c.status === 'pendiente').length,
      cancelado: active.filter((c) => c.status === 'cancelado').length,
      totalCollected,
      totalPending,
    };
  }, [clients]);

  const formatMoney = (value: number) => `$${value.toLocaleString('es-CO')}`;

  return (
    <div className="space-y-3">
      {/* Financial Summary */}
      <div className="flex gap-2.5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="card flex-1 p-3.5 border-emerald-500/20"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-600" strokeWidth={2} />
          </div>
          <motion.p
            key={stats.totalCollected}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold text-emerald-600"
          >
            {formatMoney(stats.totalCollected)}
          </motion.p>
          <p className="text-[11px] text-muted font-medium">Cobrado</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3, ease: 'easeOut' }}
          className="card flex-1 p-3.5 border-red-500/20"
        >
          <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 text-red-500" strokeWidth={2} />
          </div>
          <motion.p
            key={stats.totalPending}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold text-red-500"
          >
            {formatMoney(stats.totalPending)}
          </motion.p>
          <p className="text-[11px] text-muted font-medium">Por cobrar</p>
        </motion.div>
      </div>

      {/* Status Cards */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-none">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const value = stats[card.key];

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
              className="card min-w-[120px] flex-shrink-0 p-3.5 flex flex-col gap-2"
            >
              <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} strokeWidth={2} />
              </div>
              <div>
                <motion.p
                  key={value}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-xl font-bold ${card.color}`}
                >
                  {value}
                </motion.p>
                <p className="text-[11px] text-muted font-medium">{card.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
