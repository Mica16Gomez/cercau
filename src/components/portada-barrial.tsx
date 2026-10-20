import { Image } from 'expo-image';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Solo el dibujo se superpone: el texto determina la altura y puede crecer con la fuente.
export function PortadaBarrial({ tipo }: { tipo: 'buscar' | 'cuenta' }) {
  const tema = useTheme();
  const oscuro = useColorScheme() === 'dark';
  const { width, fontScale } = useWindowDimensions();
  const buscar = tipo === 'buscar';
  const compacto = width < 360;
  const fuenteGrande = fontScale > 1.3;
  const tamanoTitulo = compacto ? 30 : 36;

  return (
    <View style={[estilos.portada, buscar ? estilos.portadaBuscar : estilos.portadaCuenta]}>
      <Image source={require('../../assets/images/referencia/portada-curva.svg')}
        style={StyleSheet.absoluteFill} contentFit="fill" tintColor={tema.primarySoft}
        accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Image source={buscar ? require('../../assets/images/referencia/barrio-buscar.svg') : require('../../assets/images/referencia/barrio-cuenta.svg')}
        style={[estilos.ilustracion, buscar ? estilos.barrioBuscar : estilos.barrioCuenta, fuenteGrande && estilos.ilustracionTenue]}
        contentFit="contain" contentPosition="bottom right"
        accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <View style={[estilos.textos, buscar ? estilos.textosBuscar : estilos.textosCuenta, fuenteGrande && estilos.textosGrandes]}>
        <ThemedText accessibilityRole="header" themeColor="primary"
          style={[estilos.titulo, buscar && estilos.tituloBuscar, { color: oscuro ? tema.primary : '#103F32', fontSize: tamanoTitulo, lineHeight: tamanoTitulo + 3 }]}>
          {buscar ? 'Encontrá\nlo mejor de\ntu barrio' : 'Tu lugar\nen Cercau'}
        </ThemedText>
        <ThemedText themeColor={buscar ? 'primary' : 'textSecondaryStrong'}
          style={[estilos.descripcion, !buscar && estilos.descripcionCuenta, compacto && estilos.descripcionCompacta]}>
          {buscar ? 'Cerca de vos.' : 'Guardá tus favoritos\ny participá de tu\ncomunidad.'}
        </ThemedText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  portada: { overflow: 'hidden', justifyContent: 'center' },
  portadaBuscar: { minHeight: 254, paddingTop: 52, paddingBottom: 48 },
  portadaCuenta: { minHeight: 249, marginTop: -30, borderRadius: 42, paddingTop: 58, paddingBottom: 31 },
  textos: { gap: 10, zIndex: 1 },
  textosBuscar: { marginLeft: 20, width: '67%' },
  textosCuenta: { marginLeft: 20, width: '53%' },
  textosGrandes: { width: '88%' },
  titulo: { fontWeight: '800', letterSpacing: -1.1 },
  tituloBuscar: { fontFamily: Fonts.serif, fontWeight: '700', letterSpacing: -0.7 },
  descripcion: { fontSize: 18, lineHeight: 24 },
  descripcionCuenta: { fontWeight: '400', letterSpacing: -0.5 },
  descripcionCompacta: { fontSize: 16, lineHeight: 22 },
  ilustracion: { position: 'absolute', right: 0, bottom: 0 },
  barrioBuscar: { width: '52%', height: 210 },
  barrioCuenta: { width: '61%', height: '100%', right: -8 },
  ilustracionTenue: { opacity: 0.2 },
});
