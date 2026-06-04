// ============================================================================
// EnvioTrack — Servicio de exportación (Excel / PDF) Profesional
// ============================================================================
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import QRCode from 'qrcode';
import { createClient } from './supabase/client';
import { STATUS_CONFIG, PROVIDER_LABELS, type Client } from './types';

/**
 * Genera un ID único para el reporte.
 */
function generateReportId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Guarda el snapshot del reporte en Supabase.
 */
async function saveReportToSupabase(id: string, type: string, fileName: string, data: Client[]) {
  const supabase = createClient();
  const { error } = await supabase.from('reportes').insert({
    id,
    type,
    file_name: fileName,
    data,
  });

  if (error) {
    console.error('Error guardando reporte en la base de datos:', error);
  }
}

/**
 * Genera el QR como base64 data URL.
 */
async function generateQRCode(reportId: string): Promise<string> {
  const url = `${window.location.origin}/report/${reportId}`;
  try {
    return await QRCode.toDataURL(url, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } });
  } catch (err) {
    console.error(err);
    return '';
  }
}

/**
 * Exportar a Excel (.xlsx) — Diseño Profesional
 */
export async function exportToExcel(clients: Client[]) {
  const xlsx = await import('xlsx');
  
  const reportId = generateReportId();
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `EnvioTrack_Reporte_${dateStr}.xlsx`;

  // Guardar en la nube
  await saveReportToSupabase(reportId, 'excel', fileName, clients);

  const reportUrl = `${window.location.origin}/report/${reportId}`;

  // Resumen financiero
  const totalEnvios = clients.length;
  const totalRecaudado = clients.filter(c => c.isPaid).reduce((acc, c) => acc + (c.price || 0), 0);
  const totalPorCobrar = clients.filter(c => !c.isPaid).reduce((acc, c) => acc + (c.price || 0), 0);

  // Datos de la tabla
  const data = clients.map((c) => ({
    'Nombre del Cliente': c.name,
    'Teléfono': c.phone,
    'Ciudad de Destino': c.city,
    'Dirección': c.address,
    'Guía de Seguimiento': c.trackingNumber,
    'Transportadora': PROVIDER_LABELS[c.shippingProvider],
    'Estado Actual': STATUS_CONFIG[c.status].label,
    'Precio ($)': c.price ?? '',
    'Estado Pago': c.isPaid ? 'Pagado' : 'Por cobrar',
    'Fecha de Envío': format(new Date(c.shipDate), 'dd/MM/yyyy'),
    'Observaciones': c.notes,
  }));

  const ws = xlsx.utils.json_to_sheet([]);
  
  // Agregar encabezados personalizados (Title y URL)
  xlsx.utils.sheet_add_aoa(ws, [
    ['📦 EnvioTrack — Reporte de Envíos'],
    [`Generado el: ${format(new Date(), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}`],
    [`Código de Reporte Seguro: ${reportId}`],
    [`Ver en línea: ${reportUrl}`],
    [],
    ['📊 RESUMEN FINANCIERO'],
    ['Total Envíos:', totalEnvios],
    ['Total Recaudado:', `$${totalRecaudado.toLocaleString('es-CO')}`],
    ['Total Por Cobrar:', `$${totalPorCobrar.toLocaleString('es-CO')}`],
    [],
  ], { origin: 'A1' });

  // Agregar los datos empezando desde la fila 12
  xlsx.utils.sheet_add_json(ws, data, { origin: 'A12' });

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 20 },
    { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, 
    { wch: 30 }
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Reporte de Envíos');

  xlsx.writeFile(wb, fileName);
}

/**
 * Exportar a PDF — Diseño Profesional con QR
 */
