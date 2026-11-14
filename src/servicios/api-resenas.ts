/**
 * CERCau - Rol 4
 * Peticiones de reseñas a la API de la cátedra con Axios.
 *
 * Este archivo NO inicia sesión ni guarda tokens. Recibe el token
 * de quien administra la sesión (Rol 1, cuando los módulos se integren).
 */
import { create, isAxiosError, type AxiosRequestConfig } from 'axios';

export interface ResenaApi {
  id: string;
  comercioId: string;
  usuarioId: string;
  estrellas: number;
  comentario: string;
  respuesta: string | null;
  reportada: boolean;
  creadaEn: string;
  sincronizada: boolean;
}

interface MetaApi {
  total: number;
  pagina: number;
  porPagina: number;
}

interface RespuestaListaApi<T> {
  datos: T[];
  meta: MetaApi;
}

interface RespuestaUnoApi<T> {
  datos: T;
  meta: null;
}

interface ErrorDelServidor {
  error?: {
    codigo?: string;
    mensaje?: string;
  };
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  cuerpo?: unknown;
}

export class ErrorApiResenas extends Error {
  constructor(
    mensaje: string,
    public readonly estado: number,
    public readonly codigo: string
  ) {
    super(mensaje);
    this.name = 'ErrorApiResenas';
  }
}

const clienteResenas =create({
  timeout: 12000,
  headers: { Accept: 'application/json' },
});

function obtenerUrlBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new ErrorApiResenas(
      'Falta configurar EXPO_PUBLIC_API_URL en el archivo .env.',
      0,
      'API_NO_DISPONIBLE'
    );
  }
  return url.replace(/\/+$/, '');
}

function leerErrorServidor(contenido: unknown): ErrorDelServidor['error'] | undefined {
  if (typeof contenido !== 'object' || contenido === null || !('error' in contenido)) {
    return undefined;
  }
  const error = contenido.error;
  if (typeof error !== 'object' || error === null) return undefined;
  const objeto = error as Record<string, unknown>;
  return {
    codigo: typeof objeto.codigo === 'string' ? objeto.codigo : undefined,
    mensaje: typeof objeto.mensaje === 'string' ? objeto.mensaje : undefined,
  };
}

function convertirError(error: unknown): Error {
  if (error instanceof ErrorApiResenas) return error;
  if (!isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Ocurrió un error inesperado al consultar las reseñas.');
  }

  const estado = error.response?.status ?? 0;
  const errorServidor = leerErrorServidor(error.response?.data);
  if (errorServidor) {
    return new ErrorApiResenas(
      errorServidor.mensaje ?? `La API devolvió el estado ${estado}.`,
      estado,
      errorServidor.codigo ?? 'ERROR_HTTP'
    );
  }
  if (!error.response) {
    const esTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return new ErrorApiResenas(
      esTimeout
        ? 'La API tardó demasiado en responder.'
        : 'No se pudo conectar con la API. Revisá la conexión y que Docker esté funcionando.',
      0,
      esTimeout ? 'TIEMPO_AGOTADO' : 'SIN_CONEXION'
    );
  }
  return new ErrorApiResenas(`Error HTTP ${estado} al consultar la API.`, estado, 'ERROR_HTTP');
}

async function solicitarApi<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', token, cuerpo } = opciones;
  const configuracion: AxiosRequestConfig = {
    baseURL: obtenerUrlBase(),
    url: ruta,
    method: metodo,
    data: cuerpo,
    headers: token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined,
  };

  try {
    const respuesta = await clienteResenas.request<T>(configuracion);
    // La API usa 204 sin contenido para eliminar una reseña.
    if (respuesta.status === 204) return undefined as T;

    const contenido: unknown = respuesta.data;
    const errorServidor = leerErrorServidor(contenido);
    if (errorServidor) {
      throw new ErrorApiResenas(
        errorServidor.mensaje ?? 'La operación no pudo completarse.',
        respuesta.status,
        errorServidor.codigo ?? 'ERROR_API'
      );
    }
    if (typeof contenido !== 'object' || contenido === null || !('datos' in contenido)) {
      throw new ErrorApiResenas(
        'La respuesta de la API no contiene datos.',
        respuesta.status,
        'RESPUESTA_INVALIDA'
      );
    }
    return respuesta.data;
  } catch (error) {
    throw convertirError(error);
  }
}

