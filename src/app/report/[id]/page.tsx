import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Download, FileSpreadsheet, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Client } from '@/lib/types';
import ReportView from './ReportView';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignorar
          }
        },
      },
    }
  )

  const { data: report } = await supabase
    .from('reportes')
    .select('*')
    .eq('id', id)
    .single();

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-foreground text-center">Reporte no encontrado</h1>
        <p className="text-muted text-center mt-2 max-w-md">
          El reporte que buscas no existe o el enlace ha caducado. Asegúrate de escanear un código QR válido.
        </p>
        <Link href="/" className="mt-8 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return <ReportView report={report} />;
}
