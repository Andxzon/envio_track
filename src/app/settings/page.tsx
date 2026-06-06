// ============================================================================
// EnvioTrack — Página de Configuración
// ============================================================================
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Download, FileSpreadsheet, BellRing, Settings2, Package, ChevronRight, CloudUpload } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/ui/BottomNav';
// export-service se importa dinámicamente en cada handler para evitar SSR issues

export default function SettingsPage() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const clients = useAppStore((s) => s.clients);
  const addToast = useAppStore((s) => s.addToast);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const migrationService = await import('@/lib/migration-service');
      await migrationService.syncFromSupabase();
      addToast({ type: 'success', message: 'Datos sincronizados con éxito' });
    } catch (e: any) {
      addToast({ type: 'error', message: e.message || 'Error al sincronizar' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const activeClients = clients.filter((c) => c.deletedAt === null);
      if (activeClients.length === 0) {
        addToast({ type: 'info', message: 'No hay datos locales para migrar' });
        return;
      }
      const migrationService = await import('@/lib/migration-service');
      await migrationService.migrateLocalDataToSupabase();
      addToast({ type: 'success', message: 'Datos migrados a la nube correctamente' });
    } catch (e: any) {
      addToast({ type: 'error', message: e.message || 'Error al migrar datos' });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const activeClients = clients.filter((c) => c.deletedAt === null);
      if (activeClients.length === 0) {
        addToast({ type: 'info', message: 'No hay datos para exportar' });
        return;
      }
      const exportService = await import('@/lib/export-service');
      await exportService.exportToExcel(activeClients);
      addToast({ type: 'success', message: 'Excel exportado correctamente' });
    } catch (e) {
      addToast({ type: 'error', message: 'Error al exportar a Excel' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const activeClients = clients.filter((c) => c.deletedAt === null);
      if (activeClients.length === 0) {
        addToast({ type: 'info', message: 'No hay datos para exportar' });
        return;
      }
      const exportService = await import('@/lib/export-service');
      exportService.exportToPDF(activeClients);
      addToast({ type: 'success', message: 'PDF exportado correctamente' });
    } catch (e) {
      addToast({ type: 'error', message: 'Error al exportar a PDF' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-4">
      {children}
    </h2>
  );

  return (
    <>
      <main className="flex-1 pb-safe">
        <header className="sticky top-0 z-30 glass border-b border-border-light px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-foreground">Ajustes</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto py-6 space-y-8">
          
          {/* Preferencias */}
          <section>
            <SectionTitle>Preferencias</SectionTitle>
            <div className="bg-surface border-y sm:border-x sm:border-border sm:rounded-2xl overflow-hidden divide-y divide-border">
              {/* Tema Oscuro */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    {isDarkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">Modo Oscuro</span>
                </div>
                <button
                  role="switch"
                  aria-checked={isDarkMode}
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    } shadow-sm`}
                  />
                </button>
              </div>

              {/* Notificaciones (UI mockup) */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                    <BellRing className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Notificaciones Push</span>
                    <span className="text-xs text-muted">Avisar cambios de estado</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted" />
              </div>
            </div>
          </section>

          {/* Base de Datos */}
          <section>
            <SectionTitle>Base de Datos</SectionTitle>
            <div className="bg-surface border-y sm:border-x sm:border-border sm:rounded-2xl overflow-hidden divide-y divide-border">
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <CloudUpload className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Subir a la nube</span>
                    <span className="text-xs text-muted">Respalda tus datos locales en Supabase</span>
                  </div>
                </div>
                {isMigrating ? (
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-accent animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted" />
                )}
              </button>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Sincronizar desde la nube</span>
                    <span className="text-xs text-muted">Descarga tus datos guardados en Supabase</span>
                  </div>
                </div>
                {isSyncing ? (
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-accent animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted" />
                )}
              </button>
            </div>
          </section>

          {/* Datos y Exportación */}
          <section>
            <SectionTitle>Datos y Exportación</SectionTitle>
            <div className="bg-surface border-y sm:border-x sm:border-border sm:rounded-2xl overflow-hidden divide-y divide-border">
              
              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Exportar a Excel (.xlsx)</span>
                </div>
                {isExportingExcel ? (
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-accent animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-muted" />
                )}
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Exportar a PDF</span>
                </div>
                {isExportingPdf ? (
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-accent animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-muted" />
                )}
              </button>

            </div>
          </section>

          {/* Info */}
          <section className="px-4">
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-md">
                <Settings2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground">EnvioTrack</h3>
                <p className="text-xs text-muted">Versión 1.1 alpha (PWA)</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
