// ============================================================================
// EnvioTrack — Store global con Zustand + persistencia localStorage
// ============================================================================
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { Client, ShipmentStatus, ActiveFilters, DashboardStats, TrackingEvent } from './types';

/** Genera un ID único */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Interfaz del store principal */
interface AppStore {
  // Estado
  clients: Client[];
  filters: ActiveFilters;
  isDarkMode: boolean;
  toasts: Toast[];
  biometricInterval: 'always' | '5min' | '10min' | 'never';

  // Acciones CRUD
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'lastUpdate' | 'deletedAt' | 'trackingHistory' | 'isSyncing' | 'syncedToCloud'>) => string;
  updateClient: (id: string, data: Partial<Client>) => void;
  updateClientStatus: (id: string, status: ShipmentStatus, description?: string, location?: string) => void;

  // Papelera
  softDelete: (id: string) => void;
  restore: (id: string) => void;
  permanentDelete: (id: string) => void;
  emptyTrash: () => void;

  // Filtros
  setFilters: (filters: Partial<ActiveFilters>) => void;
  resetFilters: () => void;

  // Tema
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;

  // Biometría
  setBiometricInterval: (interval: 'always' | '5min' | '10min' | 'never') => void;

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Getters computados
  getActiveClients: () => Client[];
  getTrashClients: () => Client[];
  getFilteredClients: () => Client[];
  getStats: () => DashboardStats;
  getClientById: (id: string) => Client | undefined;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'undo';
  message: string;
  action?: () => void;
  actionLabel?: string;
}

const DEFAULT_FILTERS: ActiveFilters = {
  search: '',
  status: 'all',
  provider: 'all',
  dateRange: 'all',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ─── Estado inicial ─────────────────────────────────────────────
      clients: [],
      filters: DEFAULT_FILTERS,
      isDarkMode: false,
      toasts: [],
      biometricInterval: 'always' as const,

      // ─── CRUD ──────────────────────────────────────────────────────
      addClient: (clientData) => {
        const now = new Date().toISOString();
        const id = generateId();
        const newClient: Client = {
          ...clientData,
          id,
          createdAt: now,
          lastUpdate: now,
          deletedAt: null,
          isSyncing: true,
          syncedToCloud: false,
          trackingHistory: [
            {
              id: generateId(),
              status: clientData.status,
              description: `Envío registrado como "${clientData.status}"`,
              location: clientData.city,
              timestamp: now,
            },
          ],
        };
        set((state) => ({ clients: [newClient, ...state.clients] }));
        // Auto-upload
        import('./migration-service').then(m => m.uploadSingleClient(id)).catch(console.error);
        return id;
      },

      updateClient: (id, data) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id
              ? { ...c, ...data, lastUpdate: new Date().toISOString(), syncedToCloud: false }
              : c
          ),
        }));
        // Auto-upload changes
        import('./migration-service').then(m => m.uploadSingleClient(id)).catch(console.error);
      },

      updateClientStatus: (id, status, description, location) => {
        const now = new Date().toISOString();
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.id !== id) return c;
            const event: TrackingEvent = {
              id: generateId(),
              status,
              description: description || `Estado actualizado a "${status}"`,
              location: location || c.city,
              timestamp: now,
            };
            return {
              ...c,
              status,
              lastUpdate: now,
              syncedToCloud: false,
              trackingHistory: [...c.trackingHistory, event],
            };
          }),
        }));
        // Auto-upload changes
        import('./migration-service').then(m => m.uploadSingleClient(id)).catch(console.error);
      },

      // ─── Papelera ──────────────────────────────────────────────────
      softDelete: (id) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, deletedAt: new Date().toISOString(), syncedToCloud: false } : c
          ),
        }));
        import('./migration-service').then(m => m.uploadSingleClient(id)).catch(console.error);
      },

      restore: (id) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, deletedAt: null, syncedToCloud: false } : c
          ),
        }));
        import('./migration-service').then(m => m.uploadSingleClient(id)).catch(console.error);
      },

      permanentDelete: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }));
        import('./migration-service').then(m => m.deleteSingleClient(id)).catch(console.error);
      },

      emptyTrash: () => {
        set((state) => ({
          clients: state.clients.filter((c) => !c.deletedAt),
        }));
      },

      // ─── Filtros ───────────────────────────────────────────────────
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
      },

      // ─── Tema ──────────────────────────────────────────────────────
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },

      setDarkMode: (value) => {
        set({ isDarkMode: value });
      },

      // ─── Biometría ──────────────────────────────────────────────────
      setBiometricInterval: (interval) => {
        set({ biometricInterval: interval });
      },

      // ─── Toasts ────────────────────────────────────────────────────
      addToast: (toast) => {
        const id = generateId();
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        // Auto-remove después de 4 segundos
        setTimeout(() => get().removeToast(id), 4000);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      // ─── Getters computados ────────────────────────────────────────
      getActiveClients: () => {
        return get().clients.filter((c) => !c.deletedAt);
      },

      getTrashClients: () => {
        return get().clients.filter((c) => !!c.deletedAt);
      },

      getFilteredClients: () => {
        const { clients, filters } = get();
        let filtered = clients.filter((c) => !c.deletedAt);

        // Filtro por búsqueda
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

        // Filtro por estado
        if (filters.status !== 'all') {
          filtered = filtered.filter((c) => c.status === filters.status);
        }

        // Filtro por transportadora
        if (filters.provider !== 'all') {
          filtered = filtered.filter((c) => c.shippingProvider === filters.provider);
        }

        // Filtro por fecha
        if (filters.dateRange !== 'all') {
          const now = new Date();
          const start = new Date();

          switch (filters.dateRange) {
            case 'today':
              start.setHours(0, 0, 0, 0);
              break;
            case 'week':
              start.setDate(now.getDate() - 7);
              break;
            case 'month':
              start.setMonth(now.getMonth() - 1);
              break;
          }

          filtered = filtered.filter((c) => new Date(c.shipDate) >= start);
        }

        return filtered;
      },

      getStats: () => {
        const filtered = get().getFilteredClients();
        const totalCollected = filtered.reduce((acc, c) => acc + (c.isPaid ? (c.price || 0) : 0), 0);
        const totalPending = filtered.reduce((acc, c) => acc + (!c.isPaid ? (c.price || 0) : 0), 0);

        return {
          total: filtered.length,
          recibido: filtered.filter((c) => c.status === 'recibido').length,
          en_camino: filtered.filter((c) => c.status === 'en_camino').length,
          devolucion: filtered.filter((c) => c.status === 'devolucion').length,
          pendiente: filtered.filter((c) => c.status === 'pendiente').length,
          cancelado: filtered.filter((c) => c.status === 'cancelado').length,
          totalCollected,
          totalPending,
        };
      },

      getClientById: (id) => {
        return get().clients.find((c) => c.id === id);
      },
    }),
    {
      name: 'enviotrack-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          if (typeof window === 'undefined') return null;
          return (await get(name)) || null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          if (typeof window === 'undefined') return;
          await set(name, value);
        },
        removeItem: async (name: string): Promise<void> => {
          if (typeof window === 'undefined') return;
          await del(name);
        },
      }) as StateStorage),
      // Solo persistir datos esenciales, no los toasts
      partialize: (state) => ({
        clients: state.clients,
        isDarkMode: state.isDarkMode,
        biometricInterval: state.biometricInterval,
      }),
    }
  )
);
