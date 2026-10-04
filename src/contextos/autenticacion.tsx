import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { recuperarSesion } from '@/servicios/almacenamiento-sesion';
import * as servicio from '@/servicios/autenticacion';
import { ErrorAutenticacion, obtenerMensajeError } from '@/servicios/errores-autenticacion';
import type { DatosInicioSesion, DatosRegistro, Usuario } from '@/tipos/usuario';

type ContextoAutenticacion = {
  usuario: Usuario | null;
  cargando: boolean;
  recuperandoSesion: boolean;
  errorRecuperacion: string | null;
  iniciarSesion: (datos: DatosInicioSesion) => Promise<void>;
  registrarse: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const AutenticacionContext = createContext<ContextoAutenticacion | null>(null);

export function ProveedorAutenticacion({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [recuperandoSesion, setRecuperandoSesion] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorRecuperacion, setErrorRecuperacion] = useState<string | null>(null);
  const operacionEnCurso = useRef(false);

  useEffect(() => {
    let activo = true;
    recuperarSesion()
      .then((sesion) => { if (activo) setUsuario(sesion); })
      .catch((error: unknown) => { if (activo) setErrorRecuperacion(obtenerMensajeError(error)); })
      .finally(() => { if (activo) setRecuperandoSesion(false); });
    return () => { activo = false; };
  }, []);

  async function ejecutar(operacion: () => Promise<Usuario | null>) {
    // La referencia también bloquea dos pulsaciones antes del siguiente render.
    if (recuperandoSesion || operacionEnCurso.current) {
      throw new ErrorAutenticacion('OPERACION_EN_CURSO', 'Esperá a que termine la operación actual.');
    }
    operacionEnCurso.current = true;
    setProcesando(true);
    try {
      const siguienteUsuario = await operacion();
      setUsuario(siguienteUsuario);
      setErrorRecuperacion(null);
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  }

  return (
    <AutenticacionContext.Provider value={{
      usuario,
      cargando: recuperandoSesion || procesando,
      recuperandoSesion,
      errorRecuperacion,
      iniciarSesion: (datos) => ejecutar(() => servicio.iniciarSesion(datos)),
      registrarse: (datos) => ejecutar(() => servicio.registrarse(datos)),
      cerrarSesion: () => ejecutar(async () => { await servicio.cerrarSesion(); return null; }),
    }}>
      {children}
    </AutenticacionContext.Provider>
  );
}

export function useAutenticacion() {
  const contexto = useContext(AutenticacionContext);
  if (!contexto) throw new Error('useAutenticacion debe usarse dentro de ProveedorAutenticacion.');
  return contexto;
}