/** GET /comercios/:id/resenas — Público, obtiene todas las páginas. */
export async function listarResenasApi(comercioId: string): Promise<ResenaApi[]> {
  const todas: ResenaApi[] = [];
  let pagina = 1;
  while (true) {
    const ruta =
      `/comercios/${encodeURIComponent(comercioId)}/resenas` +
      `?pagina=${pagina}&porPagina=100`;
    const respuesta = await solicitarApi<RespuestaListaApi<ResenaApi>>(ruta);
    const { datos, meta } = respuesta;
    if (
      !Array.isArray(datos) || !meta ||
      !Number.isInteger(meta.total) || meta.total < 0 ||
      meta.pagina !== pagina ||
      !Number.isInteger(meta.porPagina) || meta.porPagina < 1
    ) {
      throw new ErrorApiResenas('La API devolvió una lista de reseñas inválida.', 200, 'RESPUESTA_INVALIDA');
    }
    todas.push(...datos);
    if (todas.length >= meta.total) return todas;
    if (datos.length === 0) {
      throw new ErrorApiResenas('La API devolvió una lista incompleta.', 200, 'RESPUESTA_INVALIDA');
    }
    pagina++;
  }
}

/** POST /comercios/:id/resenas — Requiere token de vecino. */
export interface CrearResenaApi {
  /** ID opcional `res-...`, estable para reintentos de sincronización offline. */
  id?: string;
  estrellas: number;
  comentario: string;
  creadaEn?: string;
}

export async function crearResenaApi(
  comercioId: string,
  datos: CrearResenaApi,
  token: string
): Promise<ResenaApi> {
  const respuesta = await solicitarApi<RespuestaUnoApi<ResenaApi>>(
    `/comercios/${encodeURIComponent(comercioId)}/resenas`,
    { metodo: 'POST', token, cuerpo: datos }
  );
  return respuesta.datos;
}

/** PATCH /resenas/:id — Requiere token del autor. */
export interface EditarResenaApi {
  estrellas?: number;
  comentario?: string;
}

export async function editarResenaApi(
  id: string,
  cambios: EditarResenaApi,
  token: string
): Promise<ResenaApi> {
  const respuesta = await solicitarApi<RespuestaUnoApi<ResenaApi>>(
    `/resenas/${encodeURIComponent(id)}`,
    { metodo: 'PATCH', token, cuerpo: cambios }
  );
  return respuesta.datos;
}

/** DELETE /resenas/:id — Requiere token del autor, devuelve 204. */
export async function eliminarResenaApi(id: string, token: string): Promise<void> {
  await solicitarApi<void>(`/resenas/${encodeURIComponent(id)}`, {
    metodo: 'DELETE', token,
  });
}

/** POST /resenas/:id/reportes — Requiere sesión, no permite autorreportes. */
export async function reportarResenaApi(id: string, token: string): Promise<ResenaApi> {
  const respuesta = await solicitarApi<RespuestaUnoApi<ResenaApi>>(
    `/resenas/${encodeURIComponent(id)}/reportes`,
    { metodo: 'POST', token }
  );
  return respuesta.datos;
}

/** POST /resenas/:id/respuesta — Requiere token del comercio correspondiente. */
export async function responderResenaApi(
  id: string,
  texto: string,
  token: string
): Promise<ResenaApi> {
  const respuesta = await solicitarApi<RespuestaUnoApi<ResenaApi>>(
    `/resenas/${encodeURIComponent(id)}/respuesta`,
    { metodo: 'POST', token, cuerpo: { respuesta: texto.trim() } }
  );
  return respuesta.datos;
}
