import { ResenaCuenta } from '../tipos/actividad';
import { DatosEditarResena, DatosNuevaResena, Resena } from '../tipos/resena';
import { conectarConsultaResenas } from './actividad';
import {
  crearResenaApi,
  editarResenaApi,
  eliminarResenaApi,
  listarResenasApi,
  reportarResenaApi,
  responderResenaApi,
  type ResenaApi
} from './api-resenas';
import {
  actualizarResenaPendientePorClientId,
  eliminarResenaPendientePorClientId,
  eliminarResenaSincronizadaDB,
  guardarResenaPendiente,
  guardarResenaSincronizadaDB,
  inicializarBaseDeDatos,
  obtenerResenasLocales,
  obtenerResenasSincronizadasDB
} from './base-datos';
import { combinarRespuestasDemoLocales } from './respuestas-demo';

// Convierte el formato de reseña del servidor al que usa la interfaz del Rol 4.
function convertirResenaApi(resena: ResenaApi): Resena {
  return {
    id: resena.id,
    comercioId: resena.comercioId,
    usuarioId: resena.usuarioId,
    // La API de reseñas no incluye el nombre del autor.
    nombreUsuario: 'Vecino',
    calificacion: resena.estrellas,
    comentario: resena.comentario,
    fotos: [],
    fechaCreacion: resena.creadaEn,
    // La API devuelve el texto, pero no la fecha de la respuesta.
    respuestaComercio: resena.respuesta
      ? { comentario: resena.respuesta, fechaCreacion: '' }
      : undefined,
    reportada: resena.reportada,
    pendienteSincronizacion: false,
  };
}

/** El token pertenece al Rol 1; el Rol 4 nunca lo genera ni lo guarda. */
export interface SesionResenas {
  token: string;
  usuarioId: string;
}

function exigirSesion(token?: string): string {
  if (!token?.trim()) {
    throw new Error('Esta operación requiere iniciar sesión con la autenticación real del Rol 1.');
  }
  return token.trim();
}

function validarCalificacion(calificacion: number): void {
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    throw new Error('La calificación debe ser un número entero entre 1 y 5 estrellas.');
  }
}

function validarFotosApi(fotos: string[]): void {
  if (fotos.length > 0) {
    throw new Error('La API actual no admite fotografías en reseñas. No se enviaron ni descartaron las fotos.');
  }
}


function ordenarPorFechaDescendente(lista: Resena[]): Resena[] {
  return [...lista].sort((a, b) => {
    const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
    const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
    return fechaB - fechaA;
  });
}

// Catálogo de videos de presentación asociados por comercioId
export const VIDEOS_COMERCIO_CATALOGO: Record<string, string> = {
  '1': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
  'com-118': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
  'cafe-la-esquina': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
  'panaderia-la-esquina': 'https://assets.mixkit.co/videos/4291/4291-720.mp4',
  'panaderia-el-sol': 'https://assets.mixkit.co/videos/4291/4291-720.mp4',
  'floreria-verde': 'https://assets.mixkit.co/videos/4885/4885-720.mp4',
  'cafe-jacaranda': 'https://assets.mixkit.co/videos/4385/4385-720.mp4',
};

/**
 * Obtiene la URL del video de presentación asociado a un comercioId.
 */
export const obtenerVideoComercioServicio = (
  comercioId?: string,
  urlFallback?: string
): string | null => {
  if (urlFallback && urlFallback.trim().length > 0) {
    return urlFallback.trim();
  }
  if (!comercioId) {
    return null;
  }
  return VIDEOS_COMERCIO_CATALOGO[comercioId] ?? null;
};

// Consultamos primero la API y guardamos una copia local como respaldo.
export const obtenerResenasPorComercio = async (
  comercioId: string,
  incluirRespuestasDemo = false
): Promise<Resena[]> => {
  console.log('ROL 4 - Comercio consultado:', comercioId);
  inicializarBaseDeDatos();
  const pendientes = obtenerResenasLocales(comercioId);

  try {
    const resenasServidor = await listarResenasApi(comercioId);
    const resenasConvertidas = resenasServidor.map(convertirResenaApi);

    for (const resena of resenasConvertidas) {
      guardarResenaSincronizadaDB(resena);
    }

    const idsServidor = new Set(resenasConvertidas.map((resena) => resena.id));
    const pendientesSinDuplicar = pendientes.filter(
      (resena) => !idsServidor.has(resena.id)
    );

    const ordenadas = ordenarPorFechaDescendente([
      ...resenasConvertidas,
      ...pendientesSinDuplicar,
    ]);
    return incluirRespuestasDemo
      ? combinarRespuestasDemoLocales(comercioId, ordenadas)
      : ordenadas;
  } catch (error) {
    console.warn('No se pudieron consultar las reseñas de la API:', error);

    const guardadas = obtenerResenasSincronizadasDB(comercioId);
    const idsGuardados = new Set(guardadas.map((resena) => resena.id));
    const pendientesSinDuplicar = pendientes.filter(
      (resena) => !idsGuardados.has(resena.id)
    );

    const ordenadas = ordenarPorFechaDescendente([
      ...pendientesSinDuplicar,
      ...guardadas,
    ]);
    return incluirRespuestasDemo
      ? combinarRespuestasDemoLocales(comercioId, ordenadas)
      : ordenadas;
  }
};

