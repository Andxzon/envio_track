// ============================================================================
// EnvioTrack — Servicio de exportación (Excel / PDF)
// ============================================================================
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { STATUS_CONFIG, PROVIDER_LABELS, type Client } from './types';

/**
 * Exportar a Excel (.xlsx) — importación dinámica para evitar SSR issues
 */
export async function exportToExcel(clients: Client[]) {
  const xlsx = await import('xlsx');

  const data = clients.map((c) => ({
    'Nombre': c.name,
    'Teléfono': c.phone,
    'Ciudad': c.city,
    'Dirección': c.address,
    'Guía': c.trackingNumber,
    'Transportadora': PROVIDER_LABELS[c.shippingProvider],
    'Estado': STATUS_CONFIG[c.status].label,
    'Precio': c.price || 0,
    'Pagado': c.isPaid ? 'Sí' : 'No',
    'Fecha Envío': format(new Date(c.shipDate), 'dd/MM/yyyy'),
    'Última Actualización': format(new Date(c.lastUpdate), 'dd/MM/yyyy HH:mm'),
    'Observaciones': c.notes,
  }));

  const ws = xlsx.utils.json_to_sheet(data);
  
  // Ajustar anchos de columna
  const colWidths = [
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, 
    { wch: 20 }, { wch: 30 }
  ];
  ws['!cols'] = colWidths;

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Envíos');

  const fileName = `EnvioTrack_Reporte_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  xlsx.writeFile(wb, fileName);
}

/**
 * Exportar a PDF — usa la API nativa del navegador (window.print) con un
 * iframe oculto para generar un PDF sin depender de jspdf (que trae
 * dependencias incompatibles con Next.js).
 */
export function exportToPDF(clients: Client[]) {
  const dateStr = format(new Date(), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });

  const rows = clients.map((c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.trackingNumber}</td>
      <td>${PROVIDER_LABELS[c.shippingProvider]}</td>
      <td>${c.city}</td>
      <td>${STATUS_CONFIG[c.status].label}</td>
      <td>$${(c.price || 0).toLocaleString('es-CO')}</td>
      <td>${c.isPaid ? 'Sí' : 'No'}</td>
      <td>${format(new Date(c.shipDate), 'dd/MM/yyyy')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>EnvioTrack - Reporte de Envíos</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a2e; }
        .header { margin-bottom: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 12px; }
        .header h1 { font-size: 22px; color: #6366f1; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #6366f1; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
        @media print {
          body { padding: 0; }
          @page { size: landscape; margin: 12mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 EnvioTrack — Reporte de Envíos</h1>
        <p>Generado el: ${dateStr}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Guía</th>
            <th>Transportadora</th>
            <th>Ciudad</th>
            <th>Estado</th>
            <th>Precio</th>
            <th>Pagado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Crear un iframe oculto para imprimir como PDF
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Esperar que el contenido cargue antes de imprimir
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Limpiar después de un momento
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };

    // Fallback por si onload no dispara (inline content)
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  }
}
