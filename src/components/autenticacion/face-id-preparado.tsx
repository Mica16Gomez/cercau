import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Es una presentación informativa. Todavía no ejecuta autenticación biométrica.
export function FaceIdPreparado({ variante = 'informacion' }: { variante?: 'informacion' | 'login' }) {
  const tema = useTheme();

  // Login tiene una presentación propia; Mi cuenta conserva su versión informativa.
  if (variante === 'login') {
    return (
      <View style={[estilos.ingresoRapido, { backgroundColor: tema.primarySoft }]}>
        <View style={[estilos.iconoRapido, { backgroundColor: tema.forest }]}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SymbolView name={{ ios: 'faceid', android: 'face', web: 'face' }} tintColor={tema.onForest} size={24} />
        </View>
        <View style={estilos.textosRapidos}>
          <View style={estilos.encabezadoRapido}>
            <ThemedText style={estilos.tituloRapido}>Ingreso rápido</ThemedText>
            <View style={[estilos.estadoRapido, { borderColor: tema.primary }]}>
              <ThemedText themeColor="primary" style={estilos.estado}>Próximamente</ThemedText>
            </View>
          </View>
          <ThemedText themeColor="primary" style={estilos.descripcionRapida}>
            Usá el reconocimiento facial para ingresar sin contraseña
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[estilos.informacion, { borderColor: tema.border }]}>
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
      <ThemedText type="small" themeColor="textSecondaryStrong">Más adelante vas a poder ingresar con reconocimiento facial.</ThemedText>
    </View>
  );
}

const estilos = StyleSheet.create({
  ingresoRapido: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderRadius: Radii.card },
  iconoRapido: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textosRapidos: { flex: 1, minWidth: 0, gap: 6 },
  encabezadoRapido: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  tituloRapido: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  estadoRapido: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  descripcionRapida: { fontSize: 13, lineHeight: 20 },
  informacion: { borderTopWidth: 1, paddingTop: 18, gap: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 6 },
  etiqueta: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  estado: { fontSize: 11, lineHeight: 16, fontWeight: '700' },
});
