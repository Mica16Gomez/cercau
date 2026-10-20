import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccesosCuenta } from '@/components/autenticacion/accesos-cuenta';
import { ConfirmacionCierre } from '@/components/autenticacion/confirmacion-cierre';
import { IndicadorSesion, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { CuentaInvitado } from '@/components/autenticacion/cuenta-invitado';
import { EncabezadoCuenta, ProfileHeader } from '@/components/autenticacion/encabezado-cuenta';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';
import { obtenerMensajeError } from '@/servicios/errores-autenticacion';

export default function AccountScreen() {
  const tema = useTheme();
  const { usuario, cargando, recuperandoSesion, errorRecuperacion, cerrarSesion } = useAutenticacion();
  const [error, setError] = useState<string | null>(null);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);

  async function salir() {
    if (cargando) return;
    setError(null);
    try {
      await cerrarSesion();
      setConfirmandoSalida(false);
    } catch (error: unknown) {
      setError(obtenerMensajeError(error));
    }
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[estilos.pantalla, { backgroundColor: tema.background }]}>
      <ScrollView key={usuario?.id ?? 'invitado'} contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[estilos.contenido, !usuario && !recuperandoSesion && estilos.contenidoInvitado]}>
        {(usuario || recuperandoSesion) && <EncabezadoCuenta />}
        <View style={[estilos.cuerpo, !usuario && !recuperandoSesion && estilos.cuerpoInvitado]}>
        {recuperandoSesion ? <TarjetaCuenta><IndicadorSesion /></TarjetaCuenta> : (
          <>
            <MensajeError mensaje={errorRecuperacion} />
            {usuario ? (
              <>
                <ProfileHeader usuario={usuario} deshabilitado={cargando} />
                <View style={estilos.seccion}>
                  <AccesosCuenta deshabilitado={cargando} />
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" accessibilityState={{ disabled: cargando }} disabled={cargando}
                  onPress={() => { setError(null); setConfirmandoSalida(true); }}
                  style={({ pressed }) => [estilos.cerrarSesion, { backgroundColor: tema.terracottaSoft }, (pressed || cargando) && estilos.presionado]}>
                  <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} tintColor={tema.actionText} size={19} />
                  <ThemedText themeColor="actionText" style={estilos.textoCerrar}>Cerrar sesión</ThemedText>
                </Pressable>
              </>
            ) : (
              <CuentaInvitado deshabilitado={cargando}
                onIniciarSesion={() => router.push('/iniciar-sesion')}
                onCrearCuenta={() => router.push('/seleccionar-rol')} />
            )}
          </>
        )}
        </View>
      </ScrollView>
      <ConfirmacionCierre visible={confirmandoSalida} cargando={cargando} error={error}
        onCancelar={() => { setConfirmandoSalida(false); setError(null); }} onConfirmar={salir} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flexGrow: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  cuerpo: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  contenidoInvitado: { maxWidth: 560 },
  cuerpoInvitado: { paddingHorizontal: 10, gap: 0 },
  cerrarSesion: { minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  textoCerrar: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  presionado: { opacity: 0.65 },
  seccion: { gap: 12 },
});
