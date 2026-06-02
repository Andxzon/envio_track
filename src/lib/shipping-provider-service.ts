// ============================================================================
// EnvioTrack — Servicio de transportadoras (desacoplado, listo para APIs reales)
// ============================================================================

import type { TrackingEvent, ShipmentStatus, ShippingProvider } from './types';

/** Interfaz base para todos los proveedores de envío */
export interface ShippingProviderAdapter {
  name: ShippingProvider;
  displayName: string;
  trackPackage(trackingNumber: string): Promise<TrackingEvent[]>;
  getTrackingUrl(trackingNumber: string): string;
}

// ─── Implementación Mock (desarrollo) ────────────────────────────────────────

function generateMockEvents(trackingNumber: string, status: ShipmentStatus): TrackingEvent[] {
  const now = Date.now();
  const events: TrackingEvent[] = [
    {
      id: `evt-${trackingNumber}-1`,
      status: 'pendiente',
      description: 'Paquete registrado en el sistema',
      location: 'Oficina de origen',
      timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  if (['en_camino', 'recibido', 'devolucion'].includes(status)) {
    events.push({
      id: `evt-${trackingNumber}-2`,
      status: 'en_camino',
      description: 'Paquete en tránsito hacia destino',
      location: 'Centro de distribución',
      timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (status === 'recibido') {
    events.push({
      id: `evt-${trackingNumber}-3`,
      status: 'recibido',
      description: 'Paquete entregado al destinatario',
      location: 'Dirección de destino',
      timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  if (status === 'devolucion') {
    events.push({
      id: `evt-${trackingNumber}-3`,
      status: 'devolucion',
      description: 'Paquete devuelto - No fue posible entregar',
      location: 'Dirección de destino',
      timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return events;
}

// ─── Adaptadores por transportadora ──────────────────────────────────────────

const interrapidisimoAdapter: ShippingProviderAdapter = {
  name: 'interrapidisimo',
  displayName: 'Interrapidísimo',
  async trackPackage(trackingNumber: string) {
    // TODO: Integrar con API real de Interrapidísimo
    // URL base: https://www.interrapidisimo.com/rastreo/
    await new Promise((r) => setTimeout(r, 800)); // Simular latencia
    return generateMockEvents(trackingNumber, 'en_camino');
  },
  getTrackingUrl(trackingNumber: string) {
    return `https://siguetuenvio.interrapidisimo.com/`;
  },
};

const coordinadoraAdapter: ShippingProviderAdapter = {
  name: 'coordinadora',
  displayName: 'Coordinadora',
  async trackPackage(trackingNumber: string) {
    // TODO: Integrar con API real de Coordinadora
    await new Promise((r) => setTimeout(r, 800));
    return generateMockEvents(trackingNumber, 'en_camino');
  },
  getTrackingUrl(trackingNumber: string) {
    return `https://www.coordinadora.com/rastreo-de-guias/?guia=${trackingNumber}`;
  },
};

const servientregaAdapter: ShippingProviderAdapter = {
  name: 'servientrega',
  displayName: 'Servientrega',
  async trackPackage(trackingNumber: string) {
    // TODO: Integrar con API real de Servientrega
    await new Promise((r) => setTimeout(r, 800));
    return generateMockEvents(trackingNumber, 'en_camino');
  },
  getTrackingUrl(trackingNumber: string) {
    return `https://www.servientrega.com/rastreo/?guia=${trackingNumber}`;
  },
};

const enviaAdapter: ShippingProviderAdapter = {
  name: 'envia',
  displayName: 'Envía',
  async trackPackage(trackingNumber: string) {
    // TODO: Integrar con API real de Envía
    await new Promise((r) => setTimeout(r, 800));
    return generateMockEvents(trackingNumber, 'en_camino');
  },
  getTrackingUrl(trackingNumber: string) {
    return `https://www.envia.co/rastreo/${trackingNumber}`;
  },
};

const defaultAdapter: ShippingProviderAdapter = {
  name: 'otro',
  displayName: 'Otro',
  async trackPackage(trackingNumber: string) {
    await new Promise((r) => setTimeout(r, 400));
    return generateMockEvents(trackingNumber, 'pendiente');
  },
  getTrackingUrl() {
    return '#';
  },
};

// ─── Servicio principal (Facade) ─────────────────────────────────────────────

const adapters: Record<ShippingProvider, ShippingProviderAdapter> = {
  interrapidisimo: interrapidisimoAdapter,
  coordinadora: coordinadoraAdapter,
  servientrega: servientregaAdapter,
  envia: enviaAdapter,
  otro: defaultAdapter,
};

export const shippingProviderService = {
  /** Obtiene el adaptador para una transportadora */
  getAdapter(provider: ShippingProvider): ShippingProviderAdapter {
    return adapters[provider] || defaultAdapter;
  },

  /** Rastrea un paquete usando la transportadora indicada */
  async trackPackage(trackingNumber: string, provider: ShippingProvider): Promise<TrackingEvent[]> {
    const adapter = this.getAdapter(provider);
    return adapter.trackPackage(trackingNumber);
  },

  /** Obtiene la URL de rastreo externo */
  getTrackingUrl(trackingNumber: string, provider: ShippingProvider): string {
    const adapter = this.getAdapter(provider);
    return adapter.getTrackingUrl(trackingNumber);
  },

  /** Lista todas las transportadoras disponibles */
  getAvailableProviders(): { name: ShippingProvider; displayName: string }[] {
    return Object.values(adapters).map((a) => ({
      name: a.name,
      displayName: a.displayName,
    }));
  },
};
