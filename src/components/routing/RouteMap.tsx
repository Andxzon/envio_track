'use client';

import dynamic from 'next/dynamic';
import { calculateDistance, estimateDeliveryTime, MEDELLIN_COORDS } from '@/lib/routing-utils';
import { Truck } from 'lucide-react';

const MapCore = dynamic(() => import('./MapCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 sm:h-56 bg-surface-elevated animate-pulse rounded-2xl border border-border flex items-center justify-center">
      <span className="text-muted text-sm font-medium">Cargando mapa...</span>
    </div>
  ),
});

interface RouteMapProps {
  destLat: number;
  destLng: number;
}

export function RouteMap({ destLat, destLng }: RouteMapProps) {
  const distance = calculateDistance(MEDELLIN_COORDS.lat, MEDELLIN_COORDS.lng, destLat, destLng);
  const estimation = estimateDeliveryTime(distance);

  return (
    <div className="space-y-3 mt-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Tiempo estimado</p>
          <p className="text-sm font-semibold text-foreground">
            {estimation.text} <span className="text-muted font-normal ml-1">({Math.round(distance)} km)</span>
          </p>
        </div>
      </div>
      
      <MapCore 
        originLat={MEDELLIN_COORDS.lat} 
        originLng={MEDELLIN_COORDS.lng} 
        destLat={destLat} 
        destLng={destLng} 
      />
    </div>
  );
}
