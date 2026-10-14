import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Alert, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

function mostrarAviso(titulo: string, mensaje: string) {
  // Alert es nativo en el celular; el navegador muestra el mismo aviso con su diálogo.
  if (Platform.OS === 'web') window.alert(`${titulo}\n\n${mensaje}`);
  else Alert.alert(titulo, mensaje, [{ text: 'Entendido' }]);
}

export function BotonEditarCuenta({ deshabilitado }: { deshabilitado: boolean }) {
  const tema = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Editar" accessibilityHint="Muestra información sobre la futura edición del perfil"
      disabled={deshabilitado} accessibilityState={{ disabled: deshabilitado }}
      onPress={() => mostrarAviso('Editar perfil', 'La edición de tus datos estará disponible en una próxima etapa.')}
      style={({ pressed }) => [estilos.editar, { backgroundColor: tema.primarySoft, borderColor: tema.border }, (pressed || deshabilitado) && estilos.presionado]}>
      <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={15} tintColor={tema.primary} />
      <ThemedText type="smallBold" themeColor="primary">Editar</ThemedText>
    </Pressable>
  );
}

export function AccesosCuenta({ deshabilitado }: { deshabilitado: boolean }) {
  return (
    <View style={estilos.grilla}>
      <Acceso titulo="Favoritos" descripcion="Tus comercios preferidos" deshabilitado={deshabilitado}
        icono={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
        onPress={() => mostrarAviso('Favoritos', 'Este acceso reunirá tus comercios favoritos en una próxima etapa.')} />
      <Acceso titulo="Mis reseñas" descripcion="Lo que compartís" tono="terracotta" deshabilitado={deshabilitado}
        icono={{ ios: 'text.bubble', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
        onPress={() => mostrarAviso('Mis reseñas', 'Este acceso reunirá tus reseñas en una próxima etapa.')} />
      <Acceso titulo="Seguridad" descripcion="Acceso y contraseña" tono="mostaza" estado="Próxima etapa" deshabilitado
        icono={{ ios: 'lock.shield', android: 'shield', web: 'shield' }} />
      <Acceso titulo="Face ID" descripcion="Reconocimiento facial" estado="Apagado" interruptor deshabilitado
        icono={{ ios: 'faceid', android: 'face', web: 'face' }} />
    </View>
  );
}

type AccesoProps = {
  titulo: string;
  descripcion: string;
  icono: SymbolViewProps['name'];
  tono?: 'verde' | 'terracotta' | 'mostaza';
  estado?: string;
  interruptor?: boolean;
  deshabilitado?: boolean;
  onPress?: () => void;
};

function Acceso({ titulo, descripcion, icono, tono = 'verde', estado, interruptor = false, deshabilitado, onPress }: AccesoProps) {
  const tema = useTheme();
  const color = tono === 'terracotta' ? tema.favorite : tema.primary;
  const fondo = tono === 'terracotta' ? tema.terracottaSoft : tono === 'mostaza' ? tema.promotionBackground : tema.primarySoft;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titulo} accessibilityHint={estado ? `${descripcion}. ${estado}.` : `${descripcion}. Muestra un aviso informativo.`}
      accessibilityState={{ disabled: deshabilitado }} disabled={deshabilitado} onPress={onPress}
      style={({ pressed }) => [estilos.acceso, { backgroundColor: fondo }, pressed && estilos.presionado]}>
      <View style={estilos.filaIconos}>
        <SymbolView name={icono} tintColor={color} size={33} />
        {interruptor ? (
          <Switch value={false} disabled accessibilityLabel="Face ID apagado" accessibilityHint="Disponible en una próxima etapa"
            trackColor={{ false: tema.border, true: tema.primary }} thumbColor={tema.backgroundElement} ios_backgroundColor={tema.border} />
        ) : (
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={color} size={18} />
        )}
      </View>
      <ThemedText themeColor={tono === 'terracotta' ? 'favorite' : 'primary'} style={estilos.titulo}>{titulo}</ThemedText>
      {estado && <ThemedText type="small" themeColor="textSecondary" style={estilos.estado}>{estado}</ThemedText>}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  editar: { minHeight: 44, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, flexShrink: 0 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  acceso: { flexBasis: '46%', flexGrow: 1, minHeight: 114, borderRadius: 22, padding: 16, gap: 9 },
  filaIconos: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' },
  titulo: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  estado: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  presionado: { opacity: 0.65 },
});
