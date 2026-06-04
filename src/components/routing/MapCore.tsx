'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Iconos SVG inline (no depende de red externa, funciona en iOS offline) ──
function makeSvgIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const originIcon = () => makeSvgIcon('#10b981'); // verde para Medellín
const destIcon   = () => makeSvgIcon('#6366f1'); // indigo para destino

interface MapCoreProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

function MapUpdater({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);
  return null;
}

export default function MapCore({ originLat, originLng, destLat, destLng }: MapCoreProps) {
  const [routeData, setRouteData] = useState<[number, number][] | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates;
          // OSRM returns [lng, lat], Leaflet needs [lat, lng]
          const mappedCoords: [number, number][] = coords.map((c: number[]) => [c[1], c[0]]);
          setRouteData(mappedCoords);
        } else {
          setRouteData(null);
        }
      } catch (e) {
        console.error('Error fetching route:', e);
        setRouteData(null);
      }
    };

    fetchRoute();
  }, [originLat, originLng, destLat, destLng]);

  const fallbackBounds: L.LatLngBoundsExpression = [
    [originLat, originLng],
    [destLat, destLng],
  ];

  const boundsToUse = routeData ? L.latLngBounds(routeData) : fallbackBounds;

  return (
    // touch-action: pan-y permite scroll vertical de la página en iOS sin bloquear el mapa
    <div
      className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-border z-0 relative shadow-sm"
      style={{ touchAction: 'pan-y' }}
    >
      <MapContainer
        bounds={boundsToUse}
        boundsOptions={{ padding: [30, 30] }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: '100%', width: '100%', background: '#0a0a0a', touchAction: 'none' }}
      >
        <MapUpdater bounds={boundsToUse} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[originLat, originLng]} icon={originIcon()} />
        <Marker position={[destLat, destLng]} icon={destIcon()} />
        <Polyline
          positions={routeData || fallbackBounds}
          pathOptions={{
            color: '#6366f1',
            weight: routeData ? 5 : 4,
            dashArray: routeData ? undefined : '10, 10',
            opacity: 0.9,
          }}
        />
      </MapContainer>
    </div>
  );
}
