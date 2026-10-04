import { SymbolView } from 'expo-symbols';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonCuenta, MensajeError } from './controles';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Props = { visible: boolean; cargando: boolean; error: string | null; onCancelar: () => void; onConfirmar: () => void };

export function ConfirmacionCierre({ visible, cargando, error, onCancelar, onConfirmar }: Props) {
  const tema = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => { if (!cargando) onCancelar(); }}>
      <SafeAreaView style={estilos.fondo}>
        <ScrollView style={estilos.scroll} contentContainerStyle={estilos.contenido}>
        <View accessibilityViewIsModal role="dialog" accessibilityLabel="Confirmar cierre de sesión"
          style={[estilos.tarjeta, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
          <View style={[estilos.icono, { backgroundColor: tema.primarySoft }]}>
            <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} size={28} tintColor={tema.primary} />
          </View>
          <ThemedText accessibilityRole="header" style={estilos.titulo}>¿Cerrar sesión?</ThemedText>
          <ThemedText themeColor="textSecondary">Podés seguir explorando los comercios de tu barrio y volver a ingresar cuando quieras.</ThemedText>
          <MensajeError mensaje={error} />
          <BotonCuenta titulo={cargando ? 'Cerrando sesión…' : 'Sí, cerrar sesión'} cargando={cargando} onPress={onConfirmar} />
          <BotonCuenta titulo="Seguir en mi cuenta" secundario deshabilitado={cargando} onPress={onCancelar} />
        </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#14201B99', padding: 20, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, width: '100%', maxWidth: 420 },
  contenido: { flexGrow: 1, justifyContent: 'center', paddingVertical: 12 },
  tarjeta: { width: '100%', maxWidth: 420, borderRadius: 28, borderWidth: 1, padding: 24, gap: 20 },
  icono: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
});
