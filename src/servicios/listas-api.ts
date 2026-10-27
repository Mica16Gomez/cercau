import { clienteHttp } from './cliente-http';
import { ErrorAutenticacion } from './errores-autenticacion';
import type { RespuestaLista } from '@/tipos/api';

// Las listas de la API son paginadas. No descartamos los elementos de otras páginas.
export async function obtenerListaCompleta<T>(ruta: string, porPagina: number, filtros: Record<string, string> = {}): Promise<T[]> {
  const elementos: T[] = [];
  let pagina = 1;
  while (true) {
    const respuesta = await clienteHttp.get<RespuestaLista<T>>(ruta, { params: { ...filtros, pagina, porPagina } });
    const lista = respuesta.data;
    if (!Array.isArray(lista?.datos) || !lista.meta || !Number.isInteger(lista.meta.total) || lista.meta.total < 0 ||
      lista.meta.pagina !== pagina || !Number.isInteger(lista.meta.porPagina) || lista.meta.porPagina < 1) {
      throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió una lista que no pudimos interpretar. Reintentá la consulta.');
    }
    elementos.push(...lista.datos);
    if (pagina * lista.meta.porPagina >= lista.meta.total) return elementos;
    if (!lista.datos.length) throw new ErrorAutenticacion('ERROR_INESPERADO', 'La lista de la API quedó incompleta. Reintentá la consulta.');
    pagina++;
  }
}
