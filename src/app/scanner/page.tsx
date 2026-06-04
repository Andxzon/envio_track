'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';

export default function ScannerPage() {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const hasCamera = await Html5Qrcode.getCameras();
        if (hasCamera && hasCamera.length > 0 && isMounted) {
          setIsScanning(true);
          await scanner.start(
            { facingMode: 'environment' }, // Cámara trasera
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (!isMounted) return;
              try {
                const url = new URL(decodedText);
                if (url.origin === window.location.origin && url.pathname.startsWith('/report/')) {
                  scanner.stop().then(() => {
                    setIsScanning(false);
                    router.push(url.pathname); 
                  }).catch(() => {
                    router.push(url.pathname);
                  });
                } else {
                  setError('Código QR no válido para esta aplicación.');
                }
              } catch (e) {
                setError('El código QR no contiene una URL válida.');
              }
            },
            (err) => {}
          );

          // Si el componente se desmontó mientras la cámara inicializaba, debemos detenerla de inmediato
          if (!isMounted) {
            scanner.stop().then(() => scanner.clear()).catch(() => {});
          }
        } else if (!hasCamera || hasCamera.length === 0) {
          setError('No se encontraron cámaras en este dispositivo.');
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Error al acceder a la cámara. Asegúrate de dar permisos.');
        }
      }
    };

    startScanner();

    // Limpieza al desmontar
    return () => {
      isMounted = false;
      const currentScanner = scannerRef.current;
      if (currentScanner) {
        try {
          currentScanner.stop()
            .then(() => currentScanner.clear())
            .catch(() => {
              try { currentScanner.clear(); } catch (e) {}
            });
        } catch (error) {
          try { currentScanner.clear(); } catch (e) {}
        }
      }
    };
  }, [router]);

  return (
    <>
      <main className="flex-1 pb-safe bg-black min-h-dvh flex flex-col">
        <header className="fixed top-0 left-0 right-0 z-30 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-white font-medium">Escanear Reporte</h1>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative w-full pt-16">
          {error ? (
            <div className="p-6 m-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-white font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white text-sm"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm aspect-square relative mx-auto">
              <div id="qr-reader" className="w-full h-full overflow-hidden rounded-3xl bg-gray-900 border-2 border-white/10 shadow-2xl"></div>
              
              {/* Overlay guides */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-2xl">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl -translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl -translate-x-[2px] translate-y-[2px]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl translate-x-[2px] translate-y-[2px]" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 text-center text-white/70 px-8">
            <Camera className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Apunta la cámara al código QR que aparece en los reportes exportados.</p>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
