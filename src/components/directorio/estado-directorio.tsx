import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { DatosDirectorio } from '@/tipos/directorio';

export function EstadoDirectorio({
  datos,
  sinConexion = false,
}: {
  datos?: DatosDirectorio;
  sinConexion?: boolean;
}) {
  const tema = useTheme();
  const texto = datos?.aviso ?? (sinConexion ? 'Sin conexión. La búsqueda y las fichas usan el directorio disponible en el dispositivo.' : null);
  if (!texto) return null;
  const actualizado = datos?.fuente === 'cache' && datos.actualizadoEn
    ? `Guardado el ${new Date(datos.actualizadoEn).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}.`
    : null;
  return <View style={[estilos.aviso, { backgroundColor: tema.primarySoft }]}>
    <SymbolView name={{ ios: sinConexion ? 'wifi.slash' : 'clock.arrow.circlepath', android: sinConexion ? 'wifi_off' : 'history', web: sinConexion ? 'wifi_off' : 'history' }}
      size={17} tintColor={tema.primary} />
    <View style={estilos.textos}>
      <ThemedText type="small" themeColor="text">{texto}</ThemedText>
      {actualizado && <ThemedText type="small" themeColor="textSecondary">{actualizado}</ThemedText>}
    </View>
  </View>;
}

const estilos = StyleSheet.create({
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  textos: { flex: 1, gap: 3 },
});
