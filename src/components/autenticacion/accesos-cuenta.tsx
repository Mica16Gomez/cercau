import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SectionHeader } from '@/components/interfaz';
import { EnlaceCuenta, MensajeError } from './controles';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useAccionCuenta } from '@/hooks/use-accion-cuenta';
import { useBiometria } from '@/hooks/use-biometria';
import { useTheme } from '@/hooks/use-theme';

export function BotonEditarCuenta({ deshabilitado }: { deshabilitado: boolean }) {
  const tema = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Editar perfil" accessibilityHint="Permite modificar tu nombre"
      disabled={deshabilitado} accessibilityState={{ disabled: deshabilitado }}
      onPress={() => router.push('/editar-perfil')}
      style={({ pressed }) => [estilos.editar, (pressed || deshabilitado) && estilos.presionado]}>
      <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={15} tintColor={tema.onForest} />
      <ThemedText type="small" themeColor="onForest">Editar perfil</ThemedText>
    </Pressable>
  );
}

export function AccesosCuenta({ deshabilitado }: { deshabilitado: boolean }) {
  const tema = useTheme();
  const { usuario, cambiarBiometria } = useAutenticacion();
  const biometria = useBiometria();
  const accion = useAccionCuenta();
  return (
    <View style={estilos.grilla}>
      <SectionHeader titulo="Mi actividad" />
      <View style={[estilos.grupo, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <SettingsRow titulo="Favoritos" descripcion="Tus comercios preferidos" tono="terracotta" deshabilitado={deshabilitado}
        icono={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
        onPress={() => router.push('/favoritos')} />
      <SettingsRow titulo="Mis reseñas" descripcion="Opiniones que compartiste" deshabilitado={deshabilitado}
        icono={{ ios: 'text.bubble', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
        onPress={() => router.push('/mis-resenas')} />
      </View>
      <SectionHeader titulo="Ajustes" />
      <View style={[estilos.grupo, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <SettingsRow titulo="Seguridad" descripcion="Acceso y preferencias" deshabilitado={deshabilitado}
        onPress={() => router.push('/ajustes-cuenta')}
        icono={{ ios: 'lock.shield', android: 'shield', web: 'shield' }} />
      <SettingsRow titulo={biometria.datos?.nombre ?? 'Biometría'} descripcion={biometria.datos?.disponible ? 'Ingreso rápido' : biometria.datos?.mensaje ?? 'Consultando dispositivo…'}
        estado={usuario?.biometriaActiva ? 'Encendido' : 'Apagado'} interruptor valor={usuario?.biometriaActiva ?? false}
        deshabilitado={deshabilitado || biometria.cargando || !biometria.datos?.disponible && !usuario?.biometriaActiva}
        onChange={(activa) => void accion.ejecutar(() => cambiarBiometria(activa), activa ? 'Ingreso biométrico activado.' : 'Ingreso biométrico desactivado.')}
        icono={{ ios: 'faceid', android: 'face', web: 'face' }} />
      </View>
      <MensajeError mensaje={accion.error} />
      {accion.error && <EnlaceCuenta titulo="Reintentar" onPress={accion.reintentar} deshabilitado={deshabilitado} />}
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
  valor?: boolean;
  onChange?: (valor: boolean) => void;
};

export function SettingsRow({ titulo, descripcion, icono, tono = 'verde', estado, interruptor = false, deshabilitado, onPress, valor = false, onChange }: AccesoProps) {
  const tema = useTheme();
  const color = tono === 'terracotta' ? tema.favorite : tema.primary;
  const contenido = <>
        <SymbolView name={icono} tintColor={color} size={25} />
        <View style={estilos.textos}>
          <ThemedText style={estilos.titulo}>{titulo}</ThemedText>
          <ThemedText themeColor="textSecondary" style={estilos.descripcion}>{descripcion}{estado ? ` · ${estado}` : ''}</ThemedText>
        </View>
        {interruptor ? (
          <View style={estilos.interruptor}>
          <Switch value={valor} disabled={deshabilitado} onValueChange={onChange} accessibilityLabel={titulo} accessibilityHint={descripcion}
            accessibilityState={{ disabled: deshabilitado, checked: valor }} hitSlop={8}
            trackColor={{ false: tema.border, true: tema.primary }} thumbColor={tema.backgroundElement} ios_backgroundColor={tema.border} />
          </View>
        ) : (
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={color} size={18} />
        )}
    </>;
  return interruptor ? <View style={[estilos.acceso, { borderColor: tema.border }]}>{contenido}</View> : (
    <Pressable accessibilityRole="button" accessibilityLabel={titulo} accessibilityHint={descripcion}
      accessibilityState={{ disabled: deshabilitado }} disabled={deshabilitado} onPress={onPress}
      style={({ pressed }) => [estilos.acceso, { borderColor: tema.border }, pressed && estilos.presionado]}>{contenido}</Pressable>
  );
}

const estilos = StyleSheet.create({
  editar: { minHeight: 44, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  grilla: { gap: 14 },
  grupo: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  acceso: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, gap: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  textos: { flex: 1, gap: 2 },
  interruptor: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  titulo: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  descripcion: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  presionado: { opacity: 0.65 },
});
