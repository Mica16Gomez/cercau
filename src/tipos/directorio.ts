import type { ComercioApi } from './api';
import type { Rubro } from './comercio';

export type { Rubro };
export type Coordenadas = ComercioApi['coordenadas'];
export type Horario = ComercioApi['horarios'][number];

export type ComercioDirectorio = Omit<ComercioApi, 'coordenadas'> & {
  coordenadas: Coordenadas;
  productos?: string[];
};

/** Contrato del PRD para un comercio del directorio. La tarjeta visual sigue usando el tipo de `tipos/comercio.ts`. */
export type Comercio = ComercioDirectorio;

export type DatosDirectorio = {
  comercios: ComercioDirectorio[];
  rubros: Rubro[];
  fuente: 'red' | 'cache' | 'demo';
  actualizadoEn: number | null;
  aviso: string | null;
};
