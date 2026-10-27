import { eliminarSesion, guardarSesion, invalidarSesion, recuperarSesion } from './almacenamiento-sesion';
import { clienteHttp } from './cliente-http';
import { guardarUsuario, obtenerUsuario } from './cuenta';
import { ErrorAutenticacion } from './errores-autenticacion';
import { validarInicioSesion, validarRegistro } from './validaciones-autenticacion';

import { esUsuarioApi, type RespuestaUno, type SesionApi, type UsuarioApi } from '@/tipos/api';
import type { DatosInicioSesion, DatosRegistro, Usuario } from '@/tipos/usuario';

// La API es la fuente del perfil completo. Sólo la biometría pertenece al dispositivo.
async function prepararUsuario(datos: UsuarioApi): Promise<Usuario> {
  if (!esUsuarioApi(datos)) throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió datos de cuenta que no pudimos interpretar.');
  const local = await obtenerUsuario(datos.id);
  return guardarUsuario({
    id: datos.id, email: datos.email, rol: datos.rol, comercioId: datos.comercioId,
    nombre: datos.nombre,
    favoritos: datos.favoritos, rubrosDeInteres: datos.rubrosDeInteres,
    avisosActivos: datos.avisosActivos, biometriaActiva: local?.biometriaActiva ?? false,
  });
}

function comprobarFormulario(errores: Record<string, string | undefined>) {
  const mensaje = Object.values(errores).find(Boolean);
  if (mensaje) throw new ErrorAutenticacion('DATOS_INVALIDOS', mensaje);
}

async function abrirSesion(datos: SesionApi): Promise<Usuario> {
  if (!datos || typeof datos.token !== 'string' || !datos.token.trim() || !esUsuarioApi(datos.usuario)) {
    throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió una sesión que no pudimos interpretar. Intentá nuevamente.');
  }
  const usuario = await prepararUsuario(datos.usuario);
  await guardarSesion(datos.token, usuario.id);
  return usuario;
}

export async function iniciarSesion(datos: DatosInicioSesion): Promise<Usuario> {
  comprobarFormulario(validarInicioSesion(datos));
  const respuesta = await clienteHttp.post<RespuestaUno<SesionApi>>('/auth/ingreso', {
    email: datos.email.trim().toLowerCase(), contrasena: datos.contrasena,
  });
  return abrirSesion(respuesta.data?.datos);
}

export async function registrarse(datos: DatosRegistro): Promise<Usuario> {
  comprobarFormulario(validarRegistro({ ...datos, confirmacion: datos.contrasena }));
  const respuesta = await clienteHttp.post<RespuestaUno<SesionApi>>('/auth/registro', {
    nombre: datos.nombre.trim(), email: datos.email.trim().toLowerCase(), contrasena: datos.contrasena,
  });
  try { return await abrirSesion(respuesta.data?.datos); }
  catch (error) {
    if (error instanceof ErrorAutenticacion && error.codigo === 'ALMACENAMIENTO') {
      throw new ErrorAutenticacion('ALMACENAMIENTO', 'Tu cuenta se creó, pero no pudimos guardar el acceso. Usá Iniciar sesión para continuar.');
    }
    throw error;
  }
}

export async function restaurarSesion(): Promise<Usuario | null> {
  const sesion = await recuperarSesion();
  if (!sesion) return null;
  const respuesta = await clienteHttp.get<RespuestaUno<UsuarioApi>>('/yo');
  const datos = respuesta.data?.datos;
  if (!esUsuarioApi(datos) || datos.id !== sesion.usuarioId) {
    await invalidarSesion(sesion.token);
    throw new ErrorAutenticacion('SESION_INVALIDA', 'La sesión guardada no corresponde a esta cuenta. Volvé a ingresar.');
  }
  // No restaurar una petición que terminó después de cerrar o cambiar la sesión.
  if ((await recuperarSesion())?.token !== sesion.token) return null;
  return prepararUsuario(datos);
}

export async function cerrarSesion(): Promise<void> {
  await eliminarSesion();
}
