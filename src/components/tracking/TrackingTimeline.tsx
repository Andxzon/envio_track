// ============================================================================
// EnvioTrack — TrackingTimeline visual
// ============================================================================
'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { CheckCircle, Truck, RotateCcw, Clock, XCircle, MapPin } from 'lucide-react';
import type { TrackingEvent, ShipmentStatus } from '@/lib/types';

const statusIcons: Record<ShipmentStatus, typeof CheckCircle> = {
  recibido: CheckCircle,
  en_camino: Truck,
  devolucion: RotateCcw,
  pendiente: Clock,
  cancelado: XCircle,
};

const statusColors: Record<ShipmentStatus, string> = {
  recibido: 'bg-emerald-500',
  en_camino: 'bg-amber-500',
  devolucion: 'bg-red-500',
  pendiente: 'bg-blue-500',
  cancelado: 'bg-gray-500',
};

const ringColors: Record<ShipmentStatus, string> = {
  recibido: 'ring-emerald-500/30',
  en_camino: 'ring-amber-500/30',
  devolucion: 'ring-red-500/30',
  pendiente: 'ring-blue-500/30',
  cancelado: 'ring-gray-500/30',
};

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  // Ordenar de más reciente a más antiguo
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      {sorted.map((event, index) => {
        const Icon = statusIcons[event.status];
        const isFirst = index === 0;
        const isLast = index === sorted.length - 1;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {/* Línea vertical */}
            {!isLast && (
              <div className="absolute left-[15px] top-10 bottom-0 w-[2px] bg-border" />
            )}

            {/* Icono de estado */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full ${statusColors[event.status]} flex items-center justify-center shrink-0 ${
                isFirst ? `ring-4 ring-offset-2 ring-offset-surface ${ringColors[event.status]}` : ''
              }`}
            >
              <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>

            {/* Contenido */}
            <div className={`flex-1 pb-2 ${isFirst ? '' : 'opacity-70'}`}>
              <p className={`text-sm font-semibold text-foreground ${isFirst ? '' : 'text-sm'}`}>
                {event.description}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-muted">
                  {new Intl.DateTimeFormat('es-CO', {
                    timeZone: 'America/Bogota',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }).format(new Date(event.timestamp))}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