export async function exportToPDF(clients: Client[]) {
  const reportId = generateReportId();
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `EnvioTrack_Reporte_${dateStr}.pdf`;

  // Guardar en la nube
  await saveReportToSupabase(reportId, 'pdf', fileName, clients);

  const qrDataUrl = await generateQRCode(reportId);
  const formattedDate = format(new Date(), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });

  const totalEnvios = clients.length;
  const totalRecaudado = clients.filter(c => c.isPaid).reduce((acc, c) => acc + (c.price || 0), 0);
  const totalPorCobrar = clients.filter(c => !c.isPaid).reduce((acc, c) => acc + (c.price || 0), 0);

  const rows = clients.map((c) => {
    const config = STATUS_CONFIG[c.status];
    return `
    <tr>
      <td style="font-weight: 500;">${c.name}</td>
      <td style="font-family: monospace; font-size: 11px;">${c.trackingNumber}</td>
      <td>${PROVIDER_LABELS[c.shippingProvider]}</td>
      <td>${c.city}</td>
      <td>
        <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; background-color: ${config.color}20; color: ${config.color}; font-weight: 600; font-size: 10px;">
          ${config.label}
        </span>
      </td>
      <td style="font-weight: 600;">${c.price != null ? `$${c.price.toLocaleString('es-CO')}` : ''}</td>
      <td>
        ${c.price != null && c.price > 0 ? (c.isPaid 
          ? '<span style="color: #059669; font-weight: 600;">Pagado</span>' 
          : '<span style="color: #dc2626; font-weight: 600;">Por cobrar</span>')
          : '<span style="color: #6b7280;">-</span>'}
      </td>
      <td>${format(new Date(c.shipDate), 'dd/MM/yyyy')}</td>
    </tr>
  `}).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${fileName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: landscape; margin: 15mm; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          color: #1f2937; 
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          border-bottom: 3px solid #4f46e5; 
          padding-bottom: 20px; 
          margin-bottom: 24px; 
        }
        .header-title h1 { 
          font-size: 28px; 
          color: #111827; 
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-title p { 
          font-size: 13px; 
          color: #6b7280; 
        }
        .qr-container {
          text-align: right;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .qr-text {
          font-size: 11px;
          color: #4b5563;
          text-align: right;
        }
        .qr-code {
          width: 80px;
          height: 80px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 4px;
        }
        .summary-cards {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }
        .card {
          flex: 1;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
        }
        .card h3 {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .card p {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }
        .card.highlight p {
          color: #4f46e5;
        }
        table { 
          width: 100%; 
          border-collapse: separate; 
          border-spacing: 0;
          font-size: 12px; 
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        th { 
          background: #f3f4f6; 
          color: #374151; 
          text-align: left; 
          padding: 12px 16px; 
          font-weight: 600; 
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }
        td { 
          padding: 12px 16px; 
          border-bottom: 1px solid #e5e7eb; 
          color: #4b5563;
        }
        tr:last-child td {
          border-bottom: none;
        }
        tr:nth-child(even) td { 
          background: #fafafa; 
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-title">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            EnvioTrack — Reporte Oficial
          </h1>
          <p>Generado el: ${formattedDate}</p>
        </div>
        <div class="qr-container">
          <div class="qr-text">
            <p style="font-weight: 600; color: #111827;">Escanea para descargar</p>
            <p>Reporte #${reportId.substring(0, 8)}</p>
          </div>
          <img src="${qrDataUrl}" alt="QR Code" class="qr-code" />
        </div>
      </div>

      <div class="summary-cards">
        <div class="card highlight">
          <h3>Total de Envíos</h3>
          <p>${totalEnvios}</p>
        </div>
        <div class="card">
          <h3>Total Recaudado</h3>
          <p>$${totalRecaudado.toLocaleString('es-CO')}</p>
        </div>
        <div class="card">
          <h3>Total por Cobrar</h3>
          <p style="color: #dc2626;">$${totalPorCobrar.toLocaleString('es-CO')}</p>
        </div>
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
            <th>Pago</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        <p>Documento generado por EnvioTrack — Sistema de Gestión Logística</p>
        <p>Verifica este reporte en línea escaneando el código QR en la parte superior.</p>
      </div>
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

    iframe.onload = () => {
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.document.title = fileName;
          iframe.contentWindow.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 500); // Esperar un poco más para que cargue la imagen QR
    };

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        if (iframe.contentWindow) {
          iframe.contentWindow.document.title = fileName;
          iframe.contentWindow.print();
        }
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    }, 1000);
  }
}
