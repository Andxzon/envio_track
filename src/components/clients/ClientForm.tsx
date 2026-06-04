// ============================================================================
// EnvioTrack — ClientForm (Agregar / Editar)
// ============================================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { STATUS_CONFIG, PROVIDER_LABELS, type ShipmentStatus, type ShippingProvider } from '@/lib/types';
import type { Client } from '@/lib/types';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import citiesData from '@/lib/data/colombia-cities.json';
import { RouteMap } from '@/components/routing/RouteMap';

// ─── Schema de validación ─────────────────────────────────────────────────────

const clientSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  phone: z.string().min(7, 'Teléfono inválido'),
  address: z.string().optional().or(z.literal('')),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  trackingNumber: z.string().min(3, 'La guía es obligatoria'),
  shippingProvider: z.enum(['interrapidisimo', 'coordinadora', 'servientrega', 'envia', 'otro'] as const),
  status: z.enum(['recibido', 'en_camino', 'devolucion', 'pendiente', 'cancelado'] as const),
  price: z.number().min(0, 'El precio no puede ser negativo').optional(),
  isPaid: z.boolean(),
  notes: z.string().optional(),
  shipDate: z.string().min(1, 'La fecha es obligatoria'),
});

type ClientFormData = z.infer<typeof clientSchema>;

// ─── Componente ───────────────────────────────────────────────────────────────

interface ClientFormProps {
  editClient?: Client;
}

