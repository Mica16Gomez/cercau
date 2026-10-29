import { adaptarComercio, esComercioApi } from './adaptar-comercio';
import { clienteHttp } from './cliente-http';
import { ErrorAutenticacion } from './errores-autenticacion';
import { obtenerListaCompleta } from './listas-api';
import type { ComercioApi, RespuestaUno } from '@/tipos/api';
import type { Comercio, Rubro } from '@/tipos/comercio';

let consultaRubros: Promise<Rubro[]> | null = null;
const consultasComercios = new Map<string, Promise<Comercio[]>>();

export async function obtenerCategorias(): Promise<Rubro[]> {
  return [{ id: '', nombre: 'Todos', icono: '', color: '', orden: 0 }, ...await obtenerRubros()];
}

export function buscarComercios(texto: string, rubroId: string): Promise<Comercio[]> {
  const filtros: Record<string, string> = {};
  if (texto.trim()) filtros.q = texto.trim();
  if (rubroId) filtros.rubroId = rubroId;
  const clave = JSON.stringify(filtros);
  let consulta = consultasComercios.get(clave);
  if (!consulta) {
    consulta = cargarComercios(filtros).finally(() => { consultasComercios.delete(clave); });
    consultasComercios.set(clave, consulta);
  }
  return consulta;
}

async function cargarComercios(filtros: Record<string, string>): Promise<Comercio[]> {
  const [datos, rubros] = await Promise.all([obtenerListaCompleta<ComercioApi>('/comercios', 1000, filtros), obtenerRubros()]);
  if (!datos.every(esComercioApi)) throw new ErrorAutenticacion('ERROR_INESPERADO', 'No pudimos interpretar los comercios de la API.');
  return datos.map((comercio) => adaptarComercio(comercio, rubros));
}

export async function obtenerComerciosPorIds(ids: readonly string[]): Promise<Comercio[]> {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return [];
  const [comercios, rubros] = await Promise.all([
    Promise.all(unicos.map(async (id) => {
      const respuesta = await clienteHttp.get<RespuestaUno<ComercioApi>>(`/comercios/${encodeURIComponent(id)}`);
      const comercio = respuesta.data?.datos;
      if (!esComercioApi(comercio) || comercio.id !== id) throw new ErrorAutenticacion('ERROR_INESPERADO', 'No pudimos interpretar uno de tus comercios favoritos.');
      return comercio;
    })), obtenerRubros(),
  ]);
  return comercios.map((comercio) => adaptarComercio(comercio, rubros));
}

export function obtenerRubros(): Promise<Rubro[]> {
  if (!consultaRubros) consultaRubros = cargarRubros().finally(() => { consultaRubros = null; });
  return consultaRubros;
}

async function cargarRubros(): Promise<Rubro[]> {
  const rubros = await obtenerListaCompleta<Rubro>('/rubros', 100);
  if (!rubros.every((rubro) => rubro && typeof rubro.id === 'string' && /^rub-[A-Za-z0-9_-]{1,36}$/.test(rubro.id) &&
    typeof rubro.nombre === 'string' && !!rubro.nombre.trim() && typeof rubro.icono === 'string' &&
    typeof rubro.color === 'string' && Number.isFinite(rubro.orden))) {
    throw new ErrorAutenticacion('ERROR_INESPERADO', 'No pudimos interpretar los rubros de la API.');
  }
  return rubros;
}
