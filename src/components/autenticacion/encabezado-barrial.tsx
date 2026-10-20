import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';

type Props = { titulo: string; descripcion: string; destacado?: string; compacto?: boolean };

export function EncabezadoBarrial({ titulo, descripcion, destacado, compacto = false }: Props) {
  return (
    <View style={[estilos.encabezado, compacto && estilos.encabezadoCompacto]}>
      {destacado && <ThemedText themeColor="primary" style={estilos.destacado}>{destacado}</ThemedText>}
      <ThemedText accessibilityRole="header" style={Typography.title}>{titulo}</ThemedText>
      <ThemedText themeColor="textSecondaryStrong" style={estilos.descripcion}>{descripcion}</ThemedText>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { paddingTop: 12, gap: 10 },
  encabezadoCompacto: { paddingTop: 8, gap: 6 },
  destacado: { fontSize: 11, lineHeight: 17, letterSpacing: 1.3, fontWeight: '700' },
  descripcion: { fontSize: 14, lineHeight: 21 },
});
