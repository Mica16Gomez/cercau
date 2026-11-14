/**
 * CERCau - Rol 4: respuestas EXCLUSIVAMENTE de demostración.
 * No se envían a la API ni se escriben en la caché de reseñas publicadas.
 * En iOS/Android persisten en SQLite; en web duran hasta recargar la página.
 */
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import type { Resena, RespuestaComercio } from '../tipos/resena';

interface RespuestaDemoFila {
  resenaId: string;
  comentario: string;
  fechaCreacion: string;
}

interface ReporteDemoFila {
  resenaId: string;
}

const memoriaWeb = new Map<string, Map<string, RespuestaComercio>>();
const reportesWeb = new Map<string, Set<string>>();
let baseDemo: SQLite.SQLiteDatabase | null = null;

function obtenerBaseDemo(): SQLite.SQLiteDatabase {
  if (!baseDemo) {
    baseDemo = SQLite.openDatabaseSync('cercau_respuestas_demo.db');
    baseDemo.execSync(`
      CREATE TABLE IF NOT EXISTS respuestas_demo (
        comercioId TEXT NOT NULL,
        resenaId TEXT NOT NULL,
        comentario TEXT NOT NULL,
        fechaCreacion TEXT NOT NULL,
        PRIMARY KEY (comercioId, resenaId)
      );
      CREATE TABLE IF NOT EXISTS reportes_demo (
        comercioId TEXT NOT NULL,
        resenaId TEXT NOT NULL,
        PRIMARY KEY (comercioId, resenaId)
      );
    `);
  }
  return baseDemo;
}

export function guardarRespuestaDemoLocal(
  comercioId: string,
  resenaId: string,
  texto: string
): RespuestaComercio {
  const comentario = texto.trim();
  if (!comercioId || !resenaId || !comentario) {
    throw new Error('Seleccioná una reseña e ingresá una respuesta válida.');
  }
  const respuesta: RespuestaComercio = {
    comentario,
    fechaCreacion: new Date().toISOString(),
  };

  if (Platform.OS === 'web') {
    const comercio = memoriaWeb.get(comercioId) ?? new Map<string, RespuestaComercio>();
    if (comercio.has(resenaId)) {
      throw new Error('Ya existe una respuesta de demostración para esta reseña.');
    }
    comercio.set(resenaId, respuesta);
    memoriaWeb.set(comercioId, comercio);
    return respuesta;
  }

  const resultado = obtenerBaseDemo().runSync(
    `INSERT OR IGNORE INTO respuestas_demo
       (comercioId, resenaId, comentario, fechaCreacion) VALUES (?, ?, ?, ?)`,
    [comercioId, resenaId, comentario, respuesta.fechaCreacion]
  );
  if (resultado.changes === 0) {
    throw new Error('Ya existe una respuesta de demostración para esta reseña.');
  }
  return respuesta;
}

/** Marca una reseña como reportada solo para la demostración individual. */
export function guardarReporteDemoLocal(comercioId: string, resenaId: string): void {
  if (!comercioId || !resenaId) {
    throw new Error('No se encontró la reseña a reportar.');
  }
  if (Platform.OS === 'web') {
    const reportes = reportesWeb.get(comercioId) ?? new Set<string>();
    if (reportes.has(resenaId)) throw new Error('Esta reseña ya tiene un reporte de prueba.');
    reportes.add(resenaId);
    reportesWeb.set(comercioId, reportes);
    return;
  }
  const resultado = obtenerBaseDemo().runSync(
    'INSERT OR IGNORE INTO reportes_demo (comercioId, resenaId) VALUES (?, ?)',
    [comercioId, resenaId]
  );
  if (resultado.changes === 0) {
    throw new Error('Esta reseña ya tiene un reporte de prueba.');
  }
}

/** Combina la vista de respuestas/reportes demo sin modificar los datos de Docker. */
export function combinarRespuestasDemoLocales(
  comercioId: string,
  resenas: Resena[]
): Resena[] {
  const respuestas = new Map<string, RespuestaComercio>();
  const reportes = new Set<string>();

  if (Platform.OS === 'web') {
    for (const [id, respuesta] of memoriaWeb.get(comercioId) ?? []) {
      respuestas.set(id, respuesta);
    }
    for (const id of reportesWeb.get(comercioId) ?? []) {
      reportes.add(id);
    }
  } else {
    const db = obtenerBaseDemo();
    const filas = db.getAllSync<RespuestaDemoFila>(
      `SELECT resenaId, comentario, fechaCreacion
         FROM respuestas_demo WHERE comercioId = ?`,
      [comercioId]
    );
    for (const fila of filas) {
      respuestas.set(fila.resenaId, {
        comentario: fila.comentario,
        fechaCreacion: fila.fechaCreacion,
      });
    }
    for (const fila of db.getAllSync<ReporteDemoFila>(
      'SELECT resenaId FROM reportes_demo WHERE comercioId = ?',
      [comercioId]
    )) {
      reportes.add(fila.resenaId);
    }
  }

  return resenas.map((resena) => {
    // Los datos reales tienen prioridad; no duplicamos respuestas ni reportes.
    const respuestaDemo = !resena.respuestaComercio ? respuestas.get(resena.id) : undefined;
    const reporteDemoLocal = !resena.reportada && reportes.has(resena.id);
    return {
      ...resena,
      ...(respuestaDemo ? { respuestaComercio: respuestaDemo, respuestaDemoLocal: true } : {}),
      ...(reporteDemoLocal ? { reportada: true, reporteDemoLocal: true } : {}),
    };
  });
}

/** Reinicia solo las acciones de demostración. No borra reseñas creadas ni toca Docker. */
export function borrarAccionesDemoLocales(comercioId: string): void {
  if (Platform.OS === 'web') {
    memoriaWeb.delete(comercioId);
    reportesWeb.delete(comercioId);
    return;
  }
  const db = obtenerBaseDemo();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM respuestas_demo WHERE comercioId = ?', [comercioId]);
    db.runSync('DELETE FROM reportes_demo WHERE comercioId = ?', [comercioId]);
  });
}
