import { esUsuario, type Usuario } from './usuario';

export type RespuestaUno<T> = { datos: T; meta: null };
export type RespuestaError = { error: { codigo: string; mensaje: string } };
export type UsuarioApi = Omit<Usuario, 'biometriaActiva'>;
export type SesionApi = { token: string; usuario: UsuarioApi };

export function esUsuarioApi(valor: unknown): valor is UsuarioApi {
  return typeof valor === 'object' && valor !== null && esUsuario({ ...valor, biometriaActiva: false });
}
