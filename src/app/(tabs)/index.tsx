import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business-card';
import { EncabezadoBuscar, EncabezadoComercios } from '@/components/encabezado-buscar';
import { LogoCercau } from '@/components/logo-cercau';
import { CategoryChip, EstadoInterfaz, SearchField } from '@/components/interfaz';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { categories, filterBusinesses, type Category } from '@/data/search-businesses';
import { useTheme } from '@/hooks/use-theme';

const categoryIcons = {
  Todos: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  Comida: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  Servicios: { ios: 'wrench.and.screwdriver', android: 'handyman', web: 'handyman' },
  Salud: { ios: 'heart', android: 'ecg_heart', web: 'ecg_heart' },
} as const;

export default function SearchScreen() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const contentWidth = Math.min(width, 560) - 32;
  const cardWidth = fontScale > 1.3 ? Math.min(contentWidth, 220) : Math.round((contentWidth - 20) / 2.4);
  const categoryWidth = Math.max(fontScale > 1.3 ? 96 : 66, (contentWidth - 24) / 4);
  const { usuario } = useAutenticacion();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  // Los favoritos viven en memoria: se reinician al cerrar o recargar la app.
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const visibleBusinesses = filterBusinesses(query, selectedCategory);

  function toggleFavorite(id: string) {
    setFavoriteIds((current) =>
      current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id]
    );
  }

  function clearFilters() {
    setQuery('');
    setSelectedCategory('Todos');
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
            {categories.map((category) => <CategoryChip key={category} ancho={categoryWidth} titulo={category} icono={categoryIcons[category]} seleccionado={category === selectedCategory} onPress={() => setSelectedCategory(category)} />)}
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          <EncabezadoComercios cantidad={visibleBusinesses.length} onVerTodos={clearFilters} />
          {visibleBusinesses.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled" contentContainerStyle={styles.businessList}>
            {visibleBusinesses.map((business) => (
              <View key={business.id} style={{ width: cardWidth }}>
                <BusinessCard
                  business={business}
                  isFavorite={favoriteIds.includes(business.id)}
                  onToggleFavorite={() => toggleFavorite(business.id)}
                />
              </View>
            ))}
          </ScrollView>}
          {visibleBusinesses.length === 0 && (
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
