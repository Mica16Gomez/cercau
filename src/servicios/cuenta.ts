import { almacenamientoLocal } from './almacenamiento-local';
import { invalidarSesion, recuperarSesion } from './almacenamiento-sesion';
import { clienteHttp } from './cliente-http';
import { ErrorAutenticacion } from './errores-autenticacion';
import { validarNombre } from './validaciones-autenticacion';

import { esUsuario, type CambiosCuenta, type SesionGuardada, type Usuario } from '@/tipos/usuario';
import { esUsuarioApi, type CambiosPerfilApi, type RespuestaUno, type UsuarioApi } from '@/tipos/api';

const claveUsuario = (id: string) => `cercau.usuario.v1.${id}`;

export async function obtenerUsuario(id: string): Promise<Usuario | null> {
  try {
    const contenido = await almacenamientoLocal.getItem(claveUsuario(id));
    if (contenido === null) return null;
    const usuario: unknown = JSON.parse(contenido);
    if (esUsuario(usuario) && usuario.id === id) return usuario;
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos leer tus datos. Reintentá sin borrar la aplicación.');
  }
  throw new ErrorAutenticacion('ALMACENAMIENTO', 'Los datos guardados no se pueden leer. No los sobrescribimos para conservarlos.');
}

export async function guardarUsuario(usuario: Usuario): Promise<Usuario> {
  if (!esUsuario(usuario)) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'Revisá los datos de tu cuenta.');
  try {
    await almacenamientoLocal.setItem(claveUsuario(usuario.id), JSON.stringify(usuario));
    return usuario;
  } catch {
    throw new ErrorAutenticacion('ALMACENAMIENTO', 'No pudimos guardar el cambio. Se conservó el valor anterior; intentá nuevamente.');
  }
}

async function exigirSesion(actual: Usuario): Promise<SesionGuardada> {
  const sesion = await recuperarSesion();
  if (!sesion || sesion.usuarioId !== actual.id) throw new ErrorAutenticacion('SIN_SESION', 'Iniciá sesión para guardar cambios en tu cuenta.');
  return sesion;
}

async function comprobarSesion(sesion: SesionGuardada) {
  if ((await recuperarSesion())?.token !== sesion.token) {
    throw new ErrorAutenticacion('SIN_SESION', 'La sesión cambió. Volvé a ingresar para continuar.');
  }
}

async function usuarioDeRespuesta(datos: unknown, actual: Usuario, sesion: SesionGuardada): Promise<Usuario> {
  await comprobarSesion(sesion);
  if (!esUsuarioApi(datos)) throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió datos de cuenta que no pudimos interpretar.');
  if (datos.id !== actual.id) {
    await invalidarSesion(sesion.token);
    throw new ErrorAutenticacion('SESION_INVALIDA', 'La respuesta no corresponde a tu cuenta. Volvé a ingresar.');
  }
  return { ...datos, biometriaActiva: actual.biometriaActiva };
}

export async function actualizarCuenta(actual: Usuario, cambios: CambiosCuenta): Promise<Usuario> {
  const sesion = await exigirSesion(actual);
  if (cambios.favoritos !== undefined) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'Usá el botón de favorito del comercio.');
  // La biometría es una preferencia del dispositivo: no forma parte de PATCH /yo.
  if (cambios.biometriaActiva !== undefined) return guardarUsuario({ ...actual, biometriaActiva: cambios.biometriaActiva });
  const cuerpo: CambiosPerfilApi = {};
  if (cambios.nombre !== undefined) {
    const error = validarNombre(cambios.nombre);
    if (error) throw new ErrorAutenticacion('DATOS_INVALIDOS', error);
    cuerpo.nombre = cambios.nombre.trim();
  }
  if (cambios.rubrosDeInteres !== undefined) cuerpo.rubrosDeInteres = [...new Set(cambios.rubrosDeInteres)];
  if (cambios.avisosActivos !== undefined) cuerpo.avisosActivos = cambios.avisosActivos;
  if (!Object.keys(cuerpo).length) return actual;
  const respuesta = await clienteHttp.patch<RespuestaUno<UsuarioApi>>('/yo', cuerpo);
  return usuarioDeRespuesta(respuesta.data?.datos, actual, sesion);
}

export async function cambiarFavorito(actual: Usuario, id: string, agregar: boolean): Promise<Usuario> {
  const sesion = await exigirSesion(actual);
  if (actual.rol !== 'vecino') throw new ErrorAutenticacion('SIN_PERMISO', 'Los favoritos están disponibles para cuentas de vecino.');
  if (!/^com-[A-Za-z0-9_-]{1,36}$/.test(id)) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'El identificador del comercio no es válido. Volvé a cargar los comercios.');
  const ruta = `/yo/favoritos/${encodeURIComponent(id)}`;
  if (agregar) {
    const respuesta = await clienteHttp.put<RespuestaUno<UsuarioApi>>(ruta);
    return usuarioDeRespuesta(respuesta.data?.datos, actual, sesion);
  }
  await clienteHttp.delete(ruta);
  await comprobarSesion(sesion);
  // DELETE confirma la eliminación con 204 y no devuelve JSON.
  return { ...actual, favoritos: actual.favoritos.filter((favorito) => favorito !== id) };
}