export const calcularEstadisticasResenas = (resenas: Resena[]) => {
  if (!resenas || resenas.length === 0) {
    return { promedio: 0, total: 0 };
  }
  const suma = resenas.reduce((acc, curr) => acc + (curr.calificacion || 0), 0);
  const promedio = Number((suma / resenas.length).toFixed(1));
  return { promedio, total: resenas.length };
};

/** Crea en Docker si hay token, o guarda una reseña pendiente en SQLite. */
export const crearResena = async (
  datos: DatosNuevaResena,
  token?: string
): Promise<Resena> => {
  validarCalificacion(datos.calificacion);
  inicializarBaseDeDatos();
  if (!token) {
    return guardarResenaPendiente(
      datos.calificacion, datos.comentario.trim(), datos.fotos ?? [],
      datos.comercioId, datos.usuarioId, datos.nombreUsuario.trim() || 'Vecino'
    );
  }

  validarFotosApi(datos.fotos ?? []);
  const creada = await crearResenaApi(datos.comercioId, {
    estrellas: datos.calificacion,
    comentario: datos.comentario.trim(),
  }, exigirSesion(token));
  const resena = convertirResenaApi(creada);
  return guardarResenaSincronizadaDB({ ...resena, nombreUsuario: datos.nombreUsuario });
};

export const crearResenaOffline = async (datos: DatosNuevaResena): Promise<Resena> => {
  validarCalificacion(datos.calificacion);
  inicializarBaseDeDatos();
  return guardarResenaPendiente(
    datos.calificacion, datos.comentario.trim(), datos.fotos ?? [],
    datos.comercioId, datos.usuarioId, datos.nombreUsuario.trim() || 'Vecino'
  );
};

/** Sólo las reseñas pendientes se editan localmente; las publicadas requieren API. */
export const editarResena = async (
  datos: DatosEditarResena,
  online = true,
  token?: string
): Promise<Resena> => {
  validarCalificacion(datos.calificacion);
  inicializarBaseDeDatos();
  const pendiente = obtenerResenasLocales().find((r) => r.id === datos.id);
  if (pendiente) {
    if (pendiente.usuarioId !== datos.usuarioId) {
      throw new Error('Solo podés editar tus propias reseñas.');
    }
    const actualizada = actualizarResenaPendientePorClientId(
      datos.id, datos.calificacion, datos.comentario.trim(), datos.fotos
    );
    if (!actualizada) throw new Error('No se pudo actualizar la reseña pendiente.');
    return {
      ...pendiente,
      calificacion: datos.calificacion,
      comentario: datos.comentario.trim(),
      fotos: datos.fotos,
      pendienteSincronizacion: true,
    };
  }

  if (!online) throw new Error('Para editar una reseña publicada necesitás conexión a Internet.');
  const tokenValido = exigirSesion(token);
  const existente = obtenerResenasSincronizadasDB().find((r) => r.id === datos.id);
  if (existente && existente.usuarioId !== datos.usuarioId) {
    throw new Error('Solo podés editar tus propias reseñas.');
  }
  validarFotosApi(datos.fotos);
  const modificada = await editarResenaApi(datos.id, {
    estrellas: datos.calificacion,
    comentario: datos.comentario.trim(),
  }, tokenValido);
  return guardarResenaSincronizadaDB({
    ...convertirResenaApi(modificada),
    nombreUsuario: existente?.nombreUsuario ?? 'Vecino',
    fotos: existente?.fotos ?? [],
  });
};

export const eliminarResenaServicio = async (
  id: string,
  usuarioId: string,
  token?: string
): Promise<void> => {
  inicializarBaseDeDatos();
  const pendiente = obtenerResenasLocales().find((r) => r.id === id);
  if (pendiente) {
    if (pendiente.usuarioId !== usuarioId) {
      throw new Error('Solo podés eliminar tus propias reseñas.');
    }
    eliminarResenaPendientePorClientId(id);
    return;
  }
  const tokenValido = exigirSesion(token);
  const existente = obtenerResenasSincronizadasDB().find((r) => r.id === id);
  if (existente && existente.usuarioId !== usuarioId) {
    throw new Error('Solo podés eliminar tus propias reseñas.');
  }
  await eliminarResenaApi(id, tokenValido);
  eliminarResenaSincronizadaDB(id);
};

