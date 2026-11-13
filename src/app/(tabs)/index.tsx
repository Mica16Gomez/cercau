import { router } from 'expo-router';
import { useNetworkState } from 'expo-network';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnlaceCuenta, MensajeError } from '@/components/autenticacion/controles';
import { BusinessCard } from '@/components/business-card';
import { EstadoDirectorio } from '@/components/directorio/estado-directorio';
import { EncabezadoBuscar, EncabezadoComercios } from '@/components/encabezado-buscar';
import { CategoryChip, EstadoInterfaz, SearchField } from '@/components/interfaz';
import { LogoCercau } from '@/components/logo-cercau';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useConsulta } from '@/hooks/use-consulta';
import { useFavoritos } from '@/hooks/use-favoritos';
import { adaptarComercio, estaAbierto } from '@/servicios/adaptar-comercio';
import { filtrarDirectorio, distanciaMetros, formatearDistancia } from '@/servicios/directorio-reglas';
import { obtenerDirectorio } from '@/servicios/directorio';
import { solicitarUbicacionActual } from '@/servicios/ubicacion-directorio';
import type { Coordenadas } from '@/tipos/directorio';
import { useTheme } from '@/hooks/use-theme';
import { buscarComercios, obtenerCategorias } from '@/servicios/comercios';

