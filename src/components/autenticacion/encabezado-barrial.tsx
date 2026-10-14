import { StyleSheet, View } from 'react-native';

import { BarrioIlustrado } from './barrio-ilustrado';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = { titulo: string; descripcion: string; destacado?: string; compacto?: boolean };

export function EncabezadoBarrial({ titulo, descripcion, destacado, compacto = false }: Props) {
  const tema = useTheme();
  return (
    <View style={[estilos.encabezado, compacto && estilos.encabezadoCompacto, { backgroundColor: tema.forest }]}>
      {destacado && <ThemedText themeColor="mustard" style={estilos.destacado}>{destacado}</ThemedText>}
      <ThemedText accessibilityRole="header" themeColor="onForest" style={[estilos.titulo, compacto && estilos.tituloCompacto]}>{titulo}</ThemedText>
      <ThemedText themeColor="onForest" style={estilos.descripcion}>{descripcion}</ThemedText>
      <BarrioIlustrado variante="login" compacto={compacto} />
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { borderRadius: 28, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 12, gap: 10, overflow: 'hidden' },
  encabezadoCompacto: { borderRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8, gap: 6 },
  destacado: { fontSize: 11, lineHeight: 17, letterSpacing: 1.3, fontWeight: '700' },
  titulo: { fontSize: 29, lineHeight: 35, fontWeight: '700', letterSpacing: -0.8 },
  tituloCompacto: { fontSize: 26, lineHeight: 31, fontWeight: '800' },
  descripcion: { fontSize: 14, lineHeight: 21, opacity: 0.9 },
});
