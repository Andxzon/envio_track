import { createClient } from './supabase/client';
import { useAppStore } from './store';
import type { Client } from './types';

/**
 * Migra todos los clientes almacenados en la memoria local hacia la base de datos Supabase.
 * Retorna true si fue exitoso, lanza un error si falla.
 */
export async function migrateLocalDataToSupabase(): Promise<boolean> {
  const supabase = createClient();
  const state = useAppStore.getState();
  const localClients = state.clients;

  if (!localClients || localClients.length === 0) {
    throw new Error('No hay datos locales para migrar.');
  }

  // Preparamos los datos para que coincidan con la tabla (los nombres de propiedades ya coinciden con las columnas en BD)
  const dataToInsert = localClients.map((client: Client) => ({
    id: client.id,
    name: client.name,
    phone: client.phone,
    address: client.address,
    city: client.city,
    trackingNumber: client.trackingNumber,
    shippingProvider: client.shippingProvider,
    status: client.status,
    price: client.price,
    isPaid: client.isPaid,
    notes: client.notes,
    shipDate: client.shipDate,
    lastUpdate: client.lastUpdate,
    createdAt: client.createdAt,
    deletedAt: client.deletedAt,
    trackingHistory: client.trackingHistory,
  }));

  // Hacemos el bulk insert (upsert para evitar errores si ya existen por algún id duplicado)
  const { error } = await supabase
    .from('clientes')
    .upsert(dataToInsert);

  if (error) {
    console.error('Error migrando datos a Supabase:', error);
    throw new Error('Ocurrió un error al guardar los datos en la nube.');
  }

  // Si fue exitoso, descargamos los datos de Supabase para tenerlos sincronizados
  // y con la etiqueta syncedToCloud en true.
  await syncFromSupabase();

  return true;
}

/**
 * Descarga los clientes desde Supabase y los guarda en la memoria local,
 * marcándolos con el icono de la nube.
 */
export async function syncFromSupabase(): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase.from('clientes').select('*');
  
  if (error) {
    console.error('Error sincronizando desde Supabase:', error);
    throw new Error('No se pudieron descargar los datos de la nube.');
  }

  if (data) {
    const cloudClients: Client[] = data.map((d: any) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      address: d.address,
      city: d.city,
      trackingNumber: d.trackingNumber,
      shippingProvider: d.shippingProvider,
      status: d.status,
      price: Number(d.price),
      isPaid: d.isPaid,
      notes: d.notes,
      shipDate: d.shipDate,
      lastUpdate: d.lastUpdate,
      createdAt: d.createdAt,
      deletedAt: d.deletedAt || null,
      trackingHistory: d.trackingHistory || [],
      syncedToCloud: true,
    }));

    const currentClients = useAppStore.getState().clients;
    
    // Conservar los clientes locales que NO han sido subidos a la nube aún
    const unsyncedLocalClients = currentClients.filter(c => !c.syncedToCloud);
    
    const unsyncedIds = new Set(unsyncedLocalClients.map(c => c.id));
    
    // Fusionar: Clientes locales pendientes + Clientes de la nube
    // Si hay un conflicto de ID, gana el local que tiene cambios sin subir
    const finalClients = [
      ...unsyncedLocalClients,
      ...cloudClients.filter(c => !unsyncedIds.has(c.id))
    ];

    useAppStore.setState({ clients: finalClients });
  }

  return true;
}

/**
 * Sube un solo cliente a Supabase y actualiza su estado local a sincronizado.
 */
export async function uploadSingleClient(id: string): Promise<boolean> {
  const state = useAppStore.getState();
  const client = state.clients.find(c => c.id === id);
  if (!client) return false;

  const supabase = createClient();
  
  const dataToInsert = {
    id: client.id,
    name: client.name,
    phone: client.phone,
    address: client.address,
    city: client.city,
    trackingNumber: client.trackingNumber,
    shippingProvider: client.shippingProvider,
    status: client.status,
    price: client.price,
    isPaid: client.isPaid,
    notes: client.notes,
    shipDate: client.shipDate,
    lastUpdate: client.lastUpdate,
    createdAt: client.createdAt,
    deletedAt: client.deletedAt,
    trackingHistory: client.trackingHistory,
  };

  const { error } = await supabase.from('clientes').upsert(dataToInsert);

  if (error) {
    console.error('Error subiendo cliente:', error);
    // Marcamos como no sincronizado si falló
    state.updateClient(id, { isSyncing: false, syncedToCloud: false });
    return false;
  }

  // Marcamos como sincronizado
  state.updateClient(id, { isSyncing: false, syncedToCloud: true });
  return true;
}

/**
 * Busca todos los clientes locales que no estén sincronizados y los sube a Supabase.
 * Esto es útil cuando la app vuelve a tener conexión a internet.
 */
export async function syncPendingClients(): Promise<void> {
  const state = useAppStore.getState();
  const pendingClients = state.clients.filter(c => !c.syncedToCloud);
  
  if (pendingClients.length === 0) return;

  for (const client of pendingClients) {
    // Ponemos isSyncing en true antes de subir
    state.updateClient(client.id, { isSyncing: true });
    // Subimos de a uno por uno
    await uploadSingleClient(client.id);
  }
}
