// ============================================================================
// EnvioTrack — Layout principal con soporte PWA/iOS
// ============================================================================

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { SyncManager } from '@/components/providers/SyncManager';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EnvioTrack — Gestión de Envíos',
  description:
    'Administra clientes y rastrea paquetes enviados por transportadoras colombianas como Interrapidísimo, Coordinadora, Servientrega y Envía.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EnvioTrack',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* PWA manifest link */}
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* iOS PWA meta tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Service Worker registration for PWA install */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          {children}
          <ToastContainer />
          <SyncManager />
        </ThemeProvider>
      </body>
    </html>
  );
}
