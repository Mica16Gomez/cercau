import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ErrorAutenticacion } from './errores-autenticacion';

import type { SesionGuardada } from '@/tipos/usuario';

const CLAVE_SESION = 'cercau.sesion.v3';
const CLAVES_ANTERIORES = ['cercau.sesion.v1', 'cercau.sesion.v2'];
// SecureStore no existe en web. No hay alternativa persistente para el token.
const memoriaWeb = new Map<string, string>();
const oyentes = new Set<() => void>();
let sesionInvalidada = false;

export function suscribirSesionInvalidada(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => { oyentes.delete(oyente); };
}

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

export async function guardarSesion(token: string, usuarioId: string): Promise<void> {
  const sesion: SesionGuardada = { version: 3, token, usuarioId };
  await escribirSeguro(CLAVE_SESION, JSON.stringify(sesion));
  sesionInvalidada = false;
}

export async function eliminarSesion(): Promise<void> {
  // Borrar una sesión nunca elimina el perfil, sus preferencias ni sus favoritos.
  for (const clave of CLAVES_ANTERIORES) await borrarSeguro(clave);
  await borrarSeguro(CLAVE_SESION);
}

export async function invalidarSesion(token: string): Promise<void> {
  const actual = await recuperarSesion();
  // Un 401 de una petición anterior no debe cerrar una sesión recién iniciada.
  if (actual?.token !== token) return;
  sesionInvalidada = true;
  try { await eliminarSesion(); }
  finally { oyentes.forEach((oyente) => oyente()); }
}

export async function recuperarSesion(): Promise<SesionGuardada | null> {
  if (sesionInvalidada) return null;
  const contenido = await leerSeguro(CLAVE_SESION);
  // Las sesiones simuladas nunca se usan como credenciales de la API.
  for (const clave of CLAVES_ANTERIORES) {
    if (Platform.OS === 'web') window.localStorage.removeItem(clave);
    if (await leerSeguro(clave)) await borrarSeguro(clave);
  }
  if (contenido === null) return null;

  try {
    const sesion: unknown = JSON.parse(contenido);
    if (
      typeof sesion === 'object' && sesion !== null &&
      'version' in sesion && sesion.version === 3 &&
      'token' in sesion && typeof sesion.token === 'string' && sesion.token.trim().length > 0 &&
      'usuarioId' in sesion && typeof sesion.usuarioId === 'string' && sesion.usuarioId.length > 0
    ) {
      return sesion as SesionGuardada;
    }
  } catch {
    // Un JSON incompleto se trata igual que una sesión con campos inválidos.
  }

  await eliminarSesion();
  throw new ErrorAutenticacion('SESION_INVALIDA', 'La sesión guardada no es válida. Volvé a iniciar sesión.');
}
