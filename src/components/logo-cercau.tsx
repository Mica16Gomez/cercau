import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = { variante?: 'claro' | 'verde' };

// Un solo logo para toda la app. La variante cambia el texto según el fondo.
export function LogoCercau({ variante = 'claro' }: Props) {
  const tema = useTheme();
  return (
    <View style={estilos.logo} accessibilityLabel="Cercau, cerca de tu barrio" accessible>
      <ThemedText themeColor={variante === 'verde' ? 'onForest' : 'text'} style={estilos.nombre}
        numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} maxFontSizeMultiplier={1.5}>Cercau</ThemedText>
      <View style={estilos.acentos}>
        <View style={[estilos.petalo, estilos.superior, { backgroundColor: tema.terracotta }]} />
        <View style={[estilos.petalo, estilos.central, { backgroundColor: tema.terracotta }]} />
        <View style={[estilos.petalo, estilos.inferior, { backgroundColor: tema.terracotta }]} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', maxWidth: '100%', flexShrink: 1, gap: 4, paddingRight: 4 },
  nombre: { fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -1.5, flexShrink: 1 },
  acentos: { width: 20, height: 32, flexShrink: 0 },
  petalo: { position: 'absolute', width: 6, height: 12, borderRadius: 4 },
  superior: { top: 0, left: 1, transform: [{ rotate: '20deg' }] },
  central: { top: 11, left: 10, transform: [{ rotate: '55deg' }] },
  inferior: { top: 24, left: 11, height: 8, transform: [{ rotate: '100deg' }] },
});
