import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IndicadorSesion, MensajeError } from './controles';
import { MarcaCercau, PieCuenta } from './identidad-cuenta';

import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';

type Props = PropsWithChildren<{ titulo: string; descripcion: string; destacado?: string; permitirSesion?: boolean }>;

export function PantallaAutenticacion({ titulo, descripcion, destacado, permitirSesion = false, children }: Props) {
  const tema = useTheme();
  const { usuario, recuperandoSesion, cargando, errorRecuperacion } = useAutenticacion();

  // Una pantalla que quedó detrás del registro no debe interrumpir su estado de éxito.
  useFocusEffect(useCallback(() => {
    if (!recuperandoSesion && usuario && !permitirSesion) router.dismissTo('/mi-cuenta');
  }, [recuperandoSesion, usuario, permitirSesion]));

  return (
    <SafeAreaView style={[estilos.pantalla, { backgroundColor: tema.background }]}>
      <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={estilos.contenido}>
          <View style={estilos.barra}>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver" accessibilityHint="Regresa a la pantalla anterior"
              accessibilityState={{ disabled: cargando }} disabled={cargando}
              onPress={() => { if (usuario || !router.canGoBack()) router.dismissTo('/mi-cuenta'); else router.back(); }}
              style={({ pressed }) => [estilos.volver, { borderColor: tema.border, backgroundColor: tema.backgroundElement }, pressed && estilos.presionado]}>
              <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={21} tintColor={tema.primary} />
            </Pressable>
            <MarcaCercau />
          </View>
          <View style={estilos.encabezado}>
            {destacado && <ThemedText themeColor="star" style={estilos.destacado}>{destacado}</ThemedText>}
            <ThemedText accessibilityRole="header" style={estilos.titulo}>{titulo}</ThemedText>
            <ThemedText themeColor="textSecondary">{descripcion}</ThemedText>
          </View>
          {recuperandoSesion || (usuario && !permitirSesion) ? <IndicadorSesion /> : (
            <>
              <MensajeError mensaje={errorRecuperacion} />
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
  contenido: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 28 },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  volver: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  encabezado: { gap: 10, paddingTop: 4 },
  destacado: { fontSize: 11, lineHeight: 18, letterSpacing: 1.4, fontWeight: '700' },
  titulo: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.8 },
  presionado: { opacity: 0.65 },
});
