import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { RolUsuario } from '@/tipos/usuario';

export function MarcaCercau() {
  const tema = useTheme();
  return (
    <View style={estilos.marca} accessibilityLabel="Cercau, tu guía local" accessible>
      <View style={[estilos.simbolo, { backgroundColor: tema.primarySoft }]}>
        <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} size={23} tintColor={tema.primary} />
      </View>
      <ThemedText themeColor="primary" style={estilos.nombre}>Cercau</ThemedText>
    </View>
  );
}

export function DistintivoRol({ rol }: { rol: RolUsuario }) {
  const tema = useTheme();
  const esComercio = rol === 'comercio';
  return (
    <View style={[estilos.distintivo, { backgroundColor: esComercio ? tema.promotionBackground : tema.primarySoft }]}>
      <SymbolView name={{ ios: esComercio ? 'storefront' : 'person', android: esComercio ? 'storefront' : 'person', web: esComercio ? 'storefront' : 'person' }} size={16} tintColor={esComercio ? tema.promotion : tema.primary} />
      <ThemedText type="smallBold" themeColor={esComercio ? 'promotion' : 'primary'}>{esComercio ? 'Comercio' : 'Vecino'}</ThemedText>
    </View>
  );
}

export function AvatarCuenta({ nombre }: { nombre: string }) {
  const tema = useTheme();
  const partes = nombre.trim().split(/\s+/);
  const iniciales = `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toLocaleUpperCase('es');
  return (
    <View style={[estilos.avatar, { backgroundColor: tema.primarySoft }]} accessibilityLabel={`Iniciales de ${nombre}`} accessible>
      <ThemedText themeColor="primary" style={estilos.iniciales}>{iniciales}</ThemedText>
    </View>
  );
}

export function DetalleCuenta({ icono, titulo, descripcion }: { icono: SymbolViewProps['name']; titulo: string; descripcion: string }) {
  const tema = useTheme();
  return (
    <View style={estilos.detalle}>
      <View style={[estilos.iconoDetalle, { backgroundColor: tema.primarySoft }]}>
        <SymbolView name={icono} size={21} tintColor={tema.primary} />
      </View>
      <View style={estilos.textos}>
        <ThemedText style={estilos.tituloDetalle}>{titulo}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{descripcion}</ThemedText>
      </View>
    </View>
  );
}

export function PieCuenta() {
  const tema = useTheme();
  return (
    <View style={estilos.pie}>
      <View style={[estilos.linea, { backgroundColor: tema.star }]} />
      <ThemedText type="small" themeColor="textSecondary" style={estilos.centrado}>Cerca de vos. Cerca de lo nuestro.</ThemedText>
    </View>
  );
}

const estilos = StyleSheet.create({
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  simbolo: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -1.5 },
  distintivo: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 7 },
  avatar: { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iniciales: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  detalle: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconoDetalle: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 3 },
  tituloDetalle: { fontWeight: '700' },
  pie: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  linea: { width: 28, height: 3, borderRadius: 2 },
  centrado: { textAlign: 'center' },
});
