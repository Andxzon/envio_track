// ============================================================================
// EnvioTrack — Servicio de Copias de Seguridad Encriptadas
// ============================================================================

import { useAppStore } from './store';
import type { Client } from './types';

// ─── Constantes ──────────────────────────────────────────────────────────────
const BACKUP_MAGIC = 'ENVIOTRACK_BACKUP';
const BACKUP_VERSION = 1;
const PBKDF2_ITERATIONS = 100000;

// ─── Utilidades de Cripto ────────────────────────────────────────────────────

/** Deriva una clave AES-256-GCM a partir de una contraseña usando PBKDF2 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Convierte un ArrayBuffer a una cadena Base64 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convierte una cadena Base64 a un ArrayBuffer */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Exportar ────────────────────────────────────────────────────────────────

/**
 * Exporta todos los clientes activos como un archivo .etbak encriptado con AES-256-GCM.
 * El archivo se descarga automáticamente en el dispositivo del usuario.
 */
export async function exportBackup(password: string): Promise<void> {
  const clients = useAppStore.getState().clients;
  const activeClients = clients.filter(c => !c.deletedAt);

  if (activeClients.length === 0) {
    throw new Error('No hay clientes para exportar');
  }

  // Preparar el payload en texto plano
  const payload = JSON.stringify({
    magic: BACKUP_MAGIC,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clientCount: activeClients.length,
    clients: activeClients,
  });

  // Generar salt e IV aleatorios
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derivar la clave y encriptar
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    new TextEncoder().encode(payload)
  );

  // Empaquetar: salt + iv + encrypted en un solo objeto JSON base64
  const backupFile = JSON.stringify({
    magic: BACKUP_MAGIC,
    version: BACKUP_VERSION,
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(encrypted),
  });

  // Descargar el archivo
  const blob = new Blob([backupFile], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `enviotrack-backup-${date}.etbak`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Importar ────────────────────────────────────────────────────────────────

/**
 * Importa un archivo .etbak encriptado. Desencripta con la contraseña proporcionada
 * y fusiona los clientes importados con los existentes (sin duplicar).
 */
export async function importBackup(file: File, password: string): Promise<number> {
  const text = await file.text();

  let envelope: any;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un backup válido de EnvioTrack');
  }

  if (envelope.magic !== BACKUP_MAGIC) {
    throw new Error('El archivo no es un backup válido de EnvioTrack');
  }

  // Recuperar salt, iv y datos encriptados
  const salt = new Uint8Array(base64ToBuffer(envelope.salt));
  const iv = new Uint8Array(base64ToBuffer(envelope.iv));
  const encryptedData = base64ToBuffer(envelope.data);

  // Derivar la clave con la contraseña ingresada
  const key = await deriveKey(password, salt);

  let decrypted: ArrayBuffer;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      encryptedData
    );
  } catch {
    throw new Error('Contraseña incorrecta. No se pudo desencriptar el backup.');
  }

  const payloadText = new TextDecoder().decode(decrypted);
  let payload: any;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    throw new Error('El archivo de backup está corrupto');
  }

  if (payload.magic !== BACKUP_MAGIC || !Array.isArray(payload.clients)) {
    throw new Error('El contenido del backup no es válido');
  }

  const importedClients: Client[] = payload.clients;

  // Fusionar: si un cliente importado ya existe localmente, el más nuevo gana
  const currentClients = useAppStore.getState().clients;
  const currentMap = new Map(currentClients.map(c => [c.id, c]));
  let importedCount = 0;

  for (const imported of importedClients) {
    const existing = currentMap.get(imported.id);
    if (!existing) {
      // Cliente nuevo, agregarlo
      currentMap.set(imported.id, { ...imported, syncedToCloud: false });
      importedCount++;
    } else {
      // Existe: el más reciente gana
      const importedTime = new Date(imported.lastUpdate).getTime();
      const existingTime = new Date(existing.lastUpdate).getTime();
      if (importedTime > existingTime) {
        currentMap.set(imported.id, { ...imported, syncedToCloud: false });
        importedCount++;
      }
    }
  }

  useAppStore.setState({ clients: Array.from(currentMap.values()) });

  return importedCount;
}
