import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { PortadaBarrial } from '@/components/portada-barrial';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function EncabezadoBuscar() {
  return <PortadaBarrial tipo="buscar" />;
}

export function EncabezadoComercios({ cantidad, onVerTodos }: { cantidad: number; onVerTodos: () => void }) {
  const tema = useTheme();
  return (
    <View style={estilos.encabezadoComercios}>
      <View style={estilos.tituloComercios}>
        <ThemedText
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Destacados cerca de vos. ${cantidad} comercios encontrados`}
          style={estilos.cercaDeVos}>
          Destacados cerca de vos
        </ThemedText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Ver todos" accessibilityHint="Muestra todos los comercios y limpia los filtros."
        onPress={onVerTodos} style={({ pressed }) => [estilos.verTodos, pressed && estilos.presionado]}>
        <ThemedText themeColor="actionText" style={estilos.textoVerTodos}>Ver todos</ThemedText>
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={tema.actionText} size={16} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezadoComercios: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tituloComercios: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  cercaDeVos: { fontSize: 18, lineHeight: 23, fontWeight: '700', letterSpacing: -0.5, flexShrink: 1 },
  verTodos: { minHeight: 44, minWidth: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingLeft: 4 },
  textoVerTodos: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  presionado: { opacity: 0.65 },
});
