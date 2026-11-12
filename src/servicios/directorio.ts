import * as Network from 'expo-network';

import { leerCacheDirectorio, guardarCacheDirectorio } from './cache-directorio';
import { obtenerMensajeError, ErrorAutenticacion } from './errores-autenticacion';
import { obtenerListaCompleta } from './listas-api';
import { obtenerRubros } from './comercios';
import { clienteHttp } from './cliente-http';
import { esComercioDirectorio, esRubroDirectorio } from './validar-directorio';

import type { ComercioApi, RespuestaUno } from '@/tipos/api';
import type { DatosDirectorio, ComercioDirectorio } from '@/tipos/directorio';
import { directorioDemo } from '@/mocks/directorio';

const modoDemo = process.env.EXPO_PUBLIC_DIRECTORIO_MOCKS === 'true';

function listaProductos(valor: unknown): string[] | undefined {
  if (typeof valor !== 'object' || valor === null || !('productos' in valor) || !Array.isArray(valor.productos)) return undefined;
  return valor.productos.filter((producto): producto is string => typeof producto === 'string');
}

/** Agrega productos solo cuando existen: una clave con `undefined` invalidaría el caché al revalidar. */
function conProductos(valor: ComercioDirectorio): ComercioDirectorio {
  const productos = listaProductos(valor);
  return productos ? { ...valor, productos } : { ...valor };
}

async function cargarDesdeApi(): Promise<Pick<DatosDirectorio, 'comercios' | 'rubros'>> {
  const [lista, rubros] = await Promise.all([
    obtenerListaCompleta<unknown>('/comercios', 1000),
    obtenerRubros(),
  ]);
  if (!lista.every(esComercioDirectorio) || !rubros.every(esRubroDirectorio)) {
    throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió un comercio con datos inválidos para el directorio.');
  }
  const comercios = lista.filter(esComercioDirectorio).map(conProductos);
  if (comercios.some((comercio) => !rubros.some((rubro) => rubro.id === comercio.rubroId))) {
    throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió un comercio con un rubro que no existe.');
  }
  return { comercios, rubros };
}

async function cargarDemo(avisoInicial = 'Modo demostración: estos comercios y sus ubicaciones son datos ficticios.'): Promise<DatosDirectorio> {
  const actualizadoEn = Date.now();
  let aviso = avisoInicial;
  try {
    await guardarCacheDirectorio({ ...directorioDemo, actualizadoEn });
  } catch (error) {
    aviso = `${aviso} ${obtenerMensajeError(error)}`;
  }
  return { ...directorioDemo, fuente: 'demo', actualizadoEn, aviso };
}

function desdeCache(cache: NonNullable<Awaited<ReturnType<typeof leerCacheDirectorio>>>, aviso: string): DatosDirectorio {
  return { ...cache, fuente: 'cache', aviso };
}

async function leerCacheSegura(): Promise<Awaited<ReturnType<typeof leerCacheDirectorio>> | null> {
  try {
    return await leerCacheDirectorio();
  } catch {
    return null;
  }
}

async function redDisponible(): Promise<boolean> {
  try {
    const red = await Network.getNetworkStateAsync();
    return red.isConnected !== false && red.isInternetReachable !== false;
  } catch {
    return true;
  }
}

export async function obtenerDirectorio(): Promise<DatosDirectorio> {
  if (!await redDisponible()) {
    const cache = await leerCacheSegura();
    if (cache) return desdeCache(cache, 'Sin conexión. Mostramos la última copia guardada del directorio y sus horarios.');
    return cargarDemo('Sin conexión y sin copia guardada. Mostramos datos ficticios de demostración.');
  }
  if (modoDemo) return cargarDemo();

  try {
    const datos = await cargarDesdeApi();
    const actualizadoEn = Date.now();
    try {
      await guardarCacheDirectorio({ ...datos, actualizadoEn });
      return { ...datos, fuente: 'red', actualizadoEn, aviso: null };
    } catch (error) {
      return {
        ...datos,
        fuente: 'red',
        actualizadoEn,
        aviso: `${obtenerMensajeError(error)} Los resultados actuales siguen disponibles.`,
      };
    }
  } catch (error) {
    const cache = await leerCacheSegura();
    if (cache) {
      return desdeCache(cache, `No se pudo actualizar el directorio. ${obtenerMensajeError(error)} Se muestra la última copia guardada.`);
    }
    if (error instanceof ErrorAutenticacion && ['SIN_CONEXION', 'API_NO_DISPONIBLE'].includes(error.codigo)) {
      return cargarDemo(`La API no está disponible. ${obtenerMensajeError(error)} Mostramos datos ficticios de demostración.`);
    }
    throw error;
  }
}

export async function obtenerComercioDirectorio(id: string): Promise<{ comercio: ComercioDirectorio; datos: DatosDirectorio }> {
  const datos = await obtenerDirectorio();
  const comercioGuardado = datos.comercios.find((item) => item.id === id);
  if (comercioGuardado) return { comercio: comercioGuardado, datos };
  if (datos.fuente !== 'red') {
    throw new ErrorAutenticacion('COMERCIO_NO_ENCONTRADO', 'Este comercio no está en la copia guardada. Conectate para consultar su ficha.');
  }
  const respuesta = await clienteHttp.get<RespuestaUno<ComercioApi>>(`/comercios/${encodeURIComponent(id)}`);
  const comercio = respuesta.data?.datos;
  if (!esComercioDirectorio(comercio) || comercio.id !== id) {
    throw new ErrorAutenticacion('COMERCIO_NO_ENCONTRADO', 'No encontramos la ficha de este comercio.');
  }
  const productos = listaProductos(comercio);
  const comercioConProductos = productos ? { ...comercio, productos } : { ...comercio };
  return {
    comercio: comercioConProductos,
    datos: { ...datos, comercios: [...datos.comercios, comercioConProductos] },
  };
}
