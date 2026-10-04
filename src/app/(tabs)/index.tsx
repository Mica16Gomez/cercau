import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/business-card';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { categories, filterBusinesses, type Category } from '@/data/businesses';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
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
          <ThemedText style={styles.brand} themeColor="primary">Cercau</ThemedText>
          <View style={[styles.localBadge, { backgroundColor: theme.primarySoft }]}>
            <ThemedText style={styles.localBadgeText} themeColor="primary">TU GUÍA LOCAL</ThemedText>
          </View>
        </View>

        <View style={styles.introduction}>
          <ThemedText accessibilityRole="header" style={styles.headline}>
            Encontrá comercios cerca tuyo
          </ThemedText>
          <ThemedText themeColor="textSecondary">Lo mejor de tu barrio, en un solo lugar.</ThemedText>
        </View>

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
            style={[styles.searchInput, { color: theme.text }]}
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
                      backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor={isSelected ? 'onPrimary' : 'textSecondary'}>
                    {category}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          <View style={styles.resultsHeading}>
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>Comercios cercanos</ThemedText>
            <View style={[styles.count, { backgroundColor: theme.primarySoft }]}>
              <ThemedText
                type="smallBold"
                themeColor="primary"
                accessibilityLiveRegion="polite"
                accessibilityLabel={`${visibleBusinesses.length} comercios encontrados`}>
                {visibleBusinesses.length}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Comercios ficticios · Distancias de ejemplo
          </ThemedText>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 28,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: { fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -1.5 },
  localBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  localBadgeText: { fontSize: 10, lineHeight: 16, fontWeight: '700', letterSpacing: 1.2 },
  introduction: { gap: 10 },
  headline: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 58,
    gap: 10,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 16 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  categoriesSection: { gap: 12 },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700', flexShrink: 1 },
  categories: { gap: 8, paddingRight: 2 },
  category: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  resultsSection: { gap: 8 },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  count: { minWidth: 30, minHeight: 30, padding: 4, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  businessList: { gap: 14, marginTop: 10 },
  emptyState: { borderWidth: 1, borderRadius: 24, padding: 24, gap: 12, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  centeredText: { textAlign: 'center' },
  resetButton: { minHeight: 44, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22 },
  pressed: { opacity: 0.65 },
  footer: { textAlign: 'center' },
});
