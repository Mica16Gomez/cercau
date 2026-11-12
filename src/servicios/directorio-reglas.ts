import type { ComercioDirectorio, Coordenadas } from '@/tipos/directorio';

export type FiltrosDirectorio = {
  texto: string;
  rubroId: string;
  soloAbiertos: boolean;
  ubicacion: Coordenadas | null;
  ahora?: Date;
};

export type ComprobarAbierto = (comercio: ComercioDirectorio, ahora?: Date) => boolean;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim();
}

function textoProductos(comercio: ComercioDirectorio): string {
  const productos: unknown = comercio.productos;
  if (!Array.isArray(productos)) return '';
  return productos.map((producto: unknown) => {
    if (typeof producto === 'string') return producto;
    if (typeof producto !== 'object' || producto === null) return '';
    const item = producto as Record<string, unknown>;
    return [item.nombre, item.nombreProducto, item.descripcion].filter((valor): valor is string => typeof valor === 'string').join(' ');
  }).join(' ');
}

export function coincideTexto(comercio: ComercioDirectorio, texto: string): boolean {
  const consulta = normalizar(texto);
  if (!consulta) return true;
  const contenido = normalizar(`${comercio.nombre} ${comercio.descripcion} ${textoProductos(comercio)}`);
  return consulta.split(/\s+/).every((palabra) =>
    contenido.includes(palabra) || (palabra.length > 3 && palabra.endsWith('s') && contenido.includes(palabra.slice(0, -1))),
  );
}

export function distanciaMetros(origen: Coordenadas, destino: Coordenadas): number {
  const radioTierra = 6_371_000;
  const radianes = Math.PI / 180;
  const latitud = (destino.latitud - origen.latitud) * radianes;
  const longitud = (destino.longitud - origen.longitud) * radianes;
  const a = Math.sin(latitud / 2) ** 2 +
    Math.cos(origen.latitud * radianes) * Math.cos(destino.latitud * radianes) * Math.sin(longitud / 2) ** 2;
  return 2 * radioTierra * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filtrarDirectorio(
  comercios: ComercioDirectorio[],
  filtros: FiltrosDirectorio,
  comprobarAbierto: ComprobarAbierto,
): ComercioDirectorio[] {
  const resultado = comercios.filter((comercio) =>
    comercio.activo &&
    (!filtros.rubroId || comercio.rubroId === filtros.rubroId) &&
    coincideTexto(comercio, filtros.texto) &&
    (!filtros.soloAbiertos || comprobarAbierto(comercio, filtros.ahora)),
  );
  if (!filtros.ubicacion) return resultado;
  return resultado.sort((a, b) => distanciaMetros(filtros.ubicacion!, a.coordenadas) - distanciaMetros(filtros.ubicacion!, b.coordenadas));
}

export function formatearDistancia(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}
