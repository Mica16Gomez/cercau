import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { BotonCuenta, TarjetaCuenta } from '@/components/autenticacion/controles';
import { DistintivoRol } from '@/components/autenticacion/identidad-cuenta';
import { PantallaAutenticacion } from '@/components/autenticacion/pantalla-autenticacion';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';

// Conserva la confirmación visual original; el formulario ya salió del historial.
export default function CuentaCreadaScreen() {
  const { usuario } = useAutenticacion();
  const tema = useTheme();
  if (!usuario) return null;
  return <PantallaAutenticacion titulo="Ya sos parte de Cercau" destacado="BIENVENIDO A LA COMUNIDAD" descripcion="Tu cuenta se creó correctamente." permitirSesion>
    <TarjetaCuenta>
      <View style={[estilos.exito, { backgroundColor: tema.primarySoft }]}>
        <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={38} tintColor={tema.primary} />
      </View>
      <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" style={estilos.saludo}>¡Qué bueno tenerte, {usuario.nombre}!</ThemedText>
      <DistintivoRol rol={usuario.rol} />
      <ThemedText themeColor="textSecondary">Tu perfil está listo. Encontrá tus datos y la información de tu cuenta en Mi cuenta.</ThemedText>
      <BotonCuenta titulo="Ir a Mi cuenta" onPress={() => router.replace('/mi-cuenta')} />
    </TarjetaCuenta>
  </PantallaAutenticacion>;
}
const estilos = StyleSheet.create({
  exito: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  saludo: { fontSize: 23, lineHeight: 31, fontWeight: '700' },
});