export const reportarResenaServicio = async (
  id: string,
  motivo = 'Contenido ofensivo o inapropiado',
  token?: string
): Promise<Resena> => {
  void motivo; // El endpoint de reportes no acepta un motivo en el contrato actual.
  const tokenValido = exigirSesion(token);
  const reportada = await reportarResenaApi(id, tokenValido);
  const anterior = obtenerResenasSincronizadasDB().find((r) => r.id === id);
  return guardarResenaSincronizadaDB({
    ...convertirResenaApi(reportada),
    nombreUsuario: anterior?.nombreUsuario ?? 'Vecino',
    fotos: anterior?.fotos ?? [],
  });
};

export const responderResenaServicio = async (
  id: string,
  comentarioRespuesta: string,
  token?: string
): Promise<Resena> => {
  const textoLimpio = comentarioRespuesta.trim();
  if (!textoLimpio) throw new Error('La respuesta del comercio no puede estar vacía.');
  const tokenValido = exigirSesion(token);
  const respondida = await responderResenaApi(id, textoLimpio, tokenValido);
  const anterior = obtenerResenasSincronizadasDB().find((r) => r.id === id);
  return guardarResenaSincronizadaDB({
    ...convertirResenaApi(respondida),
    nombreUsuario: anterior?.nombreUsuario ?? 'Vecino',
    fotos: anterior?.fotos ?? [],
  });
};

/** Sólo sincroniza reseñas de la cuenta autenticada y sin fotos sin soporte API. */
let sincronizando = false;
export const sincronizarResenasPendientes = async (
  comercioId?: string,
  sesion?: SesionResenas
): Promise<{ sincronizadas: number; errores: number }> => {
  inicializarBaseDeDatos();
  if (!sesion?.token || !sesion.usuarioId || sincronizando) {
    return { sincronizadas: 0, errores: 0 };
  }
  sincronizando = true;
  let sincronizadas = 0;
  let errores = 0;
  try {
    const pendientes = obtenerResenasLocales(comercioId).filter(
      (r) => r.usuarioId === sesion.usuarioId && !r.fotos?.length
    );
    for (const pendiente of pendientes) {
      try {
        const creada = await crearResenaApi(pendiente.comercioId, {
          estrellas: pendiente.calificacion,
          comentario: pendiente.comentario ?? '',
        }, sesion.token);
        // Primero guardar la respuesta del servidor. Sólo entonces retirar de la cola.
        guardarResenaSincronizadaDB({
          ...convertirResenaApi(creada),
          nombreUsuario: pendiente.nombreUsuario,
        });
        eliminarResenaPendientePorClientId(pendiente.id);
        sincronizadas++;
      } catch (error) {
        console.warn('No se pudo sincronizar la reseña pendiente:', error);
        errores++;
      }
    }
    return { sincronizadas, errores };
  } finally {
    sincronizando = false;
  }
};

const NOMBRES_COMERCIOS_CONOCIDOS: Record<string, string> = {
  '1': 'Café La Esquina',
  'cafe-la-esquina': 'Café La Esquina',
  'panaderia-la-esquina': 'Panadería La Esquina',
  'panaderia-el-sol': 'Panadería El Sol',
  'floreria-verde': 'Florería Verde',
  'cafe-jacaranda': 'Café Jacarandá',
  'farmacia-del-barrio': 'Farmacia del Barrio',
};

export const obtenerResenasPorUsuario = async (usuarioId: string): Promise<ResenaCuenta[]> => {
  inicializarBaseDeDatos();
  const todas = [
    ...obtenerResenasLocales(),
    ...obtenerResenasSincronizadasDB(),
  ];

  const delUsuario = ordenarPorFechaDescendente(
    todas.filter((r) => r.usuarioId === usuarioId)
  );

  return delUsuario.map((r) => ({
    id: r.id,
    comercioNombre: NOMBRES_COMERCIOS_CONOCIDOS[r.comercioId] ?? `Comercio #${r.comercioId}`,
    texto: `${'★'.repeat(r.calificacion)} — ${r.comentario || 'Sin comentario escrito'}`,
    fecha: new Date(r.fechaCreacion).toLocaleDateString(),
  }));
};

// Registramos automáticamente el proveedor de lectura para `/mis-resenas`
conectarConsultaResenas(obtenerResenasPorUsuario);