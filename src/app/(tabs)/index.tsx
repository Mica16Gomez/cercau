import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business-card';
import { EncabezadoBuscar, EncabezadoComercios } from '@/components/encabezado-buscar';
import { LogoCercau } from '@/components/logo-cercau';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useAutenticacion } from '@/contextos/autenticacion';
import { categories, filterBusinesses, type Category } from '@/data/businesses';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const { usuario } = useAutenticacion();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todas');
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
    setSelectedCategory('Todas');
  }

  return (
    // NativeTabs protege el contenido del ScrollView en iOS, incluida la barra inferior.
    <SafeAreaView
      edges={Platform.OS === 'ios' ? [] : ['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LogoCercau />
          {usuario ? <ThemedText type="small" themeColor="primary" style={styles.greeting}>Hola, {usuario.nombre.trim().split(/\s+/)[0]}</ThemedText> : <View style={[styles.localBadge, { backgroundColor: theme.primarySoft }]}>
            <ThemedText style={styles.localBadgeText} themeColor="primary">TU GUÍA LOCAL</ThemedText>
          </View>}
        </View>

        <EncabezadoBuscar />

        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={theme.primary}
            size={22}
          />
          <TextInput
            accessibilityLabel="Buscar por nombre o categoría"
            placeholder="Buscá un comercio o rubro"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={theme.primary}
            style={[styles.searchInput, { color: theme.text, outlineColor: theme.primary }]}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setQuery('')}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor={theme.textSecondary}
                size={20}
              />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar comercios"
            accessibilityHint="Cierra el teclado y mantiene los resultados actuales."
            onPress={Keyboard.dismiss}
            style={({ pressed }) => [styles.searchButton, { backgroundColor: theme.mustard }, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              tintColor={theme.forest}
              size={24}
            />
          </Pressable>
        </View>

        <View style={styles.categoriesSection}>
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>Categorías</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.categories}>
            {categories.map((category) => {
              const isSelected = category === selectedCategory;

              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedCategory(category)}
                  style={({ pressed }) => [
                    styles.category,
                    {
                      backgroundColor: isSelected ? theme.forest : theme.backgroundElement,
                      borderColor: isSelected ? theme.forest : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor={isSelected ? 'onForest' : 'text'}>
                    {category}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          <EncabezadoComercios cantidad={visibleBusinesses.length} />
          <View style={styles.businessList}>
            {visibleBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                isFavorite={favoriteIds.includes(business.id)}
                onToggleFavorite={() => toggleFavorite(business.id)}
              />
            ))}
            {visibleBusinesses.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  tintColor={theme.primary}
                  size={32}
                />
                <ThemedText style={styles.emptyTitle}>No encontramos comercios</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                  Probá con otro nombre o elegí otra categoría.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={({ pressed }) => [
                    styles.resetButton,
                    { backgroundColor: theme.primarySoft },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="primary">Limpiar filtros</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          Cerca de vos. Cerca de lo nuestro.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  greeting: { flexShrink: 1, fontWeight: '600' },
  localBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  localBadgeText: { fontSize: 10, lineHeight: 16, fontWeight: '700', letterSpacing: 1.2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 30,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 58,
    gap: 8,
    boxShadow: '0px 3px 12px rgba(23, 63, 53, 0.05)',
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 16 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  categoriesSection: { gap: 10 },
  sectionTitle: { fontSize: 22, lineHeight: 29, fontWeight: '800', flexShrink: 1 },
  categories: { gap: 8, paddingRight: 4 },
  category: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsSection: { gap: 8 },
  businessList: { gap: 12 },
  emptyState: { borderWidth: 1, borderRadius: 24, padding: 24, gap: 12, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  centeredText: { textAlign: 'center' },
  resetButton: { minHeight: 44, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22 },
  pressed: { opacity: 0.65 },
  footer: { textAlign: 'center' },
});
