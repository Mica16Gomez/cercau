import { StyleSheet, View } from 'react-native';

import { BotonEditarCuenta } from './accesos-cuenta';
import { AvatarCuenta, DistintivoRol } from './identidad-cuenta';

import { LogoCercau } from '@/components/logo-cercau';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { Usuario } from '@/tipos/usuario';

export function EncabezadoCuenta() {
  return (
    <View style={estilos.encabezado}>
      <View style={estilos.logo}><LogoCercau /></View>
    </View>
  );
}

export function ProfileHeader({ usuario, deshabilitado }: { usuario: Usuario; deshabilitado: boolean }) {
  const tema = useTheme();
  return (
    <View style={[estilos.perfil, { backgroundColor: tema.forest }]}>
      <View style={estilos.editar}><BotonEditarCuenta deshabilitado={deshabilitado} /></View>
      <View style={estilos.saludo}>
        <AvatarCuenta nombre={usuario.nombre} />
        <View style={estilos.textoSaludo}>
          <ThemedText accessibilityRole="header" themeColor="onForest" style={estilos.tituloSaludo}>¡Hola, {usuario.nombre}!</ThemedText>
          <ThemedText themeColor="onForest" style={estilos.lema}>Tu barrio, siempre cerca.</ThemedText>
          <ThemedText selectable themeColor="onForest" style={estilos.correo}>{usuario.email}</ThemedText>
          <DistintivoRol rol={usuario.rol} compacto />
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  logo: { transform: [{ scale: 0.9 }], transformOrigin: 'left center', alignSelf: 'flex-start' },
  perfil: { borderRadius: 20, paddingHorizontal: 16, paddingBottom: 18, paddingTop: 2, gap: 2 },
  editar: { alignSelf: 'flex-end' },
  saludo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textoSaludo: { flex: 1, minWidth: 0, gap: 4 },
  tituloSaludo: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4 },
  correo: { fontSize: 12, lineHeight: 17, flexShrink: 1 },
  lema: { fontSize: 13, lineHeight: 18 },
});
