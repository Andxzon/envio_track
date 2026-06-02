// ============================================================================
// EnvioTrack — PWA Manifest
// ============================================================================

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EnvioTrack — Gestión de Envíos',
    short_name: 'EnvioTrack',
    description: 'Administra clientes y rastrea paquetes enviados por transportadoras colombianas',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f5f7',
    theme_color: '#6366f1',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