export default function SearchScreen() {
  const theme = useTheme();
  const red = useNetworkState();
  const { width, fontScale } = useWindowDimensions();
  const contentWidth = Math.min(width, 560) - 32;
  const cardWidth = fontScale > 1.3 ? Math.min(contentWidth, 220) : Math.round((contentWidth - 20) / 2.4);
  const { usuario } = useAutenticacion();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [solicitandoUbicacion, setSolicitandoUbicacion] = useState(false);
  const [ahora, setAhora] = useState(() => new Date());
  const directorio = useConsulta(useCallback(() => obtenerDirectorio(), []));
  const { favoritos: favoriteIds, alternar, cargando, error, reintentar } = useFavoritos();
  const rubros = useMemo(() => directorio.datos?.rubros ?? [], [directorio.datos]);
  const comerciosFiltrados = useMemo(() => filtrarDirectorio(directorio.datos?.comercios ?? [], {
    texto: query,
    rubroId: selectedCategory,
    soloAbiertos,
    ubicacion,
    ahora,
  }, estaAbierto), [directorio.datos, query, selectedCategory, soloAbiertos, ubicacion, ahora]);
  const visibleBusinesses = useMemo(() => comerciosFiltrados.map((comercio) => {
    const tarjeta = adaptarComercio(comercio, rubros);
    return {
      ...tarjeta,
      distance: ubicacion ? formatearDistancia(distanciaMetros(ubicacion, comercio.coordenadas)) : comercio.direccion,
    };
  }), [comerciosFiltrados, rubros, ubicacion]);
  const sinConexion = red.isConnected === false || red.isInternetReachable === false;

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  function clearFilters() {
    setQuery('');
    setSelectedCategory('');
    setSoloAbiertos(false);
  }

  async function ordenarPorDistancia() {
    if (solicitandoUbicacion) return;
    setSolicitandoUbicacion(true);
    setErrorUbicacion(null);
    try {
      const resultado = await solicitarUbicacionActual();
      if (resultado.estado === 'ok') setUbicacion(resultado.coordenadas);
      else if (resultado.estado === 'sin-permiso') setErrorUbicacion('Sin permiso de ubicación. Podés seguir buscando por nombre y rubro.');
      else setErrorUbicacion('La ubicación no está disponible en esta plataforma. La búsqueda sigue funcionando.');
    } catch {
      setErrorUbicacion('No pudimos obtener tu ubicación. Revisá los permisos o seguí buscando por nombre y rubro.');
    } finally {
      setSolicitandoUbicacion(false);
    }
  }

  return (
    // El borde superior se protege explícitamente; NativeTabs conserva su ajuste inferior.
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logo}><LogoCercau /></View>
          {usuario && <ThemedText type="small" themeColor="primary" style={styles.greeting}>Hola, {usuario.nombre.trim().split(/\s+/)[0]}</ThemedText>}
        </View>

        <View style={styles.cover}>
          <EncabezadoBuscar />
          <View style={styles.searchOverlap}>
            <SearchField value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.categories}>
            {[{ id: '', nombre: 'Todos' }, ...rubros].map((category) => <CategoryChip key={category.id || 'todos'} compacto titulo={category.nombre} seleccionado={category.id === selectedCategory} onPress={() => setSelectedCategory(category.id)} />)}
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          <EstadoDirectorio datos={directorio.datos} sinConexion={sinConexion} />
          {directorio.cargando && <EstadoInterfaz tipo="cargando" titulo="Cargando comercios…" />}
          {directorio.error && <EstadoInterfaz tipo="error" titulo="No pudimos cargar los comercios" descripcion={directorio.error} accion="Reintentar" onPress={directorio.reintentar} />}
          {!directorio.cargando && !directorio.error && <View style={styles.filtrosRapidos}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: soloAbiertos }} onPress={() => setSoloAbiertos((valor) => !valor)}
              style={[styles.filtroRapido, { backgroundColor: soloAbiertos ? theme.forest : theme.backgroundElement, borderColor: soloAbiertos ? theme.forest : theme.border }]}>
              <ThemedText type="smallBold" themeColor={soloAbiertos ? 'onForest' : 'text'}>Abierto ahora</ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => void ordenarPorDistancia()} disabled={solicitandoUbicacion}
              style={[styles.filtroRapido, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, solicitandoUbicacion && styles.presionado]}>
              <ThemedText type="smallBold" themeColor="primary">{solicitandoUbicacion ? 'Buscando…' : ubicacion ? 'Cerca de mí' : 'Ordenar por distancia'}</ThemedText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/mapa', params: selectedCategory ? { rubroId: selectedCategory } : {} })}
              style={[styles.filtroRapido, { backgroundColor: theme.primarySoft, borderColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" themeColor="primary">Ver mapa</ThemedText>
            </Pressable>
          </View>}
          {errorUbicacion && <ThemedText accessibilityRole="alert" type="small" themeColor="textSecondary">{errorUbicacion}</ThemedText>}
          <MensajeError mensaje={error} />
          {error && <EnlaceCuenta titulo="Reintentar guardado" onPress={reintentar} deshabilitado={cargando} />}
          <EncabezadoComercios cantidad={visibleBusinesses.length} onVerTodos={clearFilters} />
          {visibleBusinesses.length > 0 && !directorio.cargando && !directorio.error && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled" contentContainerStyle={styles.businessList}>
            {visibleBusinesses.map((business) => (
              <View key={business.id} style={{ width: cardWidth, gap: 6 }}>
                <BusinessCard
                  business={business}
                  formatoBuscar
                  isFavorite={favoriteIds.includes(business.id)}
                  onToggleFavorite={() => void alternar(business.id)}
                  deshabilitado={cargando}
                />
                <Pressable accessibilityRole="button" accessibilityLabel={`Ver ficha de ${business.name}`}
                  onPress={() => router.push({ pathname: '/comercios/[id]', params: { id: business.id } })}
                  style={[styles.verFicha, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="smallBold" themeColor="primary">Ver ficha</ThemedText>
                </Pressable>
              </View>
            ))}
          </ScrollView>}
          {!directorio.cargando && !directorio.error && visibleBusinesses.length === 0 && (
            <EstadoInterfaz titulo="No encontramos comercios" descripcion="Probá con otro nombre o elegí otra categoría." accion="Limpiar filtros" onPress={clearFilters} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  logo: { transform: [{ scale: 1.14 }], transformOrigin: 'left top' },
  greeting: { flexShrink: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
  cover: { marginHorizontal: -16, marginTop: -34 },
  searchOverlap: { marginHorizontal: 16, marginTop: -24, zIndex: 1 },
  categoriesSection: { gap: 10 },
  categories: { gap: 8, paddingRight: 4 },
  resultsSection: { gap: 10 },
  businessList: { gap: 10, paddingBottom: 4, alignItems: 'stretch' },
  filtrosRapidos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filtroRapido: { minHeight: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  verFicha: { minHeight: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  presionado: { opacity: 0.65 },
});
