import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import * as servicio from '@/servicios/autenticacion';
import { suscribirSesionInvalidada } from '@/servicios/almacenamiento-sesion';
import { solicitarValidacionBiometrica } from '@/servicios/biometria';
import { actualizarCuenta } from '@/servicios/cuenta';
import { ErrorAutenticacion, obtenerMensajeError } from '@/servicios/errores-autenticacion';
import type { CambiosCuenta, DatosInicioSesion, DatosRegistro, Usuario } from '@/tipos/usuario';

type ContextoAutenticacion = {
  usuario: Usuario | null;
  cargando: boolean;
  recuperandoSesion: boolean;
  errorRecuperacion: string | null;
  iniciarSesion: (datos: DatosInicioSesion) => Promise<void>;
  registrarse: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  reingresoDisponible: boolean;
  reingresarConBiometria: () => Promise<void>;
  cambiarBiometria: (activa: boolean) => Promise<void>;
  validarAccionComercio: () => Promise<void>;
  editarNombre: (nombre: string) => Promise<void>;
  alternarFavorito: (id: string) => Promise<void>;
  alternarRubro: (id: string) => Promise<void>;
  cambiarAvisos: (activos: boolean) => Promise<void>;
  reintentarRecuperacion: () => void;
};

const AutenticacionContext = createContext<ContextoAutenticacion | null>(null);

