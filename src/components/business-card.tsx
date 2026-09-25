import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
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
        <View accessible={false} style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <ThemedText style={styles.initials} themeColor="primary">
            {business.initials}
          </ThemedText>
        </View>
        <View style={styles.identity}>
          <ThemedText style={styles.name}>{business.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{business.category}</ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isFavorite ? 'Quitar de' : 'Agregar a'} favoritos: ${business.name}`}
          accessibilityState={{ selected: isFavorite }}
          onPress={onToggleFavorite}
          style={({ pressed }) => [
            styles.favorite,
            isFavorite && { backgroundColor: theme.primarySoft },
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: isFavorite ? 'heart.fill' : 'heart', android: 'favorite', web: 'favorite' }}
            tintColor={isFavorite ? theme.favorite : theme.textSecondary}
            size={23}
          />
        </Pressable>
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <SymbolView name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} tintColor={theme.textSecondary} size={15} />
          <ThemedText type="small" themeColor="textSecondary">A {business.distance}</ThemedText>
        </View>
        <View style={styles.detail} accessibilityLabel={`Calificación: ${business.rating} de 5`} accessible>
          <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={theme.star} size={15} />
          <ThemedText type="smallBold">{business.rating}</ThemedText>
        </View>
        <View style={[
          styles.status,
          { backgroundColor: business.isOpen ? theme.openBackground : theme.closedBackground },
        ]}>
          <View style={[styles.statusDot, { backgroundColor: business.isOpen ? theme.open : theme.closed }]} />
          <ThemedText type="small" themeColor={business.isOpen ? 'open' : 'closed'}>
            {business.isOpen ? 'Abierto' : 'Cerrado'}
          </ThemedText>
        </View>
      </View>

      {business.promotion && (
        <View style={[styles.promotion, { backgroundColor: theme.promotionBackground }]}>
          <SymbolView name={{ ios: 'tag', android: 'sell', web: 'sell' }} tintColor={theme.promotion} size={16} />
          <ThemedText type="small" themeColor="promotion" style={styles.promotionText}>
            {business.promotion}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 18, fontWeight: '700' },
  identity: { flex: 1, gap: 4 },
  name: { fontSize: 17, lineHeight: 23, fontWeight: '700' },
  favorite: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  promotion: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  promotionText: { flex: 1 },
});
