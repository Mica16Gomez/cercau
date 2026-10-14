import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IlustracionComercio } from '@/components/ilustracion-comercio';
import type { Business } from '@/data/businesses';
import { useTheme } from '@/hooks/use-theme';

type BusinessCardProps = {
  business: Business;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function BusinessCard({ business, isFavorite, onToggleFavorite }: BusinessCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <IlustracionComercio categoria={business.category} iniciales={business.initials} />
        <View style={styles.identity}>
          <ThemedText style={styles.name}>{business.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.category}>{business.category}</ThemedText>
          <View style={styles.details}>
            <View style={styles.detail}>
              <SymbolView name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} tintColor={theme.textSecondary} size={13} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.metadata}>A {business.distance}</ThemedText>
            </View>
            <View style={styles.detail} accessibilityLabel={`Calificación: ${business.rating} de 5`} accessible>
              <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={theme.mustard} size={13} />
              <ThemedText type="smallBold" style={styles.metadata}>{business.rating}</ThemedText>
            </View>
            <View style={[
              styles.status,
              { backgroundColor: business.isOpen ? theme.openBackground : theme.closedBackground },
            ]}>
              <View style={[styles.statusDot, { backgroundColor: business.isOpen ? theme.open : theme.closed }]} />
              <ThemedText type="small" themeColor={business.isOpen ? 'open' : 'closed'} style={styles.metadata}>
                {business.isOpen ? 'Abierto' : 'Cerrado'}
              </ThemedText>
            </View>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isFavorite ? 'Quitar de' : 'Agregar a'} favoritos: ${business.name}`}
          accessibilityState={{ selected: isFavorite }}
          onPress={onToggleFavorite}
          style={({ pressed }) => [
            styles.favorite,
            isFavorite && { backgroundColor: theme.terracottaSoft },
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: isFavorite ? 'heart.fill' : 'heart', android: isFavorite ? 'favorite' : 'favorite_border', web: isFavorite ? 'favorite' : 'favorite_border' }}
            tintColor={isFavorite ? theme.favorite : theme.text}
            size={23}
          />
        </Pressable>
      </View>

      {business.promotion && (
        <View style={[styles.promotion, { backgroundColor: theme.promotionBackground, borderColor: theme.mustard }]}>
          <SymbolView name={{ ios: 'tag', android: 'sell', web: 'sell' }} tintColor={theme.favorite} size={16} />
          <ThemedText type="small" themeColor="promotion" style={styles.promotionText}>
            {business.promotion}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 24, padding: 12, gap: 8, boxShadow: '0px 3px 12px rgba(23, 63, 53, 0.05)' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identity: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontSize: 16, lineHeight: 21, fontWeight: '800', letterSpacing: -0.3, paddingRight: 32 },
  category: { fontSize: 12, lineHeight: 18, paddingRight: 32 },
  favorite: { position: 'absolute', right: -4, top: -4, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metadata: { fontSize: 12, lineHeight: 18 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  promotion: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderLeftWidth: 3 },
  promotionText: { flex: 1 },
});
