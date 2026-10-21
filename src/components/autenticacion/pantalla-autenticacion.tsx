import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IndicadorSesion, MensajeError } from './controles';
import { EncabezadoBarrial } from './encabezado-barrial';
import { PieCuenta } from './identidad-cuenta';

import { LogoCercau } from '@/components/logo-cercau';
import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';

type Props = PropsWithChildren<{ titulo: string; descripcion: string; destacado?: string; permitirSesion?: boolean; compacto?: boolean; paso?: 1 | 2 }>;

export function PantallaAutenticacion({ titulo, descripcion, destacado, permitirSesion = false, compacto = false, paso, children }: Props) {
  const tema = useTheme();
  const { usuario, recuperandoSesion, cargando, errorRecuperacion, reintentarRecuperacion } = useAutenticacion();

  // Una pantalla que quedó detrás del registro no debe interrumpir su estado de éxito.
  useFocusEffect(useCallback(() => {
    if (!recuperandoSesion && usuario && !permitirSesion) router.replace('/mi-cuenta');
  }, [recuperandoSesion, usuario, permitirSesion]));

  return (
    <SafeAreaView style={[estilos.pantalla, { backgroundColor: tema.background }]}>
      <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[estilos.contenido, compacto && estilos.contenidoCompacto]}>
          <View style={estilos.barra}>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver" accessibilityHint="Regresa a la pantalla anterior"
              accessibilityState={{ disabled: cargando }} disabled={cargando}
              onPress={() => { if (usuario || !router.canGoBack()) router.dismissTo('/mi-cuenta'); else router.back(); }}
              style={({ pressed }) => [estilos.volver, { borderColor: tema.border, backgroundColor: tema.backgroundElement }, pressed && estilos.presionado]}>
              <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor={tema.primary} />
            </Pressable>
            <View style={[estilos.marca, compacto && estilos.marcaCompacta]}><LogoCercau /></View>
            <View style={estilos.equilibrio} />
          </View>
          <ThemedText themeColor="textSecondaryStrong" style={estilos.lema}>Tu barrio, siempre cerca</ThemedText>
          {paso && <View accessibilityLabel={`Paso ${paso} de 2`} accessible style={estilos.progreso}>
            {[1, 2].map((numero) => <View key={numero} style={[estilos.tramo, { backgroundColor: numero <= paso ? tema.primary : tema.border }]} />)}
          </View>}
          <EncabezadoBarrial titulo={titulo} descripcion={descripcion} destacado={destacado} compacto={compacto} />
          {recuperandoSesion || (usuario && !permitirSesion) ? <IndicadorSesion /> : (
            <>
              <MensajeError mensaje={errorRecuperacion} />
              {errorRecuperacion && <Pressable accessibilityRole="button" accessibilityLabel="Reintentar recuperación" onPress={reintentarRecuperacion} style={estilos.volverRecuperacion}>
                <ThemedText themeColor="actionText">Reintentar recuperación</ThemedText>
              </Pressable>}
              {children}
            </>
          )}
          <PieCuenta />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 20 },
  contenidoCompacto: { paddingTop: 12, gap: 16 },
  marca: { flexShrink: 1, alignItems: 'center' },
  marcaCompacta: { transform: [{ scale: 0.9 }] },
  equilibrio: { width: 44 },
  lema: { textAlign: 'center', marginTop: -8, fontSize: 15 },
  progreso: { flexDirection: 'row', gap: 8 },
  tramo: { flex: 1, height: 4, borderRadius: 2 },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  volver: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  presionado: { opacity: 0.65 },
  volverRecuperacion: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
