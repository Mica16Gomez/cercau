/**
 * Acceso de prueba exclusivo del Rol 4.
 * No modifica ni reemplaza la autenticación del Rol 1.
 * El token permanece solo en memoria y nunca se escribe en SQLite.
 */
import axios, { isAxiosError } from 'axios';

export interface UsuarioPruebaResenas {
  id: string;
  nombre: string;
  rol: string;
  comercioId: string | null;
}

export interface SesionPruebaResenas {
  token: string;
  usuario: UsuarioPruebaResenas;
}

function esUsuarioPrueba(valor: unknown): valor is UsuarioPruebaResenas {
  if (!valor || typeof valor !== 'object') return false;
  const usuario = valor as Record<string, unknown>;
  return (
    typeof usuario.id === 'string' &&
    typeof usuario.nombre === 'string' &&
    typeof usuario.rol === 'string' &&
    (usuario.comercioId === null || typeof usuario.comercioId === 'string')
  );
}

export async function ingresarApiResenas(
  email: string,
  contrasena: string
): Promise<SesionPruebaResenas> {
  const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!baseURL) throw new Error('Falta EXPO_PUBLIC_API_URL en .env.');
  if (!email.trim() || !contrasena) {
    throw new Error('Ingresá un correo y una contraseña.');
  }

  try {
    const respuesta = await axios.post<{ datos?: unknown }>(
      '/auth/ingreso',
      { email: email.trim().toLowerCase(), contrasena },
      { baseURL: baseURL.replace(/\/+$/, ''), timeout: 12000 }
    );
    const sobre = respuesta.data?.datos;
    if (!sobre || typeof sobre !== 'object') throw new Error('La API no devolvió una sesión válida.');
    const datos = sobre as Record<string, unknown>;
    if (typeof datos.token !== 'string' || !datos.token.trim() || !esUsuarioPrueba(datos.usuario)) {
      throw new Error('La respuesta de la API no contiene una sesión válida.');
    }
    return { token: datos.token, usuario: datos.usuario };
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 401) throw new Error('Correo o contraseña incorrectos.');
      if (!error.response) throw new Error('No se pudo conectar con Docker. Revisá Internet y EXPO_PUBLIC_API_URL.');
      const cuerpo: unknown = error.response.data;
      if (cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo) {
        const detalle = (cuerpo as { error?: { mensaje?: string } }).error;
        if (detalle?.mensaje) throw new Error(detalle.mensaje);
      }
      throw new Error(`La API rechazó el ingreso (HTTP ${error.response.status}).`);
    }
    throw error;
  }
}
