import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Callout, Marker, type Region } from 'react-native-maps';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoDirectorio } from './estado-directorio';
import type { PropsMapaDirectorio } from './mapa-directorio-tipos';

import { CategoryChip, EstadoInterfaz } from '@/components/interfaz';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useConsulta } from '@/hooks/use-consulta';
import { useTheme } from '@/hooks/use-theme';
import { obtenerDirectorio } from '@/servicios/directorio';
import { solicitarUbicacionActual } from '@/servicios/ubicacion-directorio';
import { obtenerMensajeError } from '@/servicios/errores-autenticacion';
import type { Coordenadas } from '@/tipos/directorio';
import { useNetworkState } from 'expo-network';

const centroCiudad: Coordenadas = { latitud: -32.4827, longitud: -58.2323 };
const delta: Pick<Region, 'latitudeDelta' | 'longitudeDelta'> = { latitudeDelta: 0.045, longitudeDelta: 0.045 };

export function MapaDirectorio({ comercioId, rubroId: rubroInicial }: PropsMapaDirectorio) {
  const tema = useTheme();
  const red = useNetworkState();
  const consulta = useConsulta(useCallback(() => obtenerDirectorio(), []));
  const [rubroId, setRubroId] = useState(rubroInicial ?? '');
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState(false);
  const mapaRef = useRef<MapView>(null);
  const comercios = useMemo(() =>
    (consulta.datos?.comercios ?? []).filter((comercio) => comercio.activo && (!rubroId || comercio.rubroId === rubroId)),
  [consulta.datos, rubroId]);
  const comercioEnfocado = consulta.datos?.comercios.find((item) => item.id === comercioId);
  const centro = comercioEnfocado?.coordenadas ?? ubicacion ?? consulta.datos?.comercios[0]?.coordenadas ?? centroCiudad;
  const region: Region = { latitude: centro.latitud, longitude: centro.longitud, ...delta };

  // Animamos el mapa hacia el nuevo centro sin re-montarlo (la key fija evita el parpadeo gris).
  useEffect(() => {
    mapaRef.current?.animateToRegion(region, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro.latitud, centro.longitud]);

  async function ubicarme() {
    if (solicitando) return;
    setSolicitando(true);
    setErrorUbicacion(null);
    try {
      const resultado = await solicitarUbicacionActual();
      if (resultado.estado === 'ok') {
        setUbicacion(resultado.coordenadas);
        mapaRef.current?.animateToRegion({ latitude: resultado.coordenadas.latitud, longitude: resultado.coordenadas.longitud, ...delta });
      } else if (resultado.estado === 'sin-permiso') {
        setErrorUbicacion('No diste permiso de ubicación. El mapa y la búsqueda por rubro siguen disponibles.');
      } else {
        setErrorUbicacion('La ubicación no está disponible en esta plataforma. Podés explorar el mapa sin ubicarte.');
      }
    } catch (error: unknown) {
      setErrorUbicacion(obtenerMensajeError(error));
    } finally {
      setSolicitando(false);
    }
  }

  const sinConexion = red.isConnected === false || red.isInternetReachable === false;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.pantalla, { backgroundColor: tema.background }]}>
    <View style={estilos.contenido}>
      <View style={estilos.encabezado}>
        <ThemedText accessibilityRole="header" style={estilos.titulo}>Comercios en el mapa</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Explorá el barrio, con o sin permiso de ubicación.</ThemedText>
      </View>
      <EstadoDirectorio datos={consulta.datos} sinConexion={sinConexion} />
      {consulta.cargando ? <EstadoInterfaz tipo="cargando" titulo="Cargando comercios…" /> : consulta.error ?
        <EstadoInterfaz tipo="error" titulo="No pudimos cargar el mapa" descripcion={consulta.error} accion="Reintentar" onPress={consulta.reintentar} /> :
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.rubrosFila} contentContainerStyle={estilos.rubros}>
            {[{ id: '', nombre: 'Todos' }, ...(consulta.datos?.rubros ?? [])].map((rubro) =>
              <CategoryChip key={rubro.id || 'todos'} compacto titulo={rubro.nombre} seleccionado={rubroId === rubro.id} onPress={() => setRubroId(rubro.id)} />)}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={() => void ubicarme()} disabled={solicitando}
            style={[estilos.botonUbicacion, { backgroundColor: tema.primarySoft }]}>
            <ThemedText type="smallBold" themeColor="primary">{solicitando ? 'Buscando ubicación…' : 'Ubicarme'}</ThemedText>
          </Pressable>
          {errorUbicacion && <ThemedText accessibilityRole="alert" type="small" themeColor="error">{errorUbicacion}</ThemedText>}
          {comercios.length ? <MapView
            key="mapa-directorio"
            ref={mapaRef}
            style={estilos.mapa}
            initialRegion={region}
            showsUserLocation={!!ubicacion}
            showsMyLocationButton={false}
            accessibilityLabel="Mapa de comercios">
            {comercios.map((comercio) =>
              <Marker key={comercio.id}
                coordinate={{ latitude: comercio.coordenadas.latitud, longitude: comercio.coordenadas.longitud }}
                pinColor={tema.primary}>
                <Callout onPress={() => router.push({ pathname: '/comercios/[id]', params: { id: comercio.id } })}>
                  <View style={estilos.callout}>
                    <ThemedText type="smallBold" style={estilos.textoCallout}>{comercio.nombre}</ThemedText>
                    <ThemedText type="small" style={estilos.textoCallout}>{comercio.direccion}</ThemedText>
                    <ThemedText type="smallBold" style={estilos.enlaceCallout}>Ver ficha</ThemedText>
                  </View>
                </Callout>
              </Marker>)}
          </MapView> :
            <EstadoInterfaz titulo="No hay comercios para mostrar" descripcion="Probá con otro rubro." />}
        </>}
    </View>
  </SafeAreaView>;
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  encabezado: { gap: 4 },
  titulo: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  rubros: { gap: 8, alignItems: 'center', paddingVertical: 2 },
  rubrosFila: { flexGrow: 0, flexShrink: 0 },
  botonUbicacion: { minHeight: 44, alignSelf: 'flex-start', borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center' },
  mapa: { flex: 1, minHeight: 260, width: '100%', borderRadius: 18, overflow: 'hidden' },
  callout: { gap: 5, minWidth: 140, padding: 6 },
  textoCallout: { color: '#263A32' },
  enlaceCallout: { color: '#A44818' },
});
