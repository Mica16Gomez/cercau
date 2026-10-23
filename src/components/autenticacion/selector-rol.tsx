import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { RolUsuario } from '@/tipos/usuario';

const opciones = [
  { rol: 'vecino', titulo: 'Soy vecino', breve: 'Busco comercios', descripcion: 'Descubrí los comercios de tu barrio y encontrá lo que necesitás cerca tuyo.', icono: { ios: 'person.2', android: 'people', web: 'people' } },
  { rol: 'comercio', titulo: 'Tengo un comercio', breve: 'Alta por el Centro Comercial', descripcion: 'Las cuentas de comercio las crea el Centro Comercial. Si ya tenés una, iniciá sesión.', icono: { ios: 'storefront', android: 'storefront', web: 'storefront' } },
] as const;

type Props = { valor: RolUsuario | null; onChange?: (rol: RolUsuario) => void; compacto?: boolean; deshabilitado?: boolean; error?: string };

export function SelectorRol({ valor, onChange, compacto = false, deshabilitado = false, error }: Props) {
  const tema = useTheme();
  return (
    <View style={estilos.grupo}>
      <View style={[estilos.opciones, compacto && estilos.fila]} accessibilityLabel="Tipo de cuenta" role="radiogroup">
        {opciones.map((opcion) => {
          const seleccionado = valor === opcion.rol;
          const esComercio = opcion.rol === 'comercio';
          const bloqueado = deshabilitado || esComercio;
          return (
            <Pressable key={opcion.rol} accessibilityRole="radio"
              accessibilityLabel={`${opcion.titulo}. ${compacto ? opcion.breve : opcion.descripcion}`}
              accessibilityState={{ checked: seleccionado, disabled: bloqueado }}
              disabled={bloqueado} onPress={() => onChange?.(opcion.rol)}
              style={({ pressed }) => [estilos.opcion, compacto && estilos.compacta, {
                backgroundColor: seleccionado ? tema.primarySoft : tema.backgroundElement,
                borderColor: seleccionado ? tema.primary : tema.border,
              }, (pressed || bloqueado) && estilos.presionado]}>
              <View style={estilos.encabezado}>
                <View style={[estilos.icono, compacto && estilos.iconoCompacto, { backgroundColor: esComercio ? tema.terracottaSoft : tema.primarySoft }]}>
                  <SymbolView name={opcion.icono} size={compacto ? 23 : 30} tintColor={esComercio ? tema.terracotta : tema.primary} />
                </View>
                <View style={[estilos.radio, { borderColor: seleccionado ? tema.primary : tema.border, backgroundColor: seleccionado ? tema.primary : tema.backgroundElement }]}>
                  {seleccionado && <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={14} tintColor={tema.onPrimary} />}
                </View>
              </View>
              <ThemedText style={compacto ? estilos.nombreCompacto : estilos.nombre}>{opcion.titulo}</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">{compacto ? opcion.breve : opcion.descripcion}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error && <ThemedText accessibilityLiveRegion="polite" type="small" themeColor="favorite">{error}</ThemedText>}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 8 },
  opciones: { gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  opcion: { borderRadius: 26, borderWidth: 1.5, padding: 22, gap: 10 },
  compacta: { flex: 1, minWidth: 120, borderRadius: 20, padding: 14, gap: 8 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  icono: { width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  iconoCompacto: { width: 40, height: 40, borderRadius: 13 },
  radio: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  nombreCompacto: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  presionado: { opacity: 0.7 },
});
