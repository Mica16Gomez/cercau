import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { ErrorAutenticacion } from './errores-autenticacion';
import { esComercioDirectorio, esRubroDirectorio } from './validar-directorio';

import type { DatosDirectorio } from '@/tipos/directorio';

type CacheDirectorio = Pick<DatosDirectorio, 'comercios' | 'rubros' | 'actualizadoEn'>;
type FilaCache = { datos: string; actualizado_en: number };

let base: Promise<SQLiteDatabase> | null = null;

async function abrirBase(): Promise<SQLiteDatabase> {
  if (!base) {
    base = openDatabaseAsync('cercau-directorio.db')
      .then(async (db) => {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS directorio (
            id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
            datos TEXT NOT NULL,
            actualizado_en INTEGER NOT NULL
          );
        `);
        return db;
      })
      .catch((error: unknown) => {
        base = null;
        throw error;
      });
  }
  return base;
}

export async function leerCacheDirectorio(): Promise<CacheDirectorio | null> {
  try {
    const db = await abrirBase();
    const fila = await db.getFirstAsync<FilaCache>('SELECT datos, actualizado_en FROM directorio WHERE id = 1');
    if (!fila) return null;
    const datos: unknown = JSON.parse(fila.datos);
    if (!validarCache(datos)) throw new Error('El caché del directorio tiene un formato inválido.');
    return { ...datos, actualizadoEn: fila.actualizado_en };
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos leer el directorio guardado en el dispositivo.');
  }
}

export async function guardarCacheDirectorio(datos: CacheDirectorio): Promise<void> {
  try {
    const db = await abrirBase();
    await db.runAsync(
      `INSERT INTO directorio (id, datos, actualizado_en) VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET datos = excluded.datos, actualizado_en = excluded.actualizado_en`,
      JSON.stringify({ comercios: datos.comercios, rubros: datos.rubros }),
      datos.actualizadoEn,
    );
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos guardar el directorio para consultarlo sin conexión.');
  }
}

function validarCache(valor: unknown): valor is Pick<DatosDirectorio, 'comercios' | 'rubros'> {
  if (typeof valor !== 'object' || valor === null || !('comercios' in valor) || !('rubros' in valor)) return false;
  return Array.isArray(valor.comercios) && valor.comercios.every(esComercioDirectorio) &&
    Array.isArray(valor.rubros) && valor.rubros.every(esRubroDirectorio);
}
