import { esComercioApi } from './adaptar-comercio';

import type { Rubro } from '@/tipos/comercio';
import type { ComercioDirectorio } from '@/tipos/directorio';

export function esComercioDirectorio(valor: unknown): valor is ComercioDirectorio {
  if (!esComercioApi(valor)) return false;
  const comercio = valor;
  const coordenadas = comercio.coordenadas;
  const latitud = coordenadas?.latitud;
  const longitud = coordenadas?.longitud;
  return typeof comercio.descripcion === 'string' &&
    typeof comercio.direccion === 'string' &&
    typeof latitud === 'number' && Number.isFinite(latitud) && latitud >= -90 && latitud <= 90 &&
    typeof longitud === 'number' && Number.isFinite(longitud) && longitud >= -180 && longitud <= 180 &&
    (comercio.telefono === null || typeof comercio.telefono === 'string') &&
    (comercio.whatsapp === null || typeof comercio.whatsapp === 'string') &&
    (comercio.instagram === null || typeof comercio.instagram === 'string') &&
    Array.isArray(comercio.imagenes) && comercio.imagenes.every((imagen) => typeof imagen === 'string') &&
    (comercio.videoUrl === null || typeof comercio.videoUrl === 'string') &&
    Number.isInteger(comercio.cantidadResenas) && comercio.cantidadResenas >= 0 &&
    (comercio.codigoQr === null || typeof comercio.codigoQr === 'string') &&
    Array.isArray(comercio.mediosDePago) && comercio.mediosDePago.every((medio) => typeof medio === 'string') &&
    (!('productos' in comercio) || Array.isArray(comercio.productos) && comercio.productos.every((producto) => typeof producto === 'string'));
}

export function esRubroDirectorio(valor: unknown): valor is Rubro {
  if (typeof valor !== 'object' || valor === null) return false;
  const rubro = valor as Partial<Rubro>;
  return typeof rubro.id === 'string' && /^rub-[A-Za-z0-9_-]{1,36}$/.test(rubro.id) &&
    typeof rubro.nombre === 'string' && !!rubro.nombre.trim() &&
    typeof rubro.icono === 'string' && typeof rubro.color === 'string' &&
    typeof rubro.orden === 'number' && Number.isFinite(rubro.orden);
}
