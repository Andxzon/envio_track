// ============================================================================
// EnvioTrack — TrackingModal
// ============================================================================
'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { shippingProviderService } from '@/lib/shipping-provider-service';
import { PROVIDER_LABELS, type Client } from '@/lib/types';

interface TrackingModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TrackingModal({ client, isOpen, onClose }: TrackingModalProps) {
  const [showToast, setShowToast] = useState(false);

  if (!client) return null;

  const handleWebClick = async () => {
    try {
      await navigator.clipboard.writeText(client.trackingNumber);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
    window.open(trackingUrl, '_blank');
  };

  const trackingUrl = shippingProviderService.getTrackingUrl(
    client.trackingNumber,
    client.shippingProvider
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rastreo de envío" size="md">
      <div className="space-y-5 relative">
        {/* Toast Notification */}
        {showToast && (
          <div className="absolute -top-4 left-0 right-0 flex justify-center z-50 animate-fade-in">
            <div className="bg-accent text-white text-xs font-medium px-4 py-2 rounded-full shadow-md">
              ¡Guía copiada! Pégala en el buscador.
            </div>
          </div>
        )}

        {/* Info del cliente */}
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{client.name}</h3>
              <p className="text-sm text-muted mt-0.5">
                {PROVIDER_LABELS[client.shippingProvider]}
              </p>
            </div>
            <Badge status={client.status} />
          </div>
          <div className="flex items-center gap-2 bg-surface-elevated rounded-xl px-3 py-2.5">
            <span className="text-xs text-muted">Guía:</span>
            <span className="text-sm font-mono font-semibold text-foreground flex-1">
              {client.trackingNumber}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {trackingUrl !== '#' && (
            <button
              onClick={handleWebClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver en la Web de Rastreo
            </button>
          )}
        </div>

        {/* Datos del cliente */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Datos del cliente
          </h4>
          <div className="card p-4 space-y-3 bg-surface text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Teléfono:</span>
              <span className="font-medium">{client.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ciudad:</span>
              <span className="font-medium">{client.city}</span>
            </div>
            {client.address && (
              <div className="flex justify-between">
                <span className="text-muted">Dirección:</span>
                <span className="font-medium text-right">{client.address}</span>
              </div>
            )}
            {(client.price > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-muted">Precio:</span>
                <span className="font-bold text-foreground">${(client.price || 0).toLocaleString('es-CO')}</span>
              </div>
            )}
            {(client.price > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-muted">Pago:</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  client.isPaid
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-red-500/15 text-red-500'
                }`}>
                  {client.isPaid ? '✅ Pagado' : '💰 Por cobrar'}
                </span>
              </div>
            )}
            {client.notes && (
              <div className="pt-3 mt-1 border-t border-border">
                <span className="text-muted block mb-1.5">Observaciones:</span>
                <p className="text-foreground leading-relaxed">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
