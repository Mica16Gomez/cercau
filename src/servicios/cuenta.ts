import { almacenamientoLocal } from './almacenamiento-local';
import { recuperarSesion } from './almacenamiento-sesion';
import { obtenerComerciosPorIds, obtenerRubros } from './comercios';
import { ErrorAutenticacion } from './errores-autenticacion';
import { validarNombre } from './validaciones-autenticacion';

import { esUsuario, type CambiosCuenta, type Usuario } from '@/tipos/usuario';

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

export async function actualizarCuenta(actual: Usuario, cambios: CambiosCuenta): Promise<Usuario> {
  const sesion = await recuperarSesion();
  if (!sesion || sesion.usuarioId !== actual.id) throw new ErrorAutenticacion('SIN_SESION', 'Iniciá sesión para guardar cambios en tu cuenta.');
  const nombre = cambios.nombre?.trim() ?? actual.nombre;
  const error = validarNombre(nombre);
  if (error) throw new ErrorAutenticacion('DATOS_INVALIDOS', error);
  if (cambios.favoritos) {
    const nuevos = [...new Set(cambios.favoritos.filter((id) => !actual.favoritos.includes(id)))];
    if ((await obtenerComerciosPorIds(nuevos)).length !== nuevos.length) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'Uno de los comercios ya no está disponible.');
  }
  if (cambios.rubrosDeInteres) {
    const rubros = await obtenerRubros();
    if (cambios.rubrosDeInteres.some((id) => !rubros.some((rubro) => rubro.id === id))) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'Elegí uno de los rubros disponibles.');
  }
  // La lista explícita impide cambiar email, rol, id o comercioId desde el perfil.
  return guardarUsuario({
    ...actual, nombre,
    favoritos: [...new Set(cambios.favoritos ?? actual.favoritos)],
    rubrosDeInteres: [...new Set(cambios.rubrosDeInteres ?? actual.rubrosDeInteres)],
    avisosActivos: cambios.avisosActivos ?? actual.avisosActivos,
    biometriaActiva: cambios.biometriaActiva ?? actual.biometriaActiva,
  });
}
