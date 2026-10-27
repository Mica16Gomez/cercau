import { esUsuario, type Usuario } from './usuario';

export type RespuestaUno<T> = { datos: T; meta: null };
export type RespuestaLista<T> = { datos: T[]; meta: { total: number; pagina: number; porPagina: number } };
export type RespuestaError = { error: { codigo: string; mensaje: string } };
export type UsuarioApi = Omit<Usuario, 'biometriaActiva'>;
export type SesionApi = { token: string; usuario: UsuarioApi };
export type CambiosPerfilApi = Partial<Pick<UsuarioApi, 'nombre' | 'rubrosDeInteres' | 'avisosActivos'>>;

export type HorarioApi = { dia: number; abre: string; cierra: string };
export type ComercioApi = {
  id: string;
  nombre: string;
  rubroId: string;
  descripcion: string;
  direccion: string;
  coordenadas: { latitud: number; longitud: number };
  telefono: string | null;
  whatsapp: string | null;
  instagram: string | null;
  imagenes: string[];
  videoUrl: string | null;
  horarios: HorarioApi[];
  mediosDePago: string[];
  puntaje: number;
  cantidadResenas: number;
  codigoQr: string | null;
  activo: boolean;
};

export function esUsuarioApi(valor: unknown): valor is UsuarioApi {
  return typeof valor === 'object' && valor !== null && esUsuario({ ...valor, biometriaActiva: false });
}
