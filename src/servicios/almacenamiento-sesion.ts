import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import { Platform } from 'react-native';

import { ErrorAutenticacion } from './errores-autenticacion';

import type { SesionGuardada } from '@/tipos/usuario';

const CLAVE_SESION = 'cercau.sesion.v2';
const CLAVE_ANTERIOR = 'cercau.sesion.v1';
// SecureStore no existe en web. No hay alternativa persistente para el token.
const memoriaWeb = new Map<string, string>();

export async function leerSeguro(clave: string): Promise<string | null> {
  try {
    return Platform.OS === 'web' ? memoriaWeb.get(clave) ?? null : await SecureStore.getItemAsync(clave);
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos leer el acceso seguro. Intentá nuevamente.');
  }
}

export async function escribirSeguro(clave: string, contenido: string): Promise<void> {
  try {
    if (Platform.OS === 'web') memoriaWeb.set(clave, contenido);
    else await SecureStore.setItemAsync(clave, contenido, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos guardar el acceso seguro. Intentá nuevamente.');
  }
}

export async function borrarSeguro(clave: string): Promise<void> {
  try {
    if (Platform.OS === 'web') memoriaWeb.delete(clave);
    else await SecureStore.deleteItemAsync(clave);
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos eliminar el acceso seguro. Intentá nuevamente.');
  }
}

export async function generarIdentificador(): Promise<string> {
  const bytes = await getRandomBytesAsync(32);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function guardarSesion(usuarioId: string): Promise<void> {
  const sesion: SesionGuardada = {
    version: 2, token: await generarIdentificador(), usuarioId,
    venceEn: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  await escribirSeguro(CLAVE_SESION, JSON.stringify(sesion));
}

export async function eliminarSesion(): Promise<void> {
  // Borrar una sesión nunca elimina el perfil, sus preferencias ni sus favoritos.
  await borrarSeguro(CLAVE_ANTERIOR);
  await borrarSeguro(CLAVE_SESION);
}

export async function recuperarSesion(): Promise<SesionGuardada | null> {
  const contenido = await leerSeguro(CLAVE_SESION);
  if (Platform.OS === 'web') window.localStorage.removeItem(CLAVE_ANTERIOR);
  // El perfil de la etapa anterior no contenía token: requiere un nuevo login.
  if (await leerSeguro(CLAVE_ANTERIOR)) await borrarSeguro(CLAVE_ANTERIOR);
  if (contenido === null) return null;

  try {
    const sesion: unknown = JSON.parse(contenido);
    if (
      typeof sesion === 'object' && sesion !== null &&
      'version' in sesion && sesion.version === 2 &&
      'token' in sesion && typeof sesion.token === 'string' && /^[a-f0-9]{64}$/.test(sesion.token) &&
      'usuarioId' in sesion && typeof sesion.usuarioId === 'string' && sesion.usuarioId.length > 0 &&
      'venceEn' in sesion && typeof sesion.venceEn === 'number' && Number.isFinite(sesion.venceEn) && sesion.venceEn > Date.now()
    ) {
      return sesion as SesionGuardada;
    }
  } catch {
    // Un JSON incompleto se trata igual que una sesión con campos inválidos.
  }

  await eliminarSesion();
  throw new ErrorAutenticacion('SESION_INVALIDA', 'La sesión guardada no es válida. Volvé a iniciar sesión.');
}
