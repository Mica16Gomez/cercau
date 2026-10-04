import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ErrorAutenticacion } from './errores-autenticacion';

import { esUsuario, type Usuario } from '@/tipos/usuario';

const CLAVE_SESION = 'cercau.sesion.v1';

export async function guardarSesion(usuario: Usuario): Promise<void> {
  // Solo persiste el perfil simulado. Nunca guardamos la contraseña en la sesión.
  const contenido = JSON.stringify({ version: 1, usuario });
  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(CLAVE_SESION, contenido);
    } else {
      await SecureStore.setItemAsync(CLAVE_SESION, contenido);
    }
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos guardar la sesión. Intentá nuevamente.');
  }
}

export async function eliminarSesion(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(CLAVE_SESION);
    } else {
      await SecureStore.deleteItemAsync(CLAVE_SESION);
    }
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos cerrar la sesión guardada. Intentá nuevamente.');
  }
}

export async function recuperarSesion(): Promise<Usuario | null> {
  let contenido: string | null;
  try {
    // El efecto del proveedor se ejecuta solo en el cliente, después del render estático web.
    contenido = Platform.OS === 'web'
      ? window.localStorage.getItem(CLAVE_SESION)
      : await SecureStore.getItemAsync(CLAVE_SESION);
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos recuperar tu sesión. Podés volver a iniciar sesión.');
  }

  if (contenido === null) return null;

  try {
    const sesion: unknown = JSON.parse(contenido);
    if (
      typeof sesion === 'object' && sesion !== null &&
      'version' in sesion && sesion.version === 1 &&
      'usuario' in sesion && esUsuario(sesion.usuario)
    ) {
      const { id, nombre, email, rol } = sesion.usuario;
      return { id, nombre, email, rol };
    }
  } catch {
    // Un JSON incompleto se trata igual que una sesión con campos inválidos.
  }

  await eliminarSesion();
  throw new ErrorAutenticacion('SESION_INVALIDA', 'La sesión guardada no es válida. Volvé a iniciar sesión.');
}
