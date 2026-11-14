import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { RESENAS_MOCK } from '../mocks/resenas';
import { Resena, RespuestaComercio } from '../tipos/resena';

export interface ResenaPendienteFila {
  id: number;
  clientId: string;
  comercioId: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario: string;
  fotos: string[];
  fechaCreacion: string;
}

export interface FotoComercioFila {
  id: number;
  comercioId: string;
  uri: string;
  fechaCreacion: string;
}

// Almacenamiento de respaldo en memoria cuando se ejecuta en Web
let memoriaResenasSincronizadas: Resena[] = [...RESENAS_MOCK];
let memoriaResenasPendientes: ResenaPendienteFila[] = [];
let memoriaFotosComercio: FotoComercioFila[] = [];
let autoIncrementWeb = 1;
let autoIncrementFotosWeb = 1;

let dbInstancia: SQLite.SQLiteDatabase | null = null;
let inicializada = false;

function obtenerDb(): SQLite.SQLiteDatabase | null {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!dbInstancia) {
    dbInstancia = SQLite.openDatabaseSync('resenas_offline.db');
  }
  return dbInstancia;
}

function parsearFotos(fotosTexto: string | null | undefined): string[] {
  if (!fotosTexto) return [];
  try {
    const parsed: unknown = JSON.parse(fotosTexto);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function mapearFilaAResena(fila: Record<string, unknown>, pendiente = false): Resena {
  const respuestaTexto =
    typeof fila.respuestaComentario === 'string' && fila.respuestaComentario.trim().length > 0
      ? fila.respuestaComentario
      : null;

  const respuestaComercio: RespuestaComercio | undefined = respuestaTexto
    ? {
        comentario: respuestaTexto,
        fechaCreacion:
          typeof fila.respuestaFecha === 'string' && fila.respuestaFecha
            ? fila.respuestaFecha
            : new Date().toISOString(),
      }
    : undefined;

  return {
    id: String(fila.id ?? fila.clientId ?? ''),
    comercioId: String(fila.comercioId ?? '1'),
    usuarioId: String(fila.usuarioId ?? ''),
    nombreUsuario: String(fila.nombreUsuario ?? 'Vecino'),
    calificacion: Number(fila.calificacion ?? 5),
    comentario: typeof fila.comentario === 'string' ? fila.comentario : '',
    fotos: parsearFotos(typeof fila.fotos === 'string' ? fila.fotos : '[]'),
    fechaCreacion:
      typeof fila.fechaCreacion === 'string' && fila.fechaCreacion
        ? fila.fechaCreacion
        : new Date().toISOString(),
    respuestaComercio,
    reportada: Number(fila.reportada ?? 0) === 1,
    motivoReporte:
      typeof fila.motivoReporte === 'string' && fila.motivoReporte ? fila.motivoReporte : undefined,
    fechaReporte:
      typeof fila.fechaReporte === 'string' && fila.fechaReporte ? fila.fechaReporte : undefined,
    pendienteSincronizacion: pendiente,
  };
}

/**
 * Inicializa las tablas SQLite:
 * 1) `resenas_sincronizadas`: persiste todas las reseñas del comercio, sus ediciones,
 *    eliminaciones, reportes y respuestas únicas para que sobrevivan al cierre de la app.
 * 2) `resenas_pendientes`: cola offline con `clientId UNIQUE` para evitar duplicados al sincronizar.
 * 3) `fotos_comercio`: persiste las fotografías agregadas a la ficha de cada comercio.
 */
export const inicializarBaseDeDatos = (): void => {
  if (inicializada) return;

  if (Platform.OS === 'web') {
    inicializada = true;
    return;
  }

  try {
    const db = obtenerDb();
    if (!db) return;

    // 1. Tabla principal de reseñas sincronizadas
    db.execSync(`
      CREATE TABLE IF NOT EXISTS resenas_sincronizadas (
        id TEXT PRIMARY KEY NOT NULL,
        comercioId TEXT NOT NULL,
        usuarioId TEXT NOT NULL,
        nombreUsuario TEXT NOT NULL,
        calificacion INTEGER NOT NULL,
        comentario TEXT,
        fotos TEXT,
        fechaCreacion TEXT NOT NULL,
        respuestaComentario TEXT,
        respuestaFecha TEXT,
        reportada INTEGER DEFAULT 0,
        motivoReporte TEXT,
        fechaReporte TEXT
      );
    `);

    // 2. Verificar si una tabla antigua de resenas_pendientes carece de clientId o comercioId
    const columnasPendientes = db.getAllSync<{ name: string }>(
      'PRAGMA table_info(resenas_pendientes);'
    );
    const tieneEsquemaCompleto =
      columnasPendientes.length === 0 ||
      (columnasPendientes.some((c) => c.name === 'clientId') &&
        columnasPendientes.some((c) => c.name === 'comercioId'));

    if (!tieneEsquemaCompleto) {
      const filasAntiguas = db.getAllSync<Record<string, unknown>>(
        'SELECT * FROM resenas_pendientes;'
      );
      db.execSync('DROP TABLE IF EXISTS resenas_pendientes;');
      db.execSync(`
        CREATE TABLE IF NOT EXISTS resenas_pendientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId TEXT UNIQUE NOT NULL,
          comercioId TEXT NOT NULL,
          usuarioId TEXT NOT NULL,
          nombreUsuario TEXT NOT NULL,
          calificacion INTEGER NOT NULL,
          comentario TEXT,
          fotos TEXT,
          fechaCreacion TEXT NOT NULL
        );
      `);
      const insertarMigrada = db.prepareSync(
        `INSERT OR IGNORE INTO resenas_pendientes
          (clientId, comercioId, usuarioId, nombreUsuario, calificacion, comentario, fotos, fechaCreacion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const antigua of filasAntiguas) {
        insertarMigrada.executeSync([
          `offline-migrada-${String(antigua.id ?? Date.now())}`,
          '1',
          'usr-yo',
          'Thiago Chamorro',
          Number(antigua.calificacion ?? 5),
          String(antigua.comentario ?? ''),
          typeof antigua.fotos === 'string' ? antigua.fotos : '[]',
          new Date().toISOString(),
        ]);
      }
    } else {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS resenas_pendientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId TEXT UNIQUE NOT NULL,
          comercioId TEXT NOT NULL,
          usuarioId TEXT NOT NULL,
          nombreUsuario TEXT NOT NULL,
          calificacion INTEGER NOT NULL,
          comentario TEXT,
          fotos TEXT,
          fechaCreacion TEXT NOT NULL
        );
      `);
    }

    // 3. Tabla para fotografías asociadas a la ficha del comercio
    db.execSync(`
      CREATE TABLE IF NOT EXISTS fotos_comercio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comercioId TEXT NOT NULL,
        uri TEXT UNIQUE NOT NULL,
        fechaCreacion TEXT NOT NULL
      );
    `);

    // 4. Sembrar los datos iniciales de RESENAS_MOCK una única vez si la base está vacía
    const conteo = db.getFirstSync<{ total: number }>(
      'SELECT COUNT(*) as total FROM resenas_sincronizadas;'
    );
    if (!conteo || conteo.total === 0) {
      const stmtSemilla = db.prepareSync(`
        INSERT OR IGNORE INTO resenas_sincronizadas (
          id, comercioId, usuarioId, nombreUsuario, calificacion, comentario,
          fotos, fechaCreacion, respuestaComentario, respuestaFecha, reportada, motivoReporte, fechaReporte
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const mock of RESENAS_MOCK) {
        stmtSemilla.executeSync([
          mock.id,
          mock.comercioId,
          mock.usuarioId,
          mock.nombreUsuario,
          mock.calificacion,
          mock.comentario ?? '',
          JSON.stringify(mock.fotos ?? []),
          String(mock.fechaCreacion),
          mock.respuestaComercio?.comentario ?? null,
          mock.respuestaComercio?.fechaCreacion
            ? String(mock.respuestaComercio.fechaCreacion)
            : null,
          mock.reportada ? 1 : 0,
          mock.motivoReporte ?? null,
          mock.fechaReporte ?? null,
        ]);
      }
    }

    inicializada = true;
  } catch (error) {
    console.error('Error al inicializar SQLite para reseñas y fotografías:', error);
  }
};

export const obtenerResenasSincronizadasDB = (comercioId?: string): Resena[] => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    return comercioId
      ? memoriaResenasSincronizadas.filter((r) => r.comercioId === comercioId)
      : [...memoriaResenasSincronizadas];
  }

  try {
    const db = obtenerDb();
    if (!db) return [];

    const filas = comercioId
      ? db.getAllSync<Record<string, unknown>>(
          'SELECT * FROM resenas_sincronizadas WHERE comercioId = ?;',
          [comercioId]
        )
      : db.getAllSync<Record<string, unknown>>('SELECT * FROM resenas_sincronizadas;');

    return filas.map((fila) => mapearFilaAResena(fila, false));
  } catch (error) {
    console.error('Error al leer reseñas sincronizadas desde SQLite:', error);
    return [];
  }
};

export const guardarResenaSincronizadaDB = (resena: Resena): Resena => {
  inicializarBaseDeDatos();

  const resenaLimpia: Resena = {
    ...resena,
    pendienteSincronizacion: false,
  };

  if (Platform.OS === 'web') {
    const existe = memoriaResenasSincronizadas.some((r) => r.id === resenaLimpia.id);
    if (existe) {
      memoriaResenasSincronizadas = memoriaResenasSincronizadas.map((r) =>
        r.id === resenaLimpia.id ? resenaLimpia : r
      );
    } else {
      memoriaResenasSincronizadas = [resenaLimpia, ...memoriaResenasSincronizadas];
    }
    return resenaLimpia;
  }

  const db = obtenerDb();
  if (!db) {
    throw new Error('Base de datos SQLite no disponible.');
  }

  const query = db.prepareSync(`
    INSERT OR REPLACE INTO resenas_sincronizadas (
      id, comercioId, usuarioId, nombreUsuario, calificacion, comentario,
      fotos, fechaCreacion, respuestaComentario, respuestaFecha, reportada, motivoReporte, fechaReporte
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  query.executeSync([
    resenaLimpia.id,
    resenaLimpia.comercioId,
    resenaLimpia.usuarioId,
    resenaLimpia.nombreUsuario,
    resenaLimpia.calificacion,
    resenaLimpia.comentario ?? '',
    JSON.stringify(resenaLimpia.fotos ?? []),
    String(resenaLimpia.fechaCreacion),
    resenaLimpia.respuestaComercio?.comentario ?? null,
    resenaLimpia.respuestaComercio?.fechaCreacion
      ? String(resenaLimpia.respuestaComercio.fechaCreacion)
      : null,
    resenaLimpia.reportada ? 1 : 0,
    resenaLimpia.motivoReporte ?? null,
    resenaLimpia.fechaReporte ?? null,
  ]);

  return resenaLimpia;
};

export const eliminarResenaSincronizadaDB = (id: string): void => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    memoriaResenasSincronizadas = memoriaResenasSincronizadas.filter((r) => r.id !== id);
    return;
  }

  const db = obtenerDb();
  if (!db) return;

  const query = db.prepareSync('DELETE FROM resenas_sincronizadas WHERE id = ?;');
  query.executeSync([id]);
};

export const guardarResenaPendiente = (
  calificacion: number,
  comentario: string,
  fotos: string[],
  comercioId = '1',
  usuarioId = 'usr-yo',
  nombreUsuario = 'Thiago Chamorro',
  clientId?: string
): Resena => {
  inicializarBaseDeDatos();

  const idUnicoCliente =
    clientId ?? `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const fechaCreacion = new Date().toISOString();

  if (Platform.OS === 'web') {
    const existente = memoriaResenasPendientes.find((p) => p.clientId === idUnicoCliente);
    if (existente) {
      existente.calificacion = calificacion;
      existente.comentario = comentario;
      existente.fotos = fotos;
    } else {
      memoriaResenasPendientes.push({
        id: autoIncrementWeb++,
        clientId: idUnicoCliente,
        comercioId,
        usuarioId,
        nombreUsuario,
        calificacion,
        comentario,
        fotos,
        fechaCreacion,
      });
    }
    return {
      id: idUnicoCliente,
      comercioId,
      usuarioId,
      nombreUsuario,
      calificacion,
      comentario,
      fotos,
      fechaCreacion,
      pendienteSincronizacion: true,
    };
  }

  const db = obtenerDb();
  if (!db) {
    throw new Error('No se pudo abrir la base de datos local SQLite.');
  }

  const query = db.prepareSync(`
    INSERT OR REPLACE INTO resenas_pendientes (
      clientId, comercioId, usuarioId, nombreUsuario, calificacion, comentario, fotos, fechaCreacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  query.executeSync([
    idUnicoCliente,
    comercioId,
    usuarioId,
    nombreUsuario,
    calificacion,
    comentario,
    JSON.stringify(fotos ?? []),
    fechaCreacion,
  ]);

  return {
    id: idUnicoCliente,
    comercioId,
    usuarioId,
    nombreUsuario,
    calificacion,
    comentario,
    fotos,
    fechaCreacion,
    pendienteSincronizacion: true,
  };
};

export const actualizarResenaPendientePorClientId = (
  clientId: string,
  calificacion: number,
  comentario: string,
  fotos: string[]
): boolean => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    const item = memoriaResenasPendientes.find((p) => p.clientId === clientId);
    if (!item) return false;
    item.calificacion = calificacion;
    item.comentario = comentario;
    item.fotos = fotos;
    return true;
  }

  try {
    const db = obtenerDb();
    if (!db) return false;

    const query = db.prepareSync(`
      UPDATE resenas_pendientes
      SET calificacion = ?, comentario = ?, fotos = ?
      WHERE clientId = ?;
    `);
    const result = query.executeSync([
      calificacion,
      comentario,
      JSON.stringify(fotos ?? []),
      clientId,
    ]);
    return result.changes > 0;
  } catch (error) {
    console.error('Error al actualizar reseña pendiente:', error);
    return false;
  }
};

export const obtenerResenasLocales = (comercioId?: string): Resena[] => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    const filtradas = comercioId
      ? memoriaResenasPendientes.filter((p) => p.comercioId === comercioId)
      : memoriaResenasPendientes;
    return filtradas.map((fila) => ({
      id: fila.clientId,
      comercioId: fila.comercioId,
      usuarioId: fila.usuarioId,
      nombreUsuario: fila.nombreUsuario,
      calificacion: fila.calificacion,
      comentario: fila.comentario,
      fotos: fila.fotos,
      fechaCreacion: fila.fechaCreacion,
      pendienteSincronizacion: true,
    }));
  }

  try {
    const db = obtenerDb();
    if (!db) return [];

    const filas = comercioId
      ? db.getAllSync<Record<string, unknown>>(
          'SELECT * FROM resenas_pendientes WHERE comercioId = ? ORDER BY id DESC;',
          [comercioId]
        )
      : db.getAllSync<Record<string, unknown>>(
          'SELECT * FROM resenas_pendientes ORDER BY id DESC;'
        );

    return filas.map((fila) => ({
      id: String(fila.clientId ?? `offline-${String(fila.id)}`),
      comercioId: String(fila.comercioId ?? '1'),
      usuarioId: String(fila.usuarioId ?? 'usr-yo'),
      nombreUsuario: String(fila.nombreUsuario ?? 'Thiago Chamorro'),
      calificacion: Number(fila.calificacion ?? 5),
      comentario: typeof fila.comentario === 'string' ? fila.comentario : '',
      fotos: parsearFotos(typeof fila.fotos === 'string' ? fila.fotos : '[]'),
      fechaCreacion:
        typeof fila.fechaCreacion === 'string' && fila.fechaCreacion
          ? fila.fechaCreacion
          : new Date().toISOString(),
      pendienteSincronizacion: true,
    }));
  } catch (error) {
    console.error('Error al leer reseñas pendientes de SQLite:', error);
    return [];
  }
};

export const eliminarResenaPendientePorClientId = (clientId: string): void => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    memoriaResenasPendientes = memoriaResenasPendientes.filter((p) => p.clientId !== clientId);
    return;
  }

  try {
    const db = obtenerDb();
    if (!db) return;

    const query = db.prepareSync('DELETE FROM resenas_pendientes WHERE clientId = ?;');
    query.executeSync([clientId]);
  } catch (error) {
    console.error('Error al eliminar reseña pendiente sincronizada:', error);
  }
};

