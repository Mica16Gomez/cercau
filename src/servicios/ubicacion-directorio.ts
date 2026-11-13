import * as Location from 'expo-location';

import type { Coordenadas } from '@/tipos/directorio';

export type ResultadoUbicacion =
  | { estado: 'ok'; coordenadas: Coordenadas }
  | { estado: 'sin-permiso' }
  | { estado: 'no-disponible' };

export async function solicitarUbicacionActual(): Promise<ResultadoUbicacion> {
  try {
    const permisoActual = await Location.getForegroundPermissionsAsync();
    const permiso = permisoActual.granted ? permisoActual : await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return { estado: 'sin-permiso' };
    const ubicacion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      estado: 'ok',
      coordenadas: { latitud: ubicacion.coords.latitude, longitud: ubicacion.coords.longitude },
    };
  } catch {
    return { estado: 'no-disponible' };
  }
}
