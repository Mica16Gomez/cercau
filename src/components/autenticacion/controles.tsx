import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useId, useState, type PropsWithChildren, type Ref } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type BotonProps = {
  titulo: string;
  onPress: () => void;
  secundario?: boolean;
  peligro?: boolean;
  deshabilitado?: boolean;
  cargando?: boolean;
  icono?: SymbolViewProps['name'];
};

export function BotonCuenta({ titulo, onPress, secundario = false, peligro = false, deshabilitado = false, cargando = false, icono }: BotonProps) {
  const tema = useTheme();
  const bloqueado = deshabilitado || cargando;
  const colorTexto = peligro ? 'favorite' : secundario ? 'primary' : 'onForest';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: bloqueado, busy: cargando }}
      disabled={bloqueado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        {
          backgroundColor: peligro ? tema.terracottaSoft : secundario ? tema.backgroundElement : tema.buttonBackground,
          borderColor: peligro ? tema.terracotta : secundario ? tema.border : tema.buttonBackground,
        },
        (pressed || bloqueado) && estilos.atenuado,
      ]}>
      {cargando && <ActivityIndicator color={tema[colorTexto]} />}
      {!cargando && icono && <SymbolView name={icono} tintColor={tema[colorTexto]} size={20} />}
      <ThemedText themeColor={colorTexto} style={estilos.textoBoton}>
        {titulo}
      </ThemedText>
    </Pressable>
  );
}

type CampoProps = TextInputProps & {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  esContrasena?: boolean;
  icono?: SymbolViewProps['name'];
  ref?: Ref<TextInput>;
};

export function CampoCuenta({ etiqueta, error, ayuda, esContrasena = false, icono, ref, style, onFocus, onBlur, ...props }: CampoProps) {
  const tema = useTheme();
  const identificador = useId();
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View style={estilos.campo}>
      <ThemedText nativeID={`${identificador}-etiqueta`} type="smallBold">{etiqueta}</ThemedText>
      <View style={[estilos.contenedorEntrada, {
        backgroundColor: enfocado ? tema.backgroundElement : tema.background,
        borderColor: error ? tema.favorite : enfocado ? tema.primary : tema.border,
      }]}>
        {icono && <SymbolView name={icono} size={20} tintColor={enfocado ? tema.primary : tema.textSecondary} />}
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={etiqueta}
          accessibilityHint={error ?? ayuda}
          accessibilityLabelledBy={`${identificador}-etiqueta`}
          placeholderTextColor={tema.textSecondary}
          selectionColor={tema.primary}
          secureTextEntry={esContrasena ? !visible : props.secureTextEntry}
          style={[estilos.entrada, { color: tema.text }, style]}
          onFocus={(evento) => { setEnfocado(true); onFocus?.(evento); }}
          onBlur={(evento) => { setEnfocado(false); onBlur?.(evento); }}
        />
        {esContrasena && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${etiqueta.toLowerCase()}`}
            accessibilityState={{ disabled: props.editable === false }}
            disabled={props.editable === false}
            onPress={() => setVisible((valor) => !valor)}
            style={({ pressed }) => [estilos.verContrasena, pressed && estilos.atenuado]}>
            <SymbolView name={{ ios: visible ? 'eye.slash' : 'eye', android: visible ? 'visibility_off' : 'visibility', web: visible ? 'visibility_off' : 'visibility' }} tintColor={tema.primary} size={21} />
          </Pressable>
        )}
      </View>
      {error ? (
        <ThemedText accessibilityLiveRegion="polite" themeColor="favorite" type="small">{error}</ThemedText>
      ) : ayuda ? <ThemedText themeColor="textSecondary" type="small">{ayuda}</ThemedText> : null}
    </View>
  );
}

export function EnlaceCuenta({ titulo, onPress, deshabilitado = false }: Pick<BotonProps, 'titulo' | 'onPress' | 'deshabilitado'>) {
  return (
    <Pressable accessibilityRole="link" accessibilityState={{ disabled: deshabilitado }} disabled={deshabilitado} onPress={onPress}
      style={({ pressed }) => [estilos.enlace, (pressed || deshabilitado) && estilos.atenuado]}>
      <ThemedText themeColor="primary" style={estilos.textoEnlace}>{titulo}</ThemedText>
    </Pressable>
  );
}

export function AccesoAlternativo({ texto, ...props }: Pick<BotonProps, 'titulo' | 'onPress' | 'deshabilitado'> & { texto: string }) {
  return (
    <View style={estilos.accesoAlternativo}>
      <ThemedText type="small" themeColor="textSecondary" style={estilos.centrado}>{texto}</ThemedText>
      <EnlaceCuenta {...props} />
    </View>
  );
}

export function MensajeError({ mensaje }: { mensaje: string | null }) {
  const tema = useTheme();
  if (!mensaje) return null;
  return (
    <View style={[estilos.error, { backgroundColor: tema.terracottaSoft, borderColor: tema.favorite }]}>
      <ThemedText accessibilityRole="alert" accessibilityLiveRegion="polite" themeColor="favorite" type="small">
        {mensaje}
      </ThemedText>
    </View>
  );
}

export function IndicadorSesion() {
  const tema = useTheme();
  return (
    <View style={estilos.indicador} accessibilityLiveRegion="polite">
      <ActivityIndicator color={tema.primary} size="large" />
      <ThemedText themeColor="textSecondary">Recuperando tu sesión…</ThemedText>
    </View>
  );
}

export function TarjetaCuenta({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const tema = useTheme();
  return <View style={[estilos.tarjeta, { backgroundColor: tema.backgroundElement, borderColor: tema.border }, style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  boton: { minHeight: 56, borderRadius: 18, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  textoBoton: { fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  atenuado: { opacity: 0.6 },
  campo: { gap: 8 },
  contenedorEntrada: { minHeight: 56, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 4, gap: 10 },
  entrada: { flex: 1, minWidth: 0, paddingVertical: 16, paddingRight: 8, fontSize: 16, outlineWidth: 0 },
  verContrasena: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  error: { padding: 16, borderRadius: 16, borderWidth: 1 },
  indicador: { paddingVertical: 32, gap: 16, alignItems: 'center' },
  tarjeta: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 20 },
  enlace: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  textoEnlace: { fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center' },
  accesoAlternativo: { alignItems: 'center', gap: 2 },
  centrado: { textAlign: 'center' },
});
