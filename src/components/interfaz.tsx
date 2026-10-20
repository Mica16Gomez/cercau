import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { LogoCercau } from '@/components/logo-cercau';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ScreenHeader({ titulo, descripcion }: { titulo?: string; descripcion?: string }) {
  return <View style={styles.header}>
    <LogoCercau />
    {titulo && <ThemedText accessibilityRole="header" style={Typography.title}>{titulo}</ThemedText>}
    {descripcion && <ThemedText themeColor="textSecondaryStrong">{descripcion}</ThemedText>}
  </View>;
}

export function SectionHeader({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return <View style={styles.section}>
    <ThemedText accessibilityRole="header" style={[Typography.section, styles.grow]}>{titulo}</ThemedText>
    {detalle && <ThemedText type="small" themeColor="textSecondary">{detalle}</ThemedText>}
  </View>;
}

export function CategoryChip({ titulo, seleccionado, icono, ancho, onPress }: { titulo: string; seleccionado: boolean; icono?: SymbolViewProps['name']; ancho: number; onPress: () => void }) {
  const tema = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={titulo} accessibilityState={{ selected: seleccionado }} onPress={onPress}
    style={({ pressed }) => [styles.chipTouch, { width: ancho }, pressed && styles.pressed]}>
    <View style={[styles.chip, { backgroundColor: seleccionado ? tema.forest : tema.backgroundElement, borderColor: seleccionado ? tema.forest : tema.border }]}>
      {icono && <SymbolView name={icono} size={23} tintColor={seleccionado ? tema.onForest : tema.primary} />}
      <ThemedText style={styles.chipLabel} themeColor={seleccionado ? 'onForest' : 'text'}>{titulo}</ThemedText>
    </View>
  </Pressable>;
}

export function SearchField({ value, onChangeText, onClear }: { value: string; onChangeText: (value: string) => void; onClear: () => void }) {
  const tema = useTheme();
  return <View style={[styles.search, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
    <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={22} tintColor={tema.primary} />
    <TextInput accessibilityLabel="Buscar por nombre o categoría" placeholder="Buscar comercios, productos o servicios" placeholderTextColor={tema.textSecondary}
      value={value} onChangeText={onChangeText} autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={Keyboard.dismiss}
      selectionColor={tema.primary} style={[styles.input, { color: tema.text, outlineColor: tema.primary }]} />
    {value.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={onClear} style={styles.searchButton}>
      <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={22} tintColor={tema.textSecondary} />
    </Pressable> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Buscar comercios" accessibilityHint="Cierra el teclado y mantiene los resultados actuales."
      onPress={Keyboard.dismiss} style={styles.searchButton}>
      <SymbolView name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }} size={22} tintColor={tema.primary} />
    </Pressable>
  </View>;
}

export function PromotionBadge({ texto }: { texto: string }) {
  const tema = useTheme();
  return <View style={[styles.badge, { backgroundColor: tema.promotionBackground }]}>
    <SymbolView name={{ ios: 'tag', android: 'sell', web: 'sell' }} size={14} tintColor={tema.promotion} />
    <ThemedText type="smallBold" themeColor="promotion" style={styles.grow}>{texto}</ThemedText>
  </View>;
}

type Estado = 'cargando' | 'vacio' | 'error' | 'sin-conexion' | 'sin-permiso';
const iconos: Record<Exclude<Estado, 'cargando'>, SymbolViewProps['name']> = {
  vacio: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  error: { ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' },
  'sin-conexion': { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' },
  'sin-permiso': { ios: 'location.slash', android: 'location_off', web: 'location_off' },
};

// Presentación compartida; la pantalla decide cuándo existe cada estado real.
export function EstadoInterfaz({ tipo = 'vacio', titulo, descripcion, accion, onPress }: {
  tipo?: Estado; titulo: string; descripcion?: string; accion?: string; onPress?: () => void;
}) {
  const tema = useTheme();
  return <View style={styles.state} accessibilityLiveRegion="polite">
    <View style={[styles.stateIcon, { backgroundColor: tipo === 'error' ? tema.terracottaSoft : tema.primarySoft }]}>
      {tipo === 'cargando' ? <ActivityIndicator color={tema.primary} /> : <SymbolView name={iconos[tipo]} size={25} tintColor={tipo === 'error' ? tema.error : tema.primary} />}
    </View>
    <ThemedText accessibilityRole={tipo === 'error' ? 'alert' : 'header'} style={[Typography.section, styles.center]}>{titulo}</ThemedText>
    {descripcion && <ThemedText type="small" themeColor="textSecondaryStrong" style={styles.center}>{descripcion}</ThemedText>}
    {accion && onPress && <Pressable accessibilityRole="button" onPress={onPress} style={styles.stateAction}>
      <ThemedText type="smallBold" themeColor="actionText">{accion}</ThemedText>
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  section: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  grow: { flexShrink: 1 },
  chipTouch: { minHeight: 72, minWidth: 44 },
  chip: { flex: 1, minHeight: 72, borderWidth: 1, borderRadius: 20, paddingHorizontal: 4, paddingVertical: 10, gap: 6, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: Radii.pill, paddingLeft: 18, paddingRight: 2, boxShadow: '0px 3px 12px rgba(38,58,50,0.06)' },
  input: { flex: 1, minWidth: 0, fontSize: 13, paddingVertical: 14 },
  searchButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start', maxWidth: '100%' },
  state: { alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 28 },
  stateIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stateAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
