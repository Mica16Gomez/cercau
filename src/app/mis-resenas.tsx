import { useCallback } from 'react';

import { TarjetaCuenta } from '@/components/autenticacion/controles';
import { PantallaCuenta } from '@/components/autenticacion/pantalla-cuenta';
import { EstadoInterfaz } from '@/components/interfaz';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useConsulta } from '@/hooks/use-consulta';
import { obtenerMisResenas } from '@/servicios/actividad';

export default function MisResenasScreen() {
  const { usuario } = useAutenticacion();
  const consulta = useConsulta(useCallback(() => obtenerMisResenas(usuario?.id ?? ''), [usuario?.id]));
  return <PantallaCuenta titulo="Mis reseñas" descripcion="Opiniones que compartiste con tu cuenta.">
    {consulta.cargando ? <EstadoInterfaz tipo="cargando" titulo="Cargando reseñas…" /> : consulta.error ?
      <EstadoInterfaz tipo="error" titulo="No pudimos cargar tus reseñas" descripcion={consulta.error} accion="Reintentar" onPress={consulta.reintentar} /> :
      consulta.datos?.length ? consulta.datos.map((resena) => <TarjetaCuenta key={resena.id}>
        <ThemedText type="smallBold">{resena.comercioNombre}</ThemedText>
        <ThemedText>{resena.texto}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{resena.fecha}</ThemedText>
      </TarjetaCuenta>) : <EstadoInterfaz titulo="No hay reseñas para mostrar" descripcion="Todavía no hay opiniones registradas para tu cuenta." accion="Actualizar" onPress={consulta.reintentar} />}
  </PantallaCuenta>;
}
