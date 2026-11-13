import { createElement, useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkState } from 'expo-network';

import type { PropsMapaDirectorio } from './mapa-directorio-tipos';
import { EstadoDirectorio } from './estado-directorio';

import { CategoryChip, EstadoInterfaz } from '@/components/interfaz';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useConsulta } from '@/hooks/use-consulta';
import { useTheme } from '@/hooks/use-theme';
import { distanciaMetros, formatearDistancia } from '@/servicios/directorio-reglas';
import { obtenerDirectorio } from '@/servicios/directorio';
import { solicitarUbicacionActual } from '@/servicios/ubicacion-directorio';
import type { Coordenadas } from '@/tipos/directorio';

const centroCiudad: Coordenadas = { latitud: -32.4827, longitud: -58.2323 };

/**
 * Mapa web con un marcador por comercio. Se usa Leaflet vía CDN dentro de un iframe
 * aislado (srcDoc): sin claves de API y sin dependencias extra del bundle web.
 */
function MapaComerciosWeb({ comercios, centro, enfocadoId }: {
  comercios: { id: string; nombre: string; direccion: string; coordenadas: Coordenadas }[];
  centro: Coordenadas;
  enfocadoId?: string | null;
}) {
  const marcadores = comercios.map((comercio) => ({
    ...comercio,
    esEnfocado: comercio.id === enfocadoId,
  }));
  // El mapa se centra en el comercio enfocado (o en el centro de la ciudad)
  // y ajusta el zoom para que todos los pines queden a la vista.
  const latitudes = comercios.map((comercio) => comercio.coordenadas.latitud);
  const longitudes = comercios.map((comercio) => comercio.coordenadas.longitud);
  const minLat = Math.min(centro.latitud, ...latitudes);
  const maxLat = Math.max(centro.latitud, ...latitudes);
  const minLng = Math.min(centro.longitud, ...longitudes);
  const maxLng = Math.max(centro.longitud, ...longitudes);
  const comerciosJson = JSON.stringify(marcadores).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>html,body{margin:0;padding:0;width:100%;height:100%;font-family:system-ui,sans-serif}
#mapa{width:100vw;height:100vh}
.comercio-popup b{display:block;font-size:14px}
.comercio-popup span{color:#555;font-size:12px}
.leaflet-container{background:#DDE8DF}
.pin-circulo{width:100%;height:100%;border-radius:50%;background:#7A5C3E;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.pin-activo .pin-circulo{background:#285B47;border-width:3px}
</style></head><body><div id="mapa"></div>
<script>
var comercios = ${comerciosJson};
var entidadesHtml = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, function (caracter) { return entidadesHtml[caracter]; });
}
function iniciarMapa() {
  var mapa = L.map('mapa', { scrollWheelZoom: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapa);
  // Los iconos por defecto de Leaflet resuelven sus URLs relativas al documento y
  // dentro de un iframe srcDoc quedan rotas: usamos círculos con divIcon.
  var icono = L.divIcon({ className: 'pin', html: '<div class="pin-circulo"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
  var iconoActivo = L.divIcon({ className: 'pin pin-activo', html: '<div class="pin-circulo"></div>', iconSize: [24, 24], iconAnchor: [12, 12] });
  comercios.forEach(function (c) {
    var marcador = L.marker([c.coordenadas.latitud, c.coordenadas.longitud], {
      title: c.nombre,
      icon: c.esEnfocado ? iconoActivo : icono
    }).addTo(mapa);
    marcador.bindPopup('<div class="comercio-popup"><b>' + escaparHtml(c.nombre) + '</b><span>' + escaparHtml(c.direccion) + '</span></div>');
    if (c.esEnfocado) marcador.openPopup();
  });
  mapa.fitBounds([
    [${minLat}, ${minLng}],
    [${maxLat}, ${maxLng}]
  ], { padding: [28, 28], maxZoom: 16 });
  // Al montar dentro de un iframe el tamaño final puede llegar tarde: si el
  // viewport cambió, recalculamos para que los tiles se carguen completos.
  setTimeout(function () { mapa.invalidateSize(); }, 150);
  setTimeout(function () { mapa.invalidateSize(); }, 500);
  if (window.ResizeObserver) new ResizeObserver(function () { mapa.invalidateSize(); }).observe(document.body);
}
// Cargamos Leaflet desde CDN y esperamos a que esté disponible antes de dibujar.
function esperarLeaflet() { if (window.L) iniciarMapa(); else setTimeout(esperarLeaflet, 100); }
esperarLeaflet();
</script></body></html>`;
  return createElement('iframe', {
    srcDoc: html,
    title: 'Mapa de comercios',
    sandbox: 'allow-scripts',
    style: { width: '100%', height: 320, border: 0, borderRadius: 18, backgroundColor: '#DDE8DF', display: 'block' },
  });
}

export function MapaDirectorio({ comercioId, rubroId: rubroInicial }: PropsMapaDirectorio) {
  const tema = useTheme();
  const red = useNetworkState();
  const consulta = useConsulta(useCallback(() => obtenerDirectorio(), []));
  const [rubroId, setRubroId] = useState(rubroInicial ?? '');
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [solicitando, setSolicitando] = useState(false);
  const comercios = useMemo(() => {
    const visibles = (consulta.datos?.comercios ?? []).filter((comercio) =>
      comercio.activo && (!rubroId || comercio.rubroId === rubroId),
    );
    if (!ubicacion) return visibles;
    return [...visibles].sort((a, b) => distanciaMetros(ubicacion, a.coordenadas) - distanciaMetros(ubicacion, b.coordenadas));
  }, [consulta.datos, rubroId, ubicacion]);
  const comercioEnfocado = consulta.datos?.comercios.find((item) => item.id === comercioId);
  const centro = comercioEnfocado?.coordenadas ?? ubicacion ?? consulta.datos?.comercios[0]?.coordenadas ?? centroCiudad;
  const sinConexion = red.isConnected === false || red.isInternetReachable === false;

  async function ubicarme() {
    if (solicitando) return;
    setSolicitando(true);
    setErrorUbicacion(null);
    try {
      const resultado = await solicitarUbicacionActual();
      if (resultado.estado === 'ok') setUbicacion(resultado.coordenadas);
      else if (resultado.estado === 'sin-permiso') setErrorUbicacion('No diste permiso de ubicación. El listado y las fichas siguen disponibles.');
      else setErrorUbicacion('El navegador no pudo ubicarte. Podés seguir consultando los comercios.');
    } catch {
      setErrorUbicacion('No pudimos obtener tu ubicación. El listado sigue disponible.');
    } finally {
      setSolicitando(false);
    }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={[estilos.pantalla, { backgroundColor: tema.background }]}>
    <View style={estilos.contenido}>
      <ThemedText accessibilityRole="header" style={estilos.titulo}>Comercios en el mapa</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">El mapa web usa OpenStreetMap; en Android e iOS se muestran marcadores nativos.</ThemedText>
      <EstadoDirectorio datos={consulta.datos} sinConexion={sinConexion} />
      {consulta.cargando ? <EstadoInterfaz tipo="cargando" titulo="Cargando comercios…" /> : consulta.error ?
        <EstadoInterfaz tipo="error" titulo="No pudimos cargar los comercios" descripcion={consulta.error} accion="Reintentar" onPress={consulta.reintentar} /> :
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
          <MapaComerciosWeb
            comercios={comercios.map((comercio) => ({
              id: comercio.id,
              nombre: comercio.nombre,
              direccion: comercio.direccion,
              coordenadas: comercio.coordenadas,
            }))}
            centro={centro}
            enfocadoId={comercioId}
          />
          {comercios.length ? <ScrollView contentContainerStyle={estilos.lista}>
            {comercios.map((comercio) =>
              <Pressable key={comercio.id} onPress={() => router.push({ pathname: '/comercios/[id]', params: { id: comercio.id } })}
                style={[estilos.item, { borderColor: tema.border, backgroundColor: tema.backgroundElement }]}>
                <View style={estilos.textos}>
                  <ThemedText type="smallBold">{comercio.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{comercio.direccion}</ThemedText>
                  {ubicacion && <ThemedText type="small" themeColor="textSecondary">{formatearDistancia(distanciaMetros(ubicacion, comercio.coordenadas))}</ThemedText>}
                </View>
                <ThemedText type="smallBold" themeColor="actionText">{comercio.id === comercioId ? 'Seleccionado' : 'Ver ficha'}</ThemedText>
              </Pressable>)}
          </ScrollView> : <EstadoInterfaz titulo="No hay comercios para mostrar" descripcion="Probá con otro rubro." />}
        </>}
    </View>
  </SafeAreaView>;
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, gap: 12 },
  titulo: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  rubros: { gap: 8, alignItems: 'center', paddingVertical: 2 },
  rubrosFila: { flexGrow: 0, flexShrink: 0 },
  mapaWeb: { width: '100%', height: 280, borderWidth: 0, borderRadius: 18, backgroundColor: '#DDE8DF' },
  botonUbicacion: { minHeight: 44, alignSelf: 'flex-start', borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center' },
  lista: { gap: 10, paddingBottom: 16 },
  item: { minHeight: 64, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  textos: { flex: 1, gap: 4 },
});
