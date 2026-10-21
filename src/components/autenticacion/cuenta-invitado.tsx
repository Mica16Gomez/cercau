import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { LogoCercau } from '@/components/logo-cercau';
import { PortadaBarrial } from '@/components/portada-barrial';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type Props = { deshabilitado: boolean; onIniciarSesion: () => void; onCrearCuenta: () => void };

export function CuentaInvitado({ deshabilitado, onIniciarSesion, onCrearCuenta }: Props) {
  const tema = useTheme();
  const oscuro = useColorScheme() === 'dark';
  const colorAlternativo = oscuro ? tema.text : '#15234B';
  const colorNota = oscuro ? tema.textSecondary : '#69758D';

  return (
    <View style={estilos.contenido}>
      <View style={estilos.encabezado}><View style={estilos.logo}><LogoCercau /></View></View>
      <PortadaBarrial tipo="cuenta" />
      <View style={[estilos.tarjeta, { backgroundColor: tema.backgroundElement }]}>
        <ThemedText accessibilityRole="header" themeColor="primary" style={[estilos.titulo, !oscuro && estilos.tituloClaro]}>Ingresá a tu cuenta</ThemedText>
        <View style={estilos.acciones}>
          <Pressable accessibilityRole="button" accessibilityLabel="Iniciar sesión" accessibilityState={{ disabled: deshabilitado }}
            disabled={deshabilitado} onPress={onIniciarSesion}
            style={({ pressed }) => [estilos.boton, estilos.botonPrincipal, (pressed || deshabilitado) && estilos.presionado]}>
            <ThemedText style={[estilos.textoBoton, estilos.textoPrincipal]}>Iniciar sesión</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Crear una cuenta" accessibilityState={{ disabled: deshabilitado }}
            disabled={deshabilitado} onPress={onCrearCuenta}
            style={({ pressed }) => [estilos.boton, { borderColor: colorAlternativo }, (pressed || deshabilitado) && estilos.presionado]}>
            <ThemedText style={[estilos.textoBoton, { color: colorAlternativo }]}>Crear una cuenta</ThemedText>
          </Pressable>
        </View>
        <View style={estilos.seguridad}>
          <SymbolView name={{ ios: 'lock.shield', android: 'shield_lock', web: 'shield_lock' }} size={24} tintColor={colorNota} />
          <ThemedText style={[estilos.nota, { color: colorNota }]}>Tus datos están protegidos.</ThemedText>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: 14 },
  encabezado: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  logo: { alignSelf: 'flex-start', transform: [{ scale: 1.14 }], transformOrigin: 'left top' },
  tarjeta: { marginHorizontal: 6, borderRadius: 24, paddingHorizontal: 14, paddingTop: 28, paddingBottom: 24, boxShadow: '0px 8px 24px rgba(38,58,50,0.07)' },
  titulo: { fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8, marginHorizontal: 8, marginBottom: 22 },
  tituloClaro: { color: '#084D35' },
  acciones: { gap: 10 },
  boton: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  botonPrincipal: { backgroundColor: '#DE7537', borderColor: '#DE7537' },
  textoBoton: { fontSize: 18, lineHeight: 26, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  textoPrincipal: { color: '#FFFFFF', fontSize: 20 },
  seguridad: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nota: { fontSize: 13, lineHeight: 20, flexShrink: 1 },
  presionado: { opacity: 0.65 },
});