export const vaciarResenasPendientes = (): void => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    memoriaResenasPendientes = [];
    return;
  }

  try {
    const db = obtenerDb();
    if (!db) return;
    db.execSync('DELETE FROM resenas_pendientes;');
  } catch (error) {
    console.error('Error al vaciar reseñas pendientes:', error);
  }
};

// --- SERVICIOS SQLITE PARA FOTOGRAFÍAS DE LA FICHA DEL COMERCIO ---

export const obtenerFotosComercioDB = (comercioId: string): string[] => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    return memoriaFotosComercio
      .filter((f) => f.comercioId === comercioId)
      .map((f) => f.uri);
  }

  try {
    const db = obtenerDb();
    if (!db) return [];

    const filas = db.getAllSync<{ uri: string }>(
      'SELECT uri FROM fotos_comercio WHERE comercioId = ? ORDER BY id DESC;',
      [comercioId]
    );

    return filas.map((f) => f.uri);
  } catch (error) {
    console.error('Error al leer fotos del comercio desde SQLite:', error);
    return [];
  }
};

export const guardarFotoComercioDB = (comercioId: string, uri: string): void => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    if (!memoriaFotosComercio.some((f) => f.uri === uri)) {
      memoriaFotosComercio.push({
        id: autoIncrementFotosWeb++,
        comercioId,
        uri,
        fechaCreacion: new Date().toISOString(),
      });
    }
    return;
  }

  try {
    const db = obtenerDb();
    if (!db) return;

    const query = db.prepareSync(`
      INSERT OR IGNORE INTO fotos_comercio (comercioId, uri, fechaCreacion)
      VALUES (?, ?, ?)
    `);

    query.executeSync([comercioId, uri, new Date().toISOString()]);
  } catch (error) {
    console.error('Error al guardar foto del comercio en SQLite:', error);
  }
};

export const eliminarFotoComercioDB = (comercioId: string, uri: string): void => {
  inicializarBaseDeDatos();

  if (Platform.OS === 'web') {
    memoriaFotosComercio = memoriaFotosComercio.filter(
      (f) => !(f.comercioId === comercioId && f.uri === uri)
    );
    return;
  }

  try {
    const db = obtenerDb();
    if (!db) return;

    const query = db.prepareSync('DELETE FROM fotos_comercio WHERE comercioId = ? AND uri = ?;');
    query.executeSync([comercioId, uri]);
  } catch (error) {
    console.error('Error al eliminar foto del comercio de SQLite:', error);
  }
};