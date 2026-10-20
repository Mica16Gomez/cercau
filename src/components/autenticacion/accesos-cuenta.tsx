import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Alert, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SectionHeader } from '@/components/interfaz';
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
      style={({ pressed }) => [estilos.editar, (pressed || deshabilitado) && estilos.presionado]}>
      <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={15} tintColor={tema.onForest} />
      <ThemedText type="small" themeColor="onForest">Editar perfil</ThemedText>
    </Pressable>
  );
}

export function AccesosCuenta({ deshabilitado }: { deshabilitado: boolean }) {
  const tema = useTheme();
  return (
    <View style={estilos.grilla}>
      <SectionHeader titulo="Mi actividad" />
      <View style={[estilos.grupo, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <SettingsRow titulo="Favoritos" descripcion="Tus comercios preferidos" tono="terracotta" deshabilitado={deshabilitado}
        icono={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
        onPress={() => mostrarAviso('Favoritos', 'Este acceso reunirá tus comercios favoritos en una próxima etapa.')} />
      <SettingsRow titulo="Mis reseñas" descripcion="Opiniones que compartiste" deshabilitado={deshabilitado}
        icono={{ ios: 'text.bubble', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
        onPress={() => mostrarAviso('Mis reseñas', 'Este acceso reunirá tus reseñas en una próxima etapa.')} />
      </View>
      <SectionHeader titulo="Ajustes" />
      <View style={[estilos.grupo, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <SettingsRow titulo="Seguridad" descripcion="Acceso y contraseña" estado="Próxima etapa" deshabilitado
        icono={{ ios: 'lock.shield', android: 'shield', web: 'shield' }} />
      <SettingsRow titulo="Face ID" descripcion="Reconocimiento facial" estado="Apagado" interruptor deshabilitado
        icono={{ ios: 'faceid', android: 'face', web: 'face' }} />
      </View>
    </View>
  );
}

type AccesoProps = {
  titulo: string;
  descripcion: string;
  icono: SymbolViewProps['name'];
  tono?: 'verde' | 'terracotta';
  estado?: string;
  interruptor?: boolean;
  deshabilitado?: boolean;
  onPress?: () => void;
};

export function SettingsRow({ titulo, descripcion, icono, tono = 'verde', estado, interruptor = false, deshabilitado, onPress }: AccesoProps) {
  const tema = useTheme();
  const color = tono === 'terracotta' ? tema.favorite : tema.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titulo} accessibilityHint={estado ? `${descripcion}. ${estado}.` : `${descripcion}. Muestra un aviso informativo.`}
      accessibilityState={{ disabled: deshabilitado }} disabled={deshabilitado} onPress={onPress}
      style={({ pressed }) => [estilos.acceso, { borderColor: tema.border }, pressed && estilos.presionado]}>
        <SymbolView name={icono} tintColor={color} size={25} />
        <View style={estilos.textos}>
          <ThemedText style={estilos.titulo}>{titulo}</ThemedText>
          <ThemedText themeColor="textSecondary" style={estilos.descripcion}>{descripcion}{estado ? ` · ${estado}` : ''}</ThemedText>
        </View>
        {interruptor ? (
          <Switch value={false} disabled accessibilityLabel="Face ID apagado" accessibilityHint="Disponible en una próxima etapa"
            trackColor={{ false: tema.border, true: tema.primary }} thumbColor={tema.backgroundElement} ios_backgroundColor={tema.border} />
        ) : (
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={color} size={18} />
        )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  editar: { minHeight: 44, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  grilla: { gap: 14 },
  grupo: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  acceso: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, gap: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  descripcion: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  presionado: { opacity: 0.65 },
});
