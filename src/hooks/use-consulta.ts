import { useCallback, useEffect, useState } from 'react';

import { obtenerMensajeError } from '@/servicios/errores-autenticacion';

// Ignora respuestas de una consulta anterior al navegar o cambiar de usuario.
export function useConsulta<T>(consultar: () => Promise<T>) {
  const [resultado, setResultado] = useState<{ consulta: typeof consultar; datos?: T; error: string | null; cargando: boolean }>();
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vigente = true;
    consultar().then(
      (datos) => { if (vigente) setResultado({ consulta: consultar, datos, error: null, cargando: false }); },
      (error: unknown) => { if (vigente) setResultado({ consulta: consultar, error: obtenerMensajeError(error), cargando: false }); },
    );
    return () => { vigente = false; };
  }, [consultar, intento]);
  const reintentar = useCallback(() => { setResultado(undefined); setIntento((actual) => actual + 1); }, []);
  const actual = resultado?.consulta === consultar ? resultado : undefined;
  return { datos: actual?.datos, error: actual?.error ?? null, cargando: !actual, reintentar };
}
