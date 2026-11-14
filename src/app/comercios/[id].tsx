import * as Linking from 'expo-linking';
import { useNetworkState } from 'expo-network';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoDirectorio } from '@/components/directorio/estado-directorio';
import { EstadoInterfaz } from '@/components/interfaz';
import { SeccionResenas } from '@/components/resenas/seccion-resenas';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useConsulta } from '@/hooks/use-consulta';
import { useTheme } from '@/hooks/use-theme';
import { estaAbierto } from '@/servicios/adaptar-comercio';
import { obtenerComercioDirectorio } from '@/servicios/directorio';
import { ErrorAutenticacion, obtenerMensajeError } from '@/servicios/errores-autenticacion';
import type { Horario } from '@/tipos/directorio';
const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function mostrarHorario(horarios: Horario[], dia: number): string {
  const tramos = horarios.filter((horario) => horario.dia === dia).sort((a, b) => a.abre.localeCompare(b.abre));
  return tramos.length ? tramos.map(({ abre, cierra }) => `${abre}–${cierra}`).join(' · ') : 'Cerrado';
}

function destinoInstagram(instagram: string): string {
  const limpio = instagram.trim();
  if (/^https?:\/\//i.test(limpio)) {
    const url = new URL(limpio);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('El enlace de Instagram no es válido.');
    return url.toString();
  }
  const usuario = limpio.replace(/^@/, '');
  if (!/^[\w.]{1,30}$/.test(usuario)) throw new Error('El usuario de Instagram no es válido.');
  return `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
}

export default function ComercioDetalleScreen() {
  const tema = useTheme();
  const red = useNetworkState();
  const parametros = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof parametros.id === 'string' ? parametros.id : parametros.id?.[0];
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const consulta = useConsulta(useCallback(() => {
    if (!id) return Promise.reject(new ErrorAutenticacion('DATOS_INVALIDOS', 'El identificador del comercio no es válido.'));
    return obtenerComercioDirectorio(id);
  }, [id]));

  async function abrirEnlace(url: string) {
    setErrorAccion(null);
    try { await Linking.openURL(url); }
    catch (error: unknown) { setErrorAccion(obtenerMensajeError(error)); }
  }

  if (consulta.cargando) {
    return <SafeAreaView style={[estilos.pantalla, { backgroundColor: tema.background }]}><EstadoInterfaz tipo="cargando" titulo="Cargando ficha…" /></SafeAreaView>;
  }
  if (consulta.error || !consulta.datos) {
    return <SafeAreaView style={[estilos.pantalla, { backgroundColor: tema.background }]}>
      <View style={estilos.error}>
        <EstadoInterfaz tipo="error" titulo="No pudimos cargar el comercio" descripcion={consulta.error ?? undefined} accion="Reintentar" onPress={consulta.reintentar} />
        <Pressable onPress={() => router.back()} style={estilos.botonSecundario}><ThemedText type="smallBold" themeColor="actionText">Volver</ThemedText></Pressable>
      </View>
    </SafeAreaView>;
  }

  const { comercio, datos } = consulta.datos;
  const rubro = datos.rubros.find((item) => item.id === comercio.rubroId)?.nombre ?? 'Comercio';
  const abierto = estaAbierto(comercio);

  function irAlMapa() {
    router.push({ pathname: '/mapa', params: { comercioId: comercio.id } });
  }

  function abrirWhatsApp() {
    if (!comercio.whatsapp) return;
    const numero = comercio.whatsapp.replace(/\D/g, '');
    if (numero.length < 8) { setErrorAccion('El número de WhatsApp no es válido.'); return; }
    void abrirEnlace(`https://wa.me/${numero}`);
  }

  function abrirInstagram() {
    if (!comercio.instagram) return;
    try { void abrirEnlace(destinoInstagram(comercio.instagram)); }
    catch (error: unknown) { setErrorAccion(error instanceof Error ? error.message : 'El enlace de Instagram no es válido.'); }
  }

  const destino = Number.isFinite(comercio.coordenadas.latitud) && Number.isFinite(comercio.coordenadas.longitud)
    ? `${comercio.coordenadas.latitud},${comercio.coordenadas.longitud}`
    : comercio.direccion;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.pantalla, { backgroundColor: tema.background }]}>
    <ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.barra}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver a Buscar" onPress={() => router.back()} style={estilos.volver}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor={tema.primary} />
        </Pressable>
        <ThemedText accessibilityRole="header" style={estilos.titulo} numberOfLines={2}>{comercio.nombre}</ThemedText>
      </View>
      <EstadoDirectorio datos={datos} sinConexion={red.isConnected === false || red.isInternetReachable === false} />

      <View style={estilos.resumen}>
        <ThemedText type="small" themeColor="textSecondary">{rubro} · {comercio.direccion}</ThemedText>
        <View style={estilos.estado}>
          <ThemedText type="smallBold" themeColor={abierto ? 'open' : 'closed'}>{abierto ? 'Abierto ahora' : 'Cerrado ahora'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">★ {comercio.puntaje.toFixed(1).replace('.', ',')} · {comercio.cantidadResenas} reseñas</ThemedText>
        </View>
      </View>

      <View style={estilos.acciones}>
        {comercio.telefono && <Accion titulo="Llamar" icono="phone" onPress={() => void abrirEnlace(`tel:${comercio.telefono?.replace(/[^\d+]/g, '')}`)} />}
        {comercio.whatsapp && <Accion titulo="WhatsApp" icono="message" onPress={abrirWhatsApp} />}
        {comercio.instagram && <Accion titulo="Instagram" icono="camera" onPress={abrirInstagram} />}
        <Accion titulo="Cómo llegar" icono="map" onPress={() => void abrirEnlace(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=walking`)} />
      </View>
      {errorAccion && <ThemedText accessibilityRole="alert" type="small" themeColor="error">{errorAccion}</ThemedText>}
      <Pressable onPress={irAlMapa} style={[estilos.botonMapa, { backgroundColor: tema.primarySoft }]}>
        <ThemedText type="smallBold" themeColor="primary">Ver ubicación en Cercau</ThemedText>
      </Pressable>

      <View style={estilos.seccion}>
        <ThemedText accessibilityRole="header" style={estilos.subtitulo}>Sobre el comercio</ThemedText>
        <ThemedText themeColor="textSecondaryStrong">{comercio.descripcion || 'Este comercio todavía no agregó una descripción.'}</ThemedText>
      </View>

      

      <View style={estilos.seccion}>
        <ThemedText accessibilityRole="header" style={estilos.subtitulo}>Horarios</ThemedText>
        {comercio.horarios.length ? dias.map((dia, indice) =>
          <View key={dia} style={[estilos.filaHorario, { borderBottomColor: tema.border }]}>
            <ThemedText type="smallBold">{dia}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{mostrarHorario(comercio.horarios, indice)}</ThemedText>
          </View>) :
          <ThemedText type="small" themeColor="textSecondary">No hay horarios informados; consultá al comercio antes de acercarte.</ThemedText>}
      </View>

      <View style={estilos.seccion}>
        <ThemedText accessibilityRole="header" style={estilos.subtitulo}>Medios de pago</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{comercio.mediosDePago.length ? comercio.mediosDePago.join(' · ') : 'Sin información disponible.'}</ThemedText>
      </View>

      
      <SeccionResenas
  comercioId={comercio.id}
  nombreComercio={comercio.nombre}
  mostrarMultimedia={true}
/>
    </ScrollView>
  </SafeAreaView>;
}

function Accion({ titulo, icono, onPress }: { titulo: string; icono: 'phone' | 'message' | 'camera' | 'map'; onPress: () => void }) {
  const tema = useTheme();
  const simbolos = {
    phone: { ios: 'phone', android: 'call', web: 'call' },
    message: { ios: 'message', android: 'chat', web: 'chat' },
    camera: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
    map: { ios: 'map', android: 'map', web: 'map' },
  } as const;
  return <Pressable accessibilityRole="button" onPress={onPress} style={[estilos.accion, { borderColor: tema.border, backgroundColor: tema.backgroundElement }]}>
    <SymbolView name={simbolos[icono]} tintColor={tema.primary} size={19} />
    <ThemedText type="smallBold">{titulo}</ThemedText>
  </Pressable>;
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flexGrow: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  volver: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titulo: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  resumen: { gap: 8 },
  estado: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accion: { minHeight: 44, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  botonMapa: { minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  seccion: { gap: 9 },
  subtitulo: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  fotos: { gap: 10 },
  foto: { width: 280, height: 190, borderRadius: 16, backgroundColor: '#DDE8DF' },
  filaHorario: { minHeight: 36, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  botonSecundario: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
