import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonCuenta, IndicadorSesion, MensajeError, TarjetaCuenta } from '@/components/autenticacion/controles';
import { ConfirmacionCierre } from '@/components/autenticacion/confirmacion-cierre';
import { AvatarCuenta, DetalleCuenta, DistintivoRol, MarcaCercau, PieCuenta } from '@/components/autenticacion/identidad-cuenta';
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
        <MarcaCercau />
        <View style={estilos.encabezado}>
          <ThemedText accessibilityRole="header" style={estilos.titulo}>Mi cuenta</ThemedText>
          <ThemedText themeColor="textSecondary">{usuario ? 'Tu espacio dentro de la comunidad.' : 'Un lugar para vos y para lo local.'}</ThemedText>
        </View>
        {recuperandoSesion ? <IndicadorSesion /> : (
          <>
            <MensajeError mensaje={errorRecuperacion} />
            {usuario ? (
              <>
                <TarjetaCuenta>
                  <View style={estilos.identidad}>
                    <AvatarCuenta nombre={usuario.nombre} />
                    <View style={estilos.presentacion}>
                      <ThemedText style={estilos.nombre}>{usuario.nombre}</ThemedText>
                      <DistintivoRol rol={usuario.rol} />
                    </View>
                  </View>
                  <ThemedText selectable themeColor="textSecondary">{usuario.email}</ThemedText>
                  <View style={[estilos.notaRol, { backgroundColor: tema.primarySoft }]}>
                    <ThemedText type="small" themeColor="primary">
                      {usuario.rol === 'comercio' ? 'Sos parte del comercio local. Tu cuenta representa a tu comercio dentro de Cercau.' : 'Sos parte del barrio. Tu cuenta te identifica como vecino de la comunidad de Cercau.'}
                    </ThemedText>
                  </View>
                </TarjetaCuenta>
                <View style={estilos.seccion}>
                  <ThemedText accessibilityRole="header" style={estilos.tituloSeccion}>Información del perfil</ThemedText>
                  <TarjetaCuenta>
                    <DatoPerfil etiqueta="Nombre completo" valor={usuario.nombre} />
                    <View style={[estilos.separador, { backgroundColor: tema.border }]} />
                    <DatoPerfil etiqueta="Correo electrónico" valor={usuario.email} />
                    <View style={[estilos.separador, { backgroundColor: tema.border }]} />
                    <DatoPerfil etiqueta="Tipo de cuenta" valor={usuario.rol === 'comercio' ? 'Comercio' : 'Vecino'} />
                  </TarjetaCuenta>
                </View>
                <View style={estilos.seccion}>
                  <ThemedText accessibilityRole="header" style={estilos.tituloSeccion}>Tu cuenta</ThemedText>
                  <TarjetaCuenta>
                    <OpcionProximamente titulo="Editar perfil" descripcion="Tus datos personales" icono={{ ios: 'person.crop.circle', android: 'person_outline', web: 'person_outline' }} />
                    <View style={[estilos.separador, { backgroundColor: tema.border }]} />
                    <OpcionProximamente titulo="Configuración" descripcion="Preferencias de tu cuenta" icono={{ ios: 'gearshape', android: 'settings', web: 'settings' }} />
                  </TarjetaCuenta>
                </View>
                <BotonCuenta titulo="Cerrar sesión" secundario deshabilitado={cargando}
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
                <ThemedText type="small" themeColor="textSecondary" style={estilos.centrado}>También podés seguir explorando Cercau sin una cuenta.</ThemedText>
              </>
            )}
          </>
        )}
        <PieCuenta />
      </ScrollView>
      <ConfirmacionCierre visible={confirmandoSalida} cargando={cargando} error={error}
        onCancelar={() => { setConfirmandoSalida(false); setError(null); }} onConfirmar={salir} />
    </SafeAreaView>
  );
}

function DatoPerfil({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato}>
      <ThemedText type="small" themeColor="textSecondary">{etiqueta}</ThemedText>
      <ThemedText selectable>{valor}</ThemedText>
    </View>
  );
}

function OpcionProximamente({ titulo, descripcion, icono }: { titulo: string; descripcion: string; icono: SymbolViewProps['name'] }) {
  const tema = useTheme();
  return (
    <Pressable disabled accessibilityRole="button" accessibilityLabel={`${titulo}. Próximamente. ${descripcion}`} accessibilityState={{ disabled: true }} style={estilos.opcion}>
      <View style={[estilos.iconoOpcion, { backgroundColor: tema.primarySoft }]}>
        <SymbolView name={icono} size={23} tintColor={tema.primary} />
      </View>
      <View style={estilos.textoOpcion}>
        <View style={estilos.filaOpcion}>
          <ThemedText style={estilos.nombreOpcion}>{titulo}</ThemedText>
          <View style={[estilos.proximamente, { backgroundColor: tema.promotionBackground }]}>
            <ThemedText themeColor="promotion" style={estilos.textoProximamente}>Próximamente</ThemedText>
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">{descripcion}</ThemedText>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 28, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  encabezado: { gap: 8 },
  titulo: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8 },
  bienvenida: { borderRadius: 28, padding: 24, gap: 14 },
  iconoBienvenida: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  lema: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  identidad: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  presentacion: { flex: 1, gap: 10 },
  nombre: { fontSize: 23, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  notaRol: { padding: 16, borderRadius: 18 },
  seccion: { gap: 14 },
  tituloSeccion: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  dato: { gap: 6 },
  separador: { height: StyleSheet.hairlineWidth },
  opcion: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 60 },
  iconoOpcion: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  textoOpcion: { flex: 1, gap: 6 },
  filaOpcion: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  nombreOpcion: { fontWeight: '700' },
  proximamente: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  textoProximamente: { fontSize: 10, lineHeight: 16, fontWeight: '700' },
  centrado: { textAlign: 'center' },
});
