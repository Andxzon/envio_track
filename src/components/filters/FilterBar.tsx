// ============================================================================
// EnvioTrack — FilterBar con chips
// ============================================================================
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { STATUS_CONFIG, PROVIDER_LABELS, type ShipmentStatus, type ShippingProvider } from '@/lib/types';

const statusOptions: { value: ShipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    value: key as ShipmentStatus,
    label: `${config.emoji} ${config.label}`,
  })),
];

const providerOptions: { value: ShippingProvider | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  ...Object.entries(PROVIDER_LABELS).map(([key, label]) => ({
    value: key as ShippingProvider,
    label,
  })),
];

const dateOptions = [
  { value: 'all' as const, label: 'Siempre' },
  { value: 'today' as const, label: 'Hoy' },
  { value: 'week' as const, label: 'Semana' },
  { value: 'month' as const, label: 'Mes' },
];

export function FilterBar() {
  const [isOpen, setIsOpen] = useState(false);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.provider !== 'all' ||
    filters.dateRange !== 'all';

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
          hasActiveFilters
            ? 'bg-accent text-white'
            : 'bg-surface border border-border text-muted hover:text-foreground'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
        {hasActiveFilters && (
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
            {[filters.status !== 'all', filters.provider !== 'all', filters.dateRange !== 'all'].filter(Boolean).length}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Filter panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Estado */}
              <div>
                <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  Estado
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters({ status: opt.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.status === opt.value
                          ? 'bg-accent text-white'
                          : 'bg-surface-elevated text-muted hover:text-foreground border border-border-light'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transportadora */}
              <div>
                <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  Transportadora
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {providerOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters({ provider: opt.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.provider === opt.value
                          ? 'bg-accent text-white'
                          : 'bg-surface-elevated text-muted hover:text-foreground border border-border-light'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <p className="text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  Período
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters({ dateRange: opt.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filters.dateRange === opt.value
                          ? 'bg-accent text-white'
                          : 'bg-surface-elevated text-muted hover:text-foreground border border-border-light'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limpiar */}
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => {
                    resetFilters();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-danger hover:text-danger-hover transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar filtros
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
