import { ErrorAutenticacion } from './errores-autenticacion';
import type { ComercioApi, HorarioApi } from '@/tipos/api';
import type { Comercio, Rubro } from '@/tipos/comercio';

export function esComercioApi(valor: unknown): valor is ComercioApi {
  if (typeof valor !== 'object' || valor === null) return false;
  const comercio = valor as Partial<ComercioApi>;
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
  return typeof comercio.id === 'string' && /^com-[A-Za-z0-9_-]{1,36}$/.test(comercio.id) &&
    typeof comercio.nombre === 'string' && !!comercio.nombre.trim() && typeof comercio.rubroId === 'string' &&
    typeof comercio.direccion === 'string' && typeof comercio.activo === 'boolean' &&
    typeof comercio.puntaje === 'number' && Number.isFinite(comercio.puntaje) && comercio.puntaje >= 0 && comercio.puntaje <= 5 &&
    Array.isArray(comercio.horarios) && comercio.horarios.every((horario: HorarioApi) => horario &&
      Number.isInteger(horario.dia) && horario.dia >= 0 && horario.dia <= 6 && hora.test(horario.abre) && hora.test(horario.cierra));
}

export function estaAbierto(comercio: ComercioApi, ahora = new Date()): boolean {
  if (!comercio.activo) return false;
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(ahora);
  const parte = (tipo: string) => partes.find((item) => item.type === tipo)?.value ?? '';
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parte('weekday'));
  const minutos = Number(parte('hour')) * 60 + Number(parte('minute'));
  const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
  return comercio.horarios.some((horario) => {
    const abre = aMinutos(horario.abre);
    const cierra = aMinutos(horario.cierra);
    if (cierra > abre) return horario.dia === dia && minutos >= abre && minutos < cierra;
    // También contempla un horario nocturno que termina al día siguiente.
    return (horario.dia === dia && minutos >= abre) || ((horario.dia + 1) % 7 === dia && minutos < cierra);
  });
}

export function adaptarComercio(comercio: ComercioApi, rubros: Rubro[]): Comercio {
  const rubro = rubros.find((item) => item.id === comercio.rubroId);
  if (!rubro) throw new ErrorAutenticacion('ERROR_INESPERADO', 'La API devolvió un comercio con un rubro desconocido. Reintentá la consulta.');
  return {
    id: comercio.id, name: comercio.nombre, category: rubro.nombre,
    initials: comercio.nombre.trim().split(/\s+/).slice(0, 2).map((palabra) => palabra[0]).join('').toUpperCase(),
    // Se conserva el espacio de la tarjeta; la API ofrece dirección, no distancia.
    distance: comercio.direccion,
    rating: comercio.puntaje.toFixed(1).replace('.', ','), isOpen: estaAbierto(comercio),
    // Sin relaciones con fotografías ficticias. BusinessCard conserva su ilustración.
  };
}
