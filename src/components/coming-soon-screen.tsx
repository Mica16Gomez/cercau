import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PromotionBadge, ScreenHeader } from '@/components/interfaz';
import { MaxContentWidth, Typography } from '@/constants/theme';
import { businesses } from '@/data/businesses';
import { businessImages } from '@/data/business-images';
import { useTheme } from '@/hooks/use-theme';

type ComingSoonScreenProps = {
  title: string;
  icon: SymbolViewProps['name'];
};

export function ComingSoonScreen({ title, icon }: ComingSoonScreenProps) {
  const theme = useTheme();
  const esMapa = title === 'Mapa';
  const promociones = businesses.filter((business) => business.promotion);

  return (
    // En iPhone, NativeTabs ajusta los márgenes del ScrollView automáticamente.
    <SafeAreaView edges={Platform.OS === 'ios' ? [] : ['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <ScreenHeader titulo={title} descripcion={esMapa ? 'El barrio, a un vistazo.' : 'Lo bueno de comprar cerca.'} />
        {esMapa ? <View style={[styles.map, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
          <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.block, styles.blockOne, { backgroundColor: theme.backgroundElement }]} />
            <View style={[styles.block, styles.blockTwo, { backgroundColor: theme.backgroundElement }]} />
            <View style={[styles.block, styles.blockThree, { backgroundColor: theme.backgroundElement }]} />
            <View style={[styles.park, { backgroundColor: theme.primary }]} />
            <View style={[styles.road, { backgroundColor: theme.background }]} />
            <View style={[styles.crossRoad, { backgroundColor: theme.background }]} />
            <View style={[styles.smallRoad, { backgroundColor: theme.background }]} />
            <View style={[styles.pin, styles.pinOne, { backgroundColor: theme.forest }]}><SymbolView name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} size={20} tintColor={theme.onForest} /></View>
            <View style={[styles.pin, styles.pinTwo, { backgroundColor: theme.action }]}><SymbolView name={{ ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' }} size={20} tintColor={theme.onAction} /></View>
            <View style={[styles.pin, styles.pinThree, { backgroundColor: theme.forest }]}><SymbolView name={{ ios: 'cross.case', android: 'local_pharmacy', web: 'local_pharmacy' }} size={20} tintColor={theme.onForest} /></View>
          </View>
          <View style={[styles.mapLabel, { backgroundColor: theme.backgroundElement }]}>
            <SymbolView name={icon} size={18} tintColor={theme.primary} />
            <ThemedText type="smallBold">Vista previa del mapa</ThemedText>
          </View>
          <View style={[styles.mapNotice, { backgroundColor: theme.backgroundElement }]}>
            <PromotionBadge texto="Próximamente" />
            <ThemedText style={Typography.section}>Tu próxima parada, cerca</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Estamos preparando este espacio para explorar el barrio. Por ahora podés encontrar los comercios en Buscar.</ThemedText>
          </View>
        </View> : <>
          <View style={styles.previewHeading}><PromotionBadge texto="Próximamente" /><ThemedText type="small" themeColor="textSecondaryStrong">Un adelanto de lo que viene</ThemedText></View>
          {promociones.map((business, index) => <View key={business.id} style={[index === 0 ? styles.featured : styles.promotionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Image source={businessImages[business.id]} contentFit="cover" style={index === 0 ? styles.featuredPhoto : styles.rowPhoto}
              accessibilityLabel={`Fotografía ilustrativa de ${business.category.toLowerCase()}`} />
            <View style={styles.promotionText}>
              <ThemedText themeColor="primary" type="smallBold">{business.name}</ThemedText>
              <ThemedText style={index === 0 ? styles.benefit : styles.secondaryBenefit}>{business.promotion}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{business.category} · A {business.distance}</ThemedText>
            </View>
          </View>)}
          <View style={[styles.note, { borderColor: theme.border }]}>
            <SymbolView name={icon} size={23} tintColor={theme.actionText} />
            <ThemedText type="small" themeColor="textSecondaryStrong" style={styles.noteText}>Las promociones son ejemplos del directorio. Esta sección estará disponible en una próxima etapa.</ThemedText>
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 32, gap: 24, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  previewHeading: { gap: 10 },
  featured: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  featuredPhoto: { width: '100%', height: 190 },
  promotionText: { padding: 16, gap: 8, flex: 1 },
  benefit: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6 },
  secondaryBenefit: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
  promotionRow: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  rowPhoto: { width: '28%', minHeight: 142 },
  note: { borderTopWidth: 1, paddingTop: 20, flexDirection: 'row', gap: 12 },
  noteText: { flex: 1 },
  map: { minHeight: 450, flex: 1, borderRadius: 24, borderWidth: 1, overflow: 'hidden', padding: 16, justifyContent: 'space-between', gap: 220 },
  mapLabel: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, alignSelf: 'flex-start' },
  mapNotice: { borderRadius: 20, padding: 16, gap: 12 },
  block: { position: 'absolute', width: '32%', height: 120, borderRadius: 20, opacity: 0.65 },
  blockOne: { left: 16, top: 85 },
  blockTwo: { right: 20, top: 30 },
  blockThree: { right: 5, top: 215 },
  park: { position: 'absolute', width: 105, height: 130, borderRadius: 48, opacity: 0.18, top: 200, left: 20 },
  road: { position: 'absolute', width: 35, height: '130%', left: '47%', top: '-10%', transform: [{ rotate: '21deg' }] },
  crossRoad: { position: 'absolute', height: 27, width: '140%', left: '-20%', top: 175, transform: [{ rotate: '-15deg' }] },
  smallRoad: { position: 'absolute', height: 16, width: '140%', left: '-20%', top: 320, transform: [{ rotate: '10deg' }] },
  pin: { width: 44, height: 44, borderRadius: 22, borderBottomLeftRadius: 5, position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pinOne: { top: 110, left: '20%' },
  pinTwo: { top: 205, right: '23%' },
  pinThree: { top: 285, left: '23%' },
});
