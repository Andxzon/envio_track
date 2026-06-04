'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Package } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Client } from '@/lib/types';

export default function ReportView({ report }: { report: any }) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const data = report.data as Client[];
  const totalEnvios = data.length;
  const totalRecaudado = data.filter(c => c.isPaid).reduce((acc, c) => acc + (c.price || 0), 0);
  const totalPorCobrar = data.filter(c => !c.isPaid).reduce((acc, c) => acc + (c.price || 0), 0);

  const formattedDate = format(new Date(report.created_at), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const exportService = await import('@/lib/export-service');
      await exportService.exportToPDF(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      const exportService = await import('@/lib/export-service');
      await exportService.exportToExcel(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 pb-24">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Reporte de Envíos</h1>
        <p className="text-sm text-muted mt-1">ID: {report.id.substring(0, 8)}...</p>
        <p className="text-xs font-medium text-muted mt-2 bg-surface-elevated inline-block px-3 py-1.5 rounded-full">
          Generado el {formattedDate}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 mb-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Resumen del Reporte</h3>
        
        <div className="flex justify-between items-center py-2 border-b border-border-light">
          <span className="text-muted text-sm">Total de envíos:</span>
          <span className="font-bold text-foreground">{totalEnvios}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border-light">
          <span className="text-muted text-sm">Total recaudado:</span>
          <span className="font-bold text-emerald-600">${totalRecaudado.toLocaleString('es-CO')}</span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-muted text-sm">Por cobrar:</span>
          <span className="font-bold text-red-500">${totalPorCobrar.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleDownloadPDF}
          disabled={isExportingPDF}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isExportingPDF ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          Descargar PDF original
        </button>

        <button
          onClick={handleDownloadExcel}
          disabled={isExportingExcel}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isExportingExcel ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <FileSpreadsheet className="w-5 h-5" />
          )}
          Descargar datos en Excel
        </button>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors font-medium underline-offset-4 hover:underline">
          Volver a la App Principal
        </Link>
      </div>
    </div>
  );
}
