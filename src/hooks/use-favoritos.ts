import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { useAutenticacion } from '@/contextos/autenticacion';
import { obtenerMensajeError } from '@/servicios/errores-autenticacion';

export function useFavoritos() {
  const { usuario, cargando, alternarFavorito } = useAutenticacion();
  const [fallo, setFallo] = useState<{ usuarioId: string; id: string; mensaje: string } | null>(null);
  const intentando = useRef(false);

  async function alternar(id: string) {
    if (cargando || intentando.current) return;
    if (!usuario) { router.push('/iniciar-sesion'); return; }
    intentando.current = true;
    setFallo(null);
    try { await alternarFavorito(id); }
    catch (error) { setFallo({ usuarioId: usuario.id, id, mensaje: obtenerMensajeError(error) }); }
    finally { intentando.current = false; }
  }
  const errorActual = fallo?.usuarioId === usuario?.id ? fallo : null;
  return {
    favoritos: usuario?.favoritos ?? [],
    cargando, alternar,
    error: errorActual?.mensaje ?? null,
    reintentar: () => { if (errorActual) void alternar(errorActual.id); },
  };
}
