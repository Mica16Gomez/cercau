import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IlustracionComercio } from '@/components/ilustracion-comercio';
import { businessImages, type Business } from '@/data/search-businesses';
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
      <View style={styles.photoContainer}>
        {businessImages[business.id] ? <Image source={businessImages[business.id]} style={styles.photo} contentFit="cover" accessibilityLabel={`Fotografía ilustrativa de ${business.category.toLowerCase()}`} /> :
          <IlustracionComercio categoria={business.category} iniciales={business.initials} />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isFavorite ? 'Quitar de' : 'Agregar a'} favoritos: ${business.name}`}
          accessibilityState={{ selected: isFavorite }}
          onPress={onToggleFavorite}
          style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}>
          <View style={styles.favoriteIcon}>
            <SymbolView name={{ ios: isFavorite ? 'heart.fill' : 'heart', android: isFavorite ? 'favorite' : 'favorite_border', web: isFavorite ? 'favorite' : 'favorite_border' }}
              tintColor={isFavorite ? theme.action : theme.onForest} size={24} />
          </View>
        </Pressable>
      </View>
      <View style={styles.heading}>
        <View style={styles.identity}>
          <ThemedText style={styles.name}>{business.name}</ThemedText>
          <View style={styles.details}>
            <View style={styles.detail} accessibilityLabel={`Calificación: ${business.rating} de 5`} accessible>
              <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={theme.star} size={13} />
              <ThemedText type="smallBold" style={styles.metadata}>{business.rating}</ThemedText>
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.category}>{business.category} · {business.distance}</ThemedText>
            <View style={[
              styles.status,
              { backgroundColor: business.isOpen ? theme.openBackground : theme.closedBackground },
            ]}>
              <ThemedText type="small" themeColor={business.isOpen ? 'open' : 'closed'} style={styles.metadata}>
                {business.isOpen ? 'Abierto ahora' : 'Cerrado'}
              </ThemedText>
            </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderWidth: 1, borderRadius: 12, overflow: 'hidden', gap: 8 },
  photoContainer: { position: 'relative', backgroundColor: '#DDE8DF' },
  photo: { width: '100%', height: 104 },
  heading: { paddingHorizontal: 9, paddingBottom: 10 },
  identity: { gap: 5, minWidth: 0 },
  name: { minHeight: 36, fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: -0.2 },
  category: { fontSize: 11, lineHeight: 16 },
  favorite: { position: 'absolute', right: 0, top: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  favoriteIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metadata: { fontSize: 11, lineHeight: 16 },
  status: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
});
