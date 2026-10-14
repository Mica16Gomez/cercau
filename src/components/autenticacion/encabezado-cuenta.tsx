import { StyleSheet, View } from 'react-native';

import { BarrioIlustrado } from './barrio-ilustrado';

import { LogoCercau } from '@/components/logo-cercau';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function EncabezadoCuenta({ descripcion }: { descripcion: string }) {
  const tema = useTheme();
  return (
    <View style={[estilos.encabezado, { backgroundColor: tema.forest }]}>
      <View style={[estilos.curva, { backgroundColor: tema.sage }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <LogoCercau variante="verde" />
      <View style={estilos.textos}>
        <ThemedText accessibilityRole="header" themeColor="onForest" style={estilos.titulo}>Mi cuenta</ThemedText>
        <ThemedText themeColor="onForest" style={estilos.descripcion}>{descripcion}</ThemedText>
      </View>
      <View style={estilos.ilustracion}><BarrioIlustrado /></View>
    </View>
  );
}

export function SaludoCuenta({ nombre }: { nombre: string }) {
  const tema = useTheme();
  return (
    <View style={[estilos.saludo, { backgroundColor: tema.promotionBackground }]}>
      <View style={estilos.textoSaludo}>
        <ThemedText accessibilityRole="header" themeColor="primary" style={estilos.tituloSaludo}>¡Hola, {nombre}!</ThemedText>
        <ThemedText themeColor="primary" style={estilos.lema}>Tu barrio, siempre cerca.</ThemedText>
      </View>
      <BarrioIlustrado compacto />
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { minHeight: 236, padding: 20, paddingBottom: 44, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  curva: { position: 'absolute', top: -60, right: -32, width: 176, height: 151, borderRadius: 76, opacity: 0.18, transform: [{ rotate: '-18deg' }] },
  textos: { marginTop: 20, gap: 8, width: '65%', zIndex: 1 },
  titulo: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  descripcion: { fontSize: 15, lineHeight: 22, opacity: 0.85 },
  ilustracion: { position: 'absolute', right: 0, bottom: 0, width: '35%', overflow: 'hidden' },
  saludo: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 16, paddingRight: 4, gap: 4, overflow: 'hidden' },
  textoSaludo: { flex: 1, gap: 6 },
  tituloSaludo: { fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.6 },
  lema: { fontSize: 15, lineHeight: 21 },
});
