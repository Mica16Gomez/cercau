import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccesosCuenta, BotonEditarCuenta } from '@/components/autenticacion/accesos-cuenta';
import { ConfirmacionCierre } from '@/components/autenticacion/confirmacion-cierre';
import { BotonCuenta, IndicadorSesion, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { EncabezadoCuenta, SaludoCuenta } from '@/components/autenticacion/encabezado-cuenta';
import { FaceIdPreparado } from '@/components/autenticacion/face-id-preparado';
import { AvatarCuenta, DetalleCuenta, DistintivoRol, PieCuenta } from '@/components/autenticacion/identidad-cuenta';
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
      edges={Platform.OS === 'ios' ? [] : ['top', 'left', 'right']}
      style={[estilos.pantalla, { backgroundColor: tema.background }]}>
      <ScrollView key={usuario?.id ?? 'invitado'} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={estilos.contenido}>
        <EncabezadoCuenta descripcion={usuario ? 'Tu espacio dentro de la comunidad.' : 'Un lugar para vos y para lo local.'} />
        <View style={estilos.cuerpo}>
        {recuperandoSesion ? <TarjetaCuenta><IndicadorSesion /></TarjetaCuenta> : (
          <>
            <MensajeError mensaje={errorRecuperacion} />
            {usuario ? (
              <>
                <TarjetaCuenta style={estilos.tarjetaPerfil}>
                  <View style={estilos.identidad}>
                    <AvatarCuenta nombre={usuario.nombre} />
                    <View style={estilos.presentacion}>
                      <View style={estilos.cabeceraPerfil}>
                        <ThemedText style={estilos.nombre}>{usuario.nombre}</ThemedText>
                        <BotonEditarCuenta deshabilitado={cargando} />
                      </View>
                      <ThemedText selectable type="small" themeColor="textSecondary">{usuario.email}</ThemedText>
                      <DistintivoRol rol={usuario.rol} />
                    </View>
                  </View>
                </TarjetaCuenta>
                <SaludoCuenta nombre={usuario.nombre} />
                <View style={estilos.seccion}>
                  <ThemedText accessibilityRole="header" style={estilos.tituloSeccion}>Tu cuenta</ThemedText>
                  <AccesosCuenta deshabilitado={cargando} />
                </View>
                <BotonCuenta titulo="Cerrar sesión" peligro deshabilitado={cargando}
                  icono={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
                  onPress={() => { setError(null); setConfirmandoSalida(true); }} />
              </>
            ) : (
              <>
                <View style={[estilos.bienvenida, { backgroundColor: tema.primarySoft }]}>
                  <View style={[estilos.iconoBienvenida, { backgroundColor: tema.backgroundElement }]}>
                    <SymbolView name={{ ios: 'person.2', android: 'people', web: 'people' }} tintColor={tema.primary} size={34} />
                  </View>
                  <ThemedText style={estilos.lema} themeColor="primary">Lo local nos une.</ThemedText>
                  <ThemedText themeColor="primary">Creá tu perfil y encontrá tu lugar en la comunidad de Cercau.</ThemedText>
                </View>
                <TarjetaCuenta>
                  <DetalleCuenta titulo="Tu perfil, siempre a mano" descripcion="Reuní tu nombre, correo y tipo de cuenta en un solo lugar." icono={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} />
                  <DetalleCuenta titulo="Una comunidad, dos formas de ser parte" descripcion="Sumate como vecino o con la identidad de tu comercio." icono={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} />
                  <BotonCuenta titulo="Iniciar sesión" deshabilitado={cargando} onPress={() => router.push('/iniciar-sesion')} />
                  <BotonCuenta titulo="Crear una cuenta" secundario deshabilitado={cargando} onPress={() => router.push('/seleccionar-rol')} />
                </TarjetaCuenta>
                <FaceIdPreparado />
                <ThemedText type="small" themeColor="textSecondary" style={estilos.centrado}>También podés seguir explorando Cercau sin una cuenta.</ThemedText>
              </>
            )}
          </>
        )}
        {!usuario && <PieCuenta />}
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
  cuerpo: { paddingHorizontal: 16, paddingBottom: 28, marginTop: -22, gap: 16 },
  tarjetaPerfil: { borderWidth: 0, borderRadius: 26, padding: 16 },
  cabeceraPerfil: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  bienvenida: { borderRadius: 28, padding: 24, gap: 14 },
  iconoBienvenida: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  lema: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  identidad: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presentacion: { flex: 1, gap: 5, minWidth: 0 },
  nombre: { fontSize: 20, lineHeight: 26, fontWeight: '800', letterSpacing: -0.4, flex: 1 },
  seccion: { gap: 12 },
  tituloSeccion: { fontSize: 23, lineHeight: 30, fontWeight: '800' },
  centrado: { textAlign: 'center' },
});
