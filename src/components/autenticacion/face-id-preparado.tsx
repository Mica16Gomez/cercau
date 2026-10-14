import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { TarjetaCuenta } from './controles';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

// Es una presentación informativa. Todavía no ejecuta autenticación biométrica.
export function FaceIdPreparado() {
  const tema = useTheme();
  return (
    <TarjetaCuenta>
      <View style={estilos.fila}>
        <View style={[estilos.icono, { backgroundColor: tema.primarySoft }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SymbolView name={{ ios: 'faceid', android: 'face', web: 'face' }} tintColor={tema.primary} size={25} />
        </View>
        <View style={estilos.textos}>
          <ThemedText type="smallBold">Acceso con Face ID</ThemedText>
          <View style={[estilos.etiqueta, { backgroundColor: tema.promotionBackground }]}>
            <ThemedText themeColor="promotion" style={estilos.estado}>Próximamente</ThemedText>
          </View>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">Más adelante vas a poder ingresar con reconocimiento facial.</ThemedText>
    </TarjetaCuenta>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 6 },
  etiqueta: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  estado: { fontSize: 11, lineHeight: 16, fontWeight: '700' },
});
