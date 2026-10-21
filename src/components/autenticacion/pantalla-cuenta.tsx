import type { PropsWithChildren } from 'react';

import { PantallaAutenticacion } from './pantalla-autenticacion';

import { useAutenticacion } from '@/contextos/autenticacion';

// Comparte encabezado, teclado, scroll y áreas seguras con los formularios existentes.
export function PantallaCuenta({ titulo, descripcion, children }: PropsWithChildren<{ titulo: string; descripcion: string }>) {
  const { usuario } = useAutenticacion();
  if (!usuario) return null;
  return <PantallaAutenticacion titulo={titulo} descripcion={descripcion} permitirSesion compacto>{children}</PantallaAutenticacion>;
}
