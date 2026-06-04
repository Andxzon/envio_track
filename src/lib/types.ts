// ============================================================================
// EnvioTrack — Tipos TypeScript principales
// ============================================================================

/** Estados posibles de un envío */
export type ShipmentStatus =
  | 'recibido'
  | 'en_camino'
  | 'devolucion'
  | 'pendiente'
  | 'cancelado';

/** Empresas transportadoras disponibles */
export type ShippingProvider =
  | 'interrapidisimo'
  | 'coordinadora'
  | 'servientrega'
  | 'envia'
  | 'otro';

/** Evento de seguimiento de un paquete */
export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
}

/** Cliente / envío principal */
export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  trackingNumber: string;
  shippingProvider: ShippingProvider;
  status: ShipmentStatus;
  price: number;
  isPaid: boolean;
  notes: string;
  shipDate: string;
  lastUpdate: string;
  createdAt: string;
  deletedAt: string | null; // null = activo, fecha = en papelera
  trackingHistory: TrackingEvent[];
  syncedToCloud?: boolean;
  isSyncing?: boolean;
}

/** Configuración de colores para cada estado */
export const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; emoji: string; color: string; bgClass: string; textClass: string }
> = {
  recibido: {
    label: 'Recibido',
    emoji: '🟢',
    color: '#22c55e',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-600',
  },
  en_camino: {
    label: 'En camino',
    emoji: '🟡',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-600',
  },
  devolucion: {
    label: 'Devolución',
    emoji: '🔴',
    color: '#ef4444',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-600',
  },
  pendiente: {
    label: 'Pendiente',
    emoji: '🔵',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-600',
  },
  cancelado: {
    label: 'Cancelado',
    emoji: '⚫',
    color: '#6b7280',
    bgClass: 'bg-gray-500/15',
    textClass: 'text-gray-500',
  },
};

/** Labels de las transportadoras */
export const PROVIDER_LABELS: Record<ShippingProvider, string> = {
  interrapidisimo: 'Interrapidísimo',
  coordinadora: 'Coordinadora',
  servientrega: 'Servientrega',
  envia: 'Envía',
  otro: 'Otro',
};

/** Estadísticas del dashboard */
export interface DashboardStats {
  total: number;
  recibido: number;
  en_camino: number;
  devolucion: number;
  pendiente: number;
  cancelado: number;
  totalCollected: number;
  totalPending: number;
}

/** Filtros activos */
export interface ActiveFilters {
  search: string;
  status: ShipmentStatus | 'all';
  provider: ShippingProvider | 'all';
  dateRange: 'all' | 'today' | 'week' | 'month';
}