export function ProveedorAutenticacion({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [recuperandoSesion, setRecuperandoSesion] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorRecuperacion, setErrorRecuperacion] = useState<string | null>(null);
  const [intentoRecuperacion, setIntentoRecuperacion] = useState(0);
  const [sesionBloqueada, setSesionBloqueada] = useState(false);
  const operacionEnCurso = useRef(false);
  const usuarioActual = useRef<Usuario | null>(null);
  const invalidaciones = useRef(0);

  function mostrarUsuario(siguiente: Usuario | null) {
    usuarioActual.current = siguiente;
    setUsuario(siguiente);
  }

  useEffect(() => {
    return suscribirSesionInvalidada(() => {
      invalidaciones.current++;
      mostrarUsuario(null);
      setSesionBloqueada(false);
      setErrorRecuperacion('Tu sesión terminó. Volvé a ingresar con correo y contraseña.');
    });
  }, []);

  useEffect(() => {
    let activo = true;
    const version = invalidaciones.current;
    servicio.restaurarSesion()
      .then((sesion) => {
        if (!activo || version !== invalidaciones.current) return;
        setSesionBloqueada(!!sesion?.biometriaActiva);
        mostrarUsuario(sesion?.biometriaActiva ? null : sesion);
        setErrorRecuperacion(null);
      })
      .catch((error: unknown) => { if (activo) setErrorRecuperacion(obtenerMensajeError(error)); })
      .finally(() => { if (activo) setRecuperandoSesion(false); });
    return () => { activo = false; };
  }, [intentoRecuperacion]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      // No escuchamos "inactive": el diálogo biométrico de iOS también lo usa.
      if (estado === 'background' && usuarioActual.current?.biometriaActiva && !operacionEnCurso.current) {
        mostrarUsuario(null);
        setSesionBloqueada(true);
      }
    });
    return () => suscripcion.remove();
  }, []);

  async function ejecutar(operacion: () => Promise<Usuario | null>) {
    // La referencia también bloquea dos pulsaciones antes del siguiente render.
    if (recuperandoSesion || operacionEnCurso.current) {
      throw new ErrorAutenticacion('OPERACION_EN_CURSO', 'Esperá a que termine la operación actual.');
    }
    operacionEnCurso.current = true;
    setProcesando(true);
    const version = invalidaciones.current;
    try {
      const siguienteUsuario = await operacion();
      if (version !== invalidaciones.current) throw new ErrorAutenticacion('SESION_INVALIDA', 'Tu sesión terminó. Volvé a ingresar.');
      // También protege un guardado que terminó con la app ya en segundo plano.
      const bloquear = !!siguienteUsuario?.biometriaActiva && AppState.currentState === 'background';
      mostrarUsuario(bloquear ? null : siguienteUsuario);
      setSesionBloqueada(bloquear);
      setErrorRecuperacion(null);
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  }

  function exigirUsuario(): Usuario {
    const actual = usuarioActual.current;
    if (!actual) throw new ErrorAutenticacion('SIN_SESION', 'Iniciá sesión para usar esta opción.');
    return actual;
  }

  async function guardarCambios(cambios: CambiosCuenta) {
    const anterior = exigirUsuario();
    const siguiente = { ...anterior, ...cambios };
    // El mismo usuario alimenta todas las pantallas; ante un fallo se revierte.
    mostrarUsuario(siguiente);
    try { return await actualizarCuenta(anterior, cambios); }
    catch (error) {
      const vencida = error instanceof ErrorAutenticacion && (error.codigo === 'SESION_INVALIDA' || error.codigo === 'SIN_SESION');
      mostrarUsuario(vencida || !usuarioActual.current ? null : anterior);
      if (vencida) { setSesionBloqueada(false); setErrorRecuperacion('Tu sesión terminó. Volvé a ingresar.'); }
      throw error;
    }
  }

  async function reingresarConBiometria() {
    await ejecutar(async () => {
      if (!sesionBloqueada) throw new ErrorAutenticacion('SIN_SESION', 'Primero ingresá con correo y contraseña y activá la biometría en Mi cuenta.');
      const actual = await servicio.restaurarSesion();
      if (!actual?.biometriaActiva) throw new ErrorAutenticacion('SESION_INVALIDA', 'Volvé a ingresar con correo y contraseña.');
      await solicitarValidacionBiometrica();
      // La API vuelve a validar el token tras el diálogo del sistema.
      const verificada = await servicio.restaurarSesion();
      if (verificada?.id !== actual.id) throw new ErrorAutenticacion('SESION_INVALIDA', 'Tu sesión terminó. Ingresá con correo y contraseña.');
      return verificada;
    });
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
      reingresoDisponible: sesionBloqueada,
      reingresarConBiometria,
      cambiarBiometria: (activa) => ejecutar(async () => {
        exigirUsuario();
        if (activa) await solicitarValidacionBiometrica('Confirmá la activación del ingreso biométrico');
        return guardarCambios({ biometriaActiva: activa });
      }),
      validarAccionComercio: async () => {
        const actual = exigirUsuario();
        if (actual.rol !== 'comercio' || !actual.comercioId) throw new ErrorAutenticacion('DATOS_INVALIDOS', 'Esta acción requiere una cuenta con un comercio asociado.');
        await ejecutar(async () => {
          const sesion = await servicio.restaurarSesion();
          if (sesion?.id !== actual.id) throw new ErrorAutenticacion('SIN_SESION', 'Volvé a iniciar sesión para continuar.');
          await solicitarValidacionBiometrica('Verificá tu identidad para continuar como comercio');
          return exigirUsuario();
        });
      },
      editarNombre: (nombre) => ejecutar(() => guardarCambios({ nombre: nombre.trim() })),
      alternarFavorito: (id) => ejecutar(async () => {
        const actual = exigirUsuario();
        const favoritos = actual.favoritos.includes(id) ? actual.favoritos.filter((item) => item !== id) : [...actual.favoritos, id];
        return guardarCambios({ favoritos });
      }),
      alternarRubro: (id) => ejecutar(async () => {
        const actual = exigirUsuario();
        const rubrosDeInteres = actual.rubrosDeInteres.includes(id) ? actual.rubrosDeInteres.filter((item) => item !== id) : [...actual.rubrosDeInteres, id];
        return guardarCambios({ rubrosDeInteres });
      }),
      cambiarAvisos: (avisosActivos) => ejecutar(() => guardarCambios({ avisosActivos })),
      reintentarRecuperacion: () => {
        if (operacionEnCurso.current || recuperandoSesion) return;
        setRecuperandoSesion(true);
        setIntentoRecuperacion((actual) => actual + 1);
      },
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
