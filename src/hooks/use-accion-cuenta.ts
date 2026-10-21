import { useRef, useState } from 'react';

import { obtenerMensajeError } from '@/servicios/errores-autenticacion';

export function useAccionCuenta() {
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const pendiente = useRef<{ accion: () => Promise<void>; mensaje: string } | null>(null);
  const ocupada = useRef(false);

  async function ejecutar(accion: () => Promise<void>, mensaje = 'Cambio guardado.') {
    if (ocupada.current) return;
    ocupada.current = true;
    setError(null); setExito(null);
    try { await accion(); pendiente.current = null; setExito(mensaje); }
    catch (error) { pendiente.current = { accion, mensaje }; setError(obtenerMensajeError(error)); }
    finally { ocupada.current = false; }
  }
  return {
    error, exito, ejecutar,
    limpiar: () => { setError(null); setExito(null); pendiente.current = null; },
    reintentar: () => { if (pendiente.current) void ejecutar(pendiente.current.accion, pendiente.current.mensaje); },
  };
}
