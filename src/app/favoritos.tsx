import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { EnlaceCuenta, MensajeError } from '@/components/autenticacion/controles';
import { PantallaCuenta } from '@/components/autenticacion/pantalla-cuenta';
import { BusinessCard } from '@/components/business-card';
import { EstadoInterfaz } from '@/components/interfaz';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useConsulta } from '@/hooks/use-consulta';
import { useFavoritos } from '@/hooks/use-favoritos';
import { obtenerComerciosPorIds } from '@/servicios/comercios';

export default function FavoritosScreen() {
  const { usuario } = useAutenticacion();
  const { favoritos, alternar, cargando, error, reintentar } = useFavoritos();
  const consulta = useConsulta(useCallback(() => obtenerComerciosPorIds(usuario?.favoritos ?? []), [usuario?.favoritos]));
  return <PantallaCuenta titulo="Favoritos" descripcion="Tus comercios preferidos, guardados en tu cuenta.">
    <MensajeError mensaje={error} />
    {error && <EnlaceCuenta titulo="Reintentar guardado" onPress={reintentar} deshabilitado={cargando} />}
    {consulta.cargando ? <EstadoInterfaz tipo="cargando" titulo="Cargando favoritos…" /> : consulta.error ?
      <EstadoInterfaz tipo="error" titulo="No pudimos cargar tus favoritos" descripcion={consulta.error} accion="Reintentar" onPress={consulta.reintentar} /> :
      consulta.datos?.length ? <View style={estilos.lista}>{consulta.datos.map((comercio) =>
        <View key={comercio.id} style={estilos.tarjeta}><BusinessCard business={comercio} isFavorite={favoritos.includes(comercio.id)}
          onToggleFavorite={() => void alternar(comercio.id)} deshabilitado={cargando} /></View>)}</View> :
      <EstadoInterfaz titulo="Todavía no tenés favoritos" descripcion="Tocá el corazón de un comercio en Buscar para guardarlo en tu cuenta."
        accion="Buscar comercios" onPress={() => router.replace('/')} />}
  </PantallaCuenta>;
}
const estilos = StyleSheet.create({ lista: { gap: 16 }, tarjeta: { width: '100%' } });
