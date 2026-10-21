import { restaurarSesion } from './autenticacion';
import { ErrorAutenticacion } from './errores-autenticacion';

import type { ResenaCuenta } from '@/tipos/actividad';

type ConsultarResenas = (usuarioId: string) => Promise<ResenaCuenta[]>;
let consultarResenas: ConsultarResenas | null = null;

// El módulo de reseñas podrá registrar su lectura sin modificar la pantalla de cuenta.
export function conectarConsultaResenas(consulta: ConsultarResenas) { consultarResenas = consulta; }

export async function obtenerMisResenas(usuarioId: string): Promise<ResenaCuenta[]> {
  const usuario = await restaurarSesion();
  if (!usuario || usuario.id !== usuarioId) throw new ErrorAutenticacion('SIN_SESION', 'Iniciá sesión para consultar tu actividad.');
  return consultarResenas ? consultarResenas(usuarioId) : [];
}
