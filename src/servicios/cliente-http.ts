import { create, isAxiosError } from 'axios';

import { invalidarSesion, recuperarSesion } from './almacenamiento-sesion';
import { ErrorAutenticacion } from './errores-autenticacion';

import type { RespuestaError } from '@/tipos/api';

const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim();
export const clienteHttp = create({ baseURL, timeout: 12000 });

const esAccesoPublico = (url?: string) => url === '/auth/ingreso' || url === '/auth/registro';

clienteHttp.interceptors.request.use(async (configuracion) => {
  if (!baseURL) throw new ErrorAutenticacion('API_NO_DISPONIBLE', 'Falta configurar la dirección de la API. Consultá la configuración de Cercau.');
  if (!esAccesoPublico(configuracion.url)) {
    const sesion = await recuperarSesion();
    if (sesion) configuracion.headers.set('Authorization', `Bearer ${sesion.token}`);
  }
  return configuracion;
});

export function normalizarErrorHttp(error: unknown): ErrorAutenticacion {
  if (error instanceof ErrorAutenticacion) return error;
  if (!isAxiosError<RespuestaError>(error)) {
    return new ErrorAutenticacion('ERROR_INESPERADO', 'Ocurrió un error inesperado. Intentá nuevamente.');
  }
  const estado = error.response?.status;
  const codigo = error.response?.data?.error?.codigo;
  if (estado === 401) {
    return esAccesoPublico(error.config?.url)
      ? new ErrorAutenticacion('CREDENCIALES_INVALIDAS', 'El email o la contraseña son incorrectos.')
      : new ErrorAutenticacion('SESION_INVALIDA', 'Tu sesión terminó. Volvé a ingresar con correo y contraseña.');
  }
  if (estado === 409 && codigo === 'EMAIL_YA_REGISTRADO') {
    return new ErrorAutenticacion('EMAIL_REGISTRADO', 'Ya existe una cuenta con ese email. Iniciá sesión.');
  }
  if (estado === 400 || estado === 422) {
    return new ErrorAutenticacion('DATOS_INVALIDOS', 'Revisá los datos del formulario e intentá nuevamente.');
  }
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ErrorAutenticacion('API_NO_DISPONIBLE', 'La API tardó demasiado en responder. Intentá nuevamente en unos momentos.');
    }
    return new ErrorAutenticacion('SIN_CONEXION', 'No pudimos conectar con la API. Revisá tu conexión y comprobá que el servidor esté disponible.');
  }
  if (estado && estado >= 500) {
    return new ErrorAutenticacion('API_NO_DISPONIBLE', 'La API no está disponible en este momento. Intentá nuevamente más tarde.');
  }
  return new ErrorAutenticacion('ERROR_INESPERADO', 'Ocurrió un error inesperado. Intentá nuevamente.');
}

clienteHttp.interceptors.response.use((respuesta) => respuesta, async (error: unknown) => {
  if (isAxiosError<RespuestaError>(error)) {
    const autorizacion = error.config?.headers.get('Authorization');
    if (error.response?.status === 401 && !esAccesoPublico(error.config?.url) && typeof autorizacion === 'string' && autorizacion.startsWith('Bearer ')) {
      await invalidarSesion(autorizacion.slice(7));
    }
  }
  throw normalizarErrorHttp(error);
});
