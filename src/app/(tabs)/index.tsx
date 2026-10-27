import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business-card';
import { EnlaceCuenta, MensajeError } from '@/components/autenticacion/controles';
import { EncabezadoBuscar, EncabezadoComercios } from '@/components/encabezado-buscar';
import { LogoCercau } from '@/components/logo-cercau';
import { CategoryChip, EstadoInterfaz, SearchField } from '@/components/interfaz';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useConsulta } from '@/hooks/use-consulta';
import { useFavoritos } from '@/hooks/use-favoritos';
import { buscarComercios, obtenerCategorias } from '@/servicios/comercios';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const contentWidth = Math.min(width, 560) - 32;
  const cardWidth = fontScale > 1.3 ? Math.min(contentWidth, 220) : Math.round((contentWidth - 20) / 2.4);
  const { usuario } = useAutenticacion();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const categorias = useConsulta(useCallback(() => obtenerCategorias(), []));
  const comercios = useConsulta(useCallback(() => buscarComercios(query, selectedCategory), [query, selectedCategory]));
  const { favoritos: favoriteIds, alternar, cargando, error, reintentar } = useFavoritos();
  const visibleBusinesses = comercios.datos ?? [];

  function clearFilters() {
    setQuery('');
    setSelectedCategory('');
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
            {(categorias.datos ?? []).map((category) => <CategoryChip key={category.id} compacto titulo={category.nombre} seleccionado={category.id === selectedCategory} onPress={() => setSelectedCategory(category.id)} />)}
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          {categorias.error && <EstadoInterfaz tipo="error" titulo="No pudimos cargar las categorías" accion="Reintentar" onPress={categorias.reintentar} />}
          <MensajeError mensaje={error} />
          {error && <EnlaceCuenta titulo="Reintentar guardado" onPress={reintentar} deshabilitado={cargando} />}
          <EncabezadoComercios cantidad={visibleBusinesses.length} onVerTodos={clearFilters} />
          {comercios.cargando && <EstadoInterfaz tipo="cargando" titulo="Cargando comercios…" />}
          {comercios.error && <EstadoInterfaz tipo="error" titulo="No pudimos cargar los comercios" descripcion={comercios.error} accion="Reintentar" onPress={comercios.reintentar} />}
          {visibleBusinesses.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled" contentContainerStyle={styles.businessList}>
            {visibleBusinesses.map((business) => (
              <View key={business.id} style={{ width: cardWidth }}>
                <BusinessCard
                  business={business}
                  formatoBuscar
                  isFavorite={favoriteIds.includes(business.id)}
                  onToggleFavorite={() => void alternar(business.id)}
                  deshabilitado={cargando}
                />
              </View>
            ))}
          </ScrollView>}
          {!comercios.cargando && !comercios.error && visibleBusinesses.length === 0 && (
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
});
