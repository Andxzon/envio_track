// ============================================================================
// EnvioTrack — Página de Configuración
// ============================================================================
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Download, FileSpreadsheet, BellRing, Settings2, Package, ChevronRight, CloudUpload, Shield, Upload, X, LogOut } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BottomNav } from '@/components/ui/BottomNav';
import { signOutAction } from '@/app/login/actions';
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
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Modal de contraseña
  const [passwordModal, setPasswordModal] = useState<{ mode: 'export' | 'import'; file?: File } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportBackup = () => {
    setPassword('');
    setConfirmPassword('');
    setPasswordModal({ mode: 'export' });
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.etbak')) {
      addToast({ type: 'error', message: 'El archivo debe ser .etbak (backup de EnvioTrack)' });
      return;
    }
    setPassword('');
    setPasswordModal({ mode: 'import', file });
    // Reset the file input
    e.target.value = '';
  };

  const handlePasswordSubmit = async () => {
    if (!password || password.length < 4) {
      addToast({ type: 'error', message: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    if (passwordModal?.mode === 'export') {
      if (password !== confirmPassword) {
        addToast({ type: 'error', message: 'Las contraseñas no coinciden' });
        return;
      }
      setIsBackingUp(true);
      try {
        const backupService = await import('@/lib/backup-service');
        await backupService.exportBackup(password);
        addToast({ type: 'success', message: 'Backup encriptado descargado ✅' });
      } catch (e: any) {
        addToast({ type: 'error', message: e.message || 'Error al exportar backup' });
      } finally {
        setIsBackingUp(false);
        setPasswordModal(null);
        setPassword('');
        setConfirmPassword('');
      }
    } else if (passwordModal?.mode === 'import' && passwordModal.file) {
      setIsImporting(true);
      try {
        const backupService = await import('@/lib/backup-service');
        const count = await backupService.importBackup(passwordModal.file, password);
        
        // Auto-subir a la nube inmediatamente después de importar
        try {
          const migrationService = await import('@/lib/migration-service');
          await migrationService.migrateLocalDataToSupabase();
          addToast({ type: 'success', message: `${count} clientes importados y sincronizados con la nube ✅` });
        } catch (migrationError: any) {
          console.error(migrationError);
          addToast({ type: 'error', message: `${count} importados, pero falló al subir a la nube: ${migrationError.message}` });
        }
        
      } catch (e: any) {
        addToast({ type: 'error', message: e.message || 'Error al importar backup' });
      } finally {
        setIsImporting(false);
        setPasswordModal(null);
        setPassword('');
      }
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-4">
      {children}
    </h2>
  );

  const content = (
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

          {/* Copias de Seguridad */}
          <section>
            <SectionTitle>Copias de Seguridad</SectionTitle>
            <div className="bg-surface border-y sm:border-x sm:border-border sm:rounded-2xl overflow-hidden divide-y divide-border">
              <button
                onClick={handleExportBackup}
                disabled={isBackingUp}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Crear Backup Encriptado</span>
                    <span className="text-xs text-muted">Genera un archivo .etbak protegido con contraseña</span>
                  </div>
                </div>
                {isBackingUp ? (
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-accent animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-muted" />
                )}
              </button>

              <button
                onClick={handleImportBackup}
                disabled={isImporting}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
                    <Upload className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Restaurar Backup</span>
                    <span className="text-xs text-muted">Importa un archivo .etbak desde tu dispositivo</span>
                  </div>
                </div>
                {isImporting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-muted border-t-accent animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-muted" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".etbak"
              className="hidden"
              onChange={handleFileSelected}
            />
          </section>

          {/* Cuenta */}
          <section>
            <SectionTitle>Cuenta</SectionTitle>
            <div className="bg-surface border-y sm:border-x sm:border-border sm:rounded-2xl overflow-hidden divide-y divide-border">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-surface active:bg-surface-elevated transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                      <LogOut className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-sm font-medium text-red-500">Cerrar Sesión</span>
                  </div>
                </button>
              </form>
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

  // Modal de contraseña
  const modal = (
    <AnimatePresence>
      {passwordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPasswordModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-border"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {passwordModal.mode === 'export' ? '🔐 Proteger Backup' : '🔓 Desbloquear Backup'}
              </h3>
              <button onClick={() => setPasswordModal(null)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted">
              {passwordModal.mode === 'export'
                ? 'Escribe una contraseña para encriptar tu backup. La necesitarás para restaurarlo.'
                : 'Ingresa la contraseña con la que se creó este backup.'}
            </p>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              {passwordModal.mode === 'export' && (
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
            </div>

            <button
              onClick={handlePasswordSubmit}
              disabled={isBackingUp || isImporting}
              className="w-full py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(isBackingUp || isImporting) && (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {passwordModal.mode === 'export' ? 'Crear Backup' : 'Restaurar'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {content}
      {modal}
    </>
  );
}