export function ClientForm({ editClient }: ClientFormProps) {
  const router = useRouter();
  const addClient = useAppStore((s) => s.addClient);
  const updateClient = useAppStore((s) => s.updateClient);
  const addToast = useAppStore((s) => s.addToast);
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: editClient
      ? {
          name: editClient.name,
          phone: editClient.phone,
          address: editClient.address,
          city: editClient.city,
          trackingNumber: editClient.trackingNumber,
          shippingProvider: editClient.shippingProvider,
          status: editClient.status,
          price: editClient.price ?? undefined,
          isPaid: editClient.isPaid || false,
          notes: editClient.notes,
          shipDate: editClient.shipDate.split('T')[0],
        }
      : {
          status: 'pendiente' as const,
          shippingProvider: 'interrapidisimo' as const,
          shipDate: new Date().toISOString().split('T')[0],
          price: undefined,
          isPaid: false,
        },
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto-guardado en localStorage (borrador)
  const watchedValues = watch();
  useEffect(() => {
    if (!editClient && !isSubmitted) {
      const timer = setTimeout(() => {
        localStorage.setItem('enviotrack-draft', JSON.stringify(watchedValues));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchedValues, editClient, isSubmitted]);

  // Cargar borrador al montar
  useEffect(() => {
    if (!editClient) {
      const draft = localStorage.getItem('enviotrack-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          reset(parsed);
        } catch { /* ignorar */ }
      }
    }
  }, [editClient, reset]);

  const onSubmit = (data: ClientFormData) => {
    let clientId: string;

    if (editClient) {
      clientId = editClient.id;
      updateClient(clientId, {
        ...data,
        shipDate: new Date(data.shipDate).toISOString(),
        notes: data.notes || '',
        address: data.address || '',
        price: data.price || 0,
        isPaid: data.isPaid || false,
        isSyncing: true, // Mostrar spinner
      });
      addToast({ type: 'success', message: 'Cliente actualizado localmente. Subiendo...' });
    } else {
      clientId = addClient({
        ...data,
        shipDate: new Date(data.shipDate).toISOString(),
        notes: data.notes || '',
        address: data.address || '',
        price: data.price || 0,
        isPaid: data.isPaid || false,
      });
      setIsSubmitted(true);
      localStorage.removeItem('enviotrack-draft');
      
      // Reiniciar formulario para evitar que Next.js cachee el estado
      reset({
        name: '',
        phone: '',
        address: '',
        city: '',
        trackingNumber: '',
        shippingProvider: 'interrapidisimo',
        status: 'pendiente',
        price: undefined,
        isPaid: false,
        notes: '',
        shipDate: new Date().toISOString().split('T')[0],
      });
      
      addToast({ type: 'success', message: 'Cliente guardado localmente. Subiendo...' });
    }

    // Disparar subida en segundo plano
    import('@/lib/migration-service').then((m) => {
      m.uploadSingleClient(clientId);
    });

    setSaved(true);
    setTimeout(() => router.push('/'), 600);
  };

  const inputClass = (field: keyof ClientFormData) =>
    `input-base ${errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`;

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">
          {editClient ? 'Editar cliente' : 'Nuevo envío'}
        </h1>
      </div>

      {/* Campos del formulario */}
      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Nombre del cliente *
          </label>
          <input
            {...register('name')}
            className={inputClass('name')}
            placeholder="Ej: María García"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Teléfono *
          </label>
          <input
            {...register('phone')}
            type="tel"
            className={inputClass('phone')}
            placeholder="Ej: 300 123 4567"
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Dirección */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Dirección
          </label>
          <input
            {...register('address')}
            className={inputClass('address')}
            placeholder="Ej: Calle 45 #12-34"
          />
          {errors.address && (
            <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* Ciudad */}
        <div className="relative z-20">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Ciudad *
          </label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <CityAutocomplete
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.city?.message}
              />
            )}
          />
          {errors.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
          )}

          {/* Mapa y Estimación de tiempo (si la ciudad tiene coordenadas) */}
          {(() => {
            if (!watch('city')) return null;
            const selectedCityData = citiesData.find(c => `${c.city}, ${c.department}` === watch('city'));
            if (selectedCityData && selectedCityData.lat && selectedCityData.lng) {
              return <RouteMap destLat={selectedCityData.lat} destLng={selectedCityData.lng} />;
            }
            return null;
          })()}
        </div>

        {/* Guía */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Número de guía *
          </label>
          <input
            {...register('trackingNumber')}
            className={inputClass('trackingNumber')}
            placeholder="Ej: 1234567890"
          />
          {errors.trackingNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.trackingNumber.message}</p>
          )}
        </div>

        {/* Transportadora */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Transportadora *
          </label>
          <select
            {...register('shippingProvider')}
            className={inputClass('shippingProvider')}
          >
            {(Object.entries(PROVIDER_LABELS) as [ShippingProvider, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Estado del envío
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(STATUS_CONFIG) as [ShipmentStatus, typeof STATUS_CONFIG[ShipmentStatus]][]).map(
              ([value, config]) => (
                <label
                  key={value}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    watch('status') === value
                      ? `${config.bgClass} border-current ${config.textClass}`
                      : 'border-border bg-surface hover:bg-surface-elevated'
                  }`}
                >
                  <input
                    type="radio"
                    value={value}
                    {...register('status')}
                    className="sr-only"
                  />
                  <span className="text-sm">{config.emoji}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Fecha de envío */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Fecha de envío *
          </label>
          <input
            {...register('shipDate')}
            type="date"
            className={inputClass('shipDate')}
          />
          {errors.shipDate && (
            <p className="text-xs text-red-500 mt-1">{errors.shipDate.message}</p>
          )}
        </div>

        {/* Precio de venta */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Precio de venta
          </label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">$</span>
                <input
                  {...field}
                  type="text"
                  min="0"
                  step="100"
                  className={`${inputClass('price')} !pl-8`}
                  placeholder=""
                  value={field.value ? Number(field.value).toLocaleString('es-CO') : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '');
                    field.onChange(raw ? Number(raw) : undefined);
                  }}
                />
              </div>
            )}
          />
        </div>

        {/* Estado de pago */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Estado de pago
          </label>
          <label
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
              watch('isPaid')
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600'
                : 'border-border bg-surface hover:bg-surface-elevated'
            }`}
          >
            <input
              type="checkbox"
              {...register('isPaid')}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              watch('isPaid')
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-border'
            }`}>
              {watch('isPaid') && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">
              {watch('isPaid') ? '✅ Pagado' : 'Marcar como pagado'}
            </span>
          </label>
        </div>

        {/* Observaciones */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Observaciones
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className={`${inputClass('notes')} resize-none`}
            placeholder="Notas adicionales sobre el envío..."
          />
        </div>
      </div>

      {/* Botón guardar */}
      <motion.button
        type="submit"
        disabled={isSubmitting || saved}
        whileTap={{ scale: 0.97 }}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-semibold text-base transition-all ${
          saved
            ? 'bg-emerald-500'
            : 'bg-accent hover:bg-accent-hover active:bg-accent-hover'
        } disabled:opacity-70`}
      >
        {saved ? (
          <>
            <Check className="w-5 h-5" />
            ¡Guardado!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {editClient ? 'Actualizar' : 'Guardar envío'}
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
