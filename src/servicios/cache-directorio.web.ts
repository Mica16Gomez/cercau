import { ErrorAutenticacion } from './errores-autenticacion';
import { esComercioDirectorio, esRubroDirectorio } from './validar-directorio';

import type { DatosDirectorio } from '@/tipos/directorio';

type CacheDirectorio = Pick<DatosDirectorio, 'comercios' | 'rubros' | 'actualizadoEn'>;

let cache: CacheDirectorio | null = null;

export async function leerCacheDirectorio(): Promise<CacheDirectorio | null> {
  if (!cache) return null;
  if (!validarCache(cache)) throw new ErrorAutenticacion('ALMACENAMIENTO', 'La copia local del directorio tiene un formato inválido.');
  return cache;
}

export async function guardarCacheDirectorio(datos: CacheDirectorio): Promise<void> {
  if (!validarCache(datos)) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'No pudimos guardar un directorio con datos inválidos.');
  cache = datos;
}

// En web el demo llega sin marca de tiempo: la tratamos como opcional antes de exigirla al guardar.
function validarCache(valor: unknown): valor is Pick<DatosDirectorio, 'comercios' | 'rubros' | 'actualizadoEn'> {
  if (typeof valor !== 'object' || valor === null || !('comercios' in valor) || !('rubros' in valor)) return false;
  const sinMarca = !('actualizadoEn' in valor) || valor.actualizadoEn === null || valor.actualizadoEn === undefined;
  if (sinMarca) return Array.isArray(valor.comercios) && valor.comercios.every(esComercioDirectorio) &&
    Array.isArray(valor.rubros) && valor.rubros.every(esRubroDirectorio);
  return Array.isArray(valor.comercios) && valor.comercios.every(esComercioDirectorio) &&
    Array.isArray(valor.rubros) && valor.rubros.every(esRubroDirectorio) &&
    typeof valor.actualizadoEn === 'number' && Number.isFinite(valor.actualizadoEn);
}
