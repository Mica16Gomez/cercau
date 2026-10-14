import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function EncabezadoBuscar() {
  const { width, fontScale } = useWindowDimensions();
  const compacto = width < 360;
  // En celulares el título ocupa menos alto; en pantallas amplias llega a 38 px.
  const tamanoTitulo = width >= 600 ? 38 : compacto ? 27 : 30;
  const anchoDibujo = fontScale > 1.3 ? 72 : compacto ? 82 : width >= 600 ? 144 : 104;

  return (
    <View style={estilos.encabezado}>
      <View style={estilos.fila}>
        <ThemedText
          accessibilityRole="header"
          style={[estilos.titulo, { fontSize: tamanoTitulo, lineHeight: tamanoTitulo + 2 }]}>
          Encontrá lo mejor de tu barrio
        </ThemedText>
        <BarrioBuscar ancho={anchoDibujo} />
      </View>
      <ThemedText themeColor="textSecondary" style={estilos.subtitulo}>
        Comercios, promos y lugares cerca tuyo.
      </ThemedText>
    </View>
  );
}

export function EncabezadoComercios({ cantidad }: { cantidad: number }) {
  return (
    <View style={estilos.encabezadoComercios}>
      <View style={estilos.tituloComercios}>
        <ThemedText
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Cerca de vos. ${cantidad} comercios encontrados`}
          style={estilos.cercaDeVos}>
          Cerca de vos
        </ThemedText>
        <AcentosBarriales />
      </View>
      <PlantaBarrial />
    </View>
  );
}

function AcentosBarriales() {
  const tema = useTheme();
  return (
    <View style={estilos.acentos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[estilos.acento, estilos.acentoAlto, { backgroundColor: tema.terracotta }]} />
      <View style={[estilos.acento, estilos.acentoMedio, { backgroundColor: tema.terracotta }]} />
      <View style={[estilos.acento, estilos.acentoBajo, { backgroundColor: tema.terracotta }]} />
    </View>
  );
}

function PlantaBarrial() {
  const tema = useTheme();
  return (
    <View style={estilos.planta} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[estilos.hoja, estilos.hojaIzquierda, { backgroundColor: tema.buttonBackground }]} />
      <View style={[estilos.hoja, estilos.hojaCentral, { backgroundColor: tema.forest }]} />
      <View style={[estilos.hoja, estilos.hojaDerecha, { backgroundColor: tema.buttonBackground }]} />
      <View style={[estilos.tallo, { backgroundColor: tema.forest }]} />
    </View>
  );
}

// Casas y vegetación hechas con View. El recorte curvo se funde con el fondo de Buscar.
function BarrioBuscar({ ancho }: { ancho: number }) {
  const tema = useTheme();
  return (
    <View
      style={[estilos.barrio, { width: ancho }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={[estilos.loma, { backgroundColor: tema.sage }]} />
      <View style={[estilos.edificioAlto, { backgroundColor: tema.terracotta }]}>
        <Ventanas />
        <Ventanas />
      </View>
      <View style={[estilos.edificioMedio, { backgroundColor: tema.mustard }]}>
        <Ventanas />
        <View style={[estilos.puerta, { backgroundColor: tema.forest }]} />
      </View>
      <View style={[estilos.casa, { backgroundColor: tema.onForest }]}>
        <View style={[estilos.techo, { backgroundColor: tema.terracotta }]} />
        <Ventanas />
        <View style={[estilos.puerta, { backgroundColor: tema.forest }]} />
      </View>
      <View style={estilos.arbol}>
        <View style={[estilos.copa, { backgroundColor: tema.buttonBackground }]} />
        <View style={[estilos.tronco, { backgroundColor: tema.forest }]} />
        <View style={[estilos.rama, { backgroundColor: tema.forest }]} />
      </View>
      <View style={estilos.farol}>
        <View style={[estilos.luz, { borderColor: tema.forest, backgroundColor: tema.onForest }]} />
        <View style={[estilos.poste, { backgroundColor: tema.forest }]} />
      </View>
      <View style={[estilos.arbusto, { backgroundColor: tema.buttonBackground }]} />
      <View style={[estilos.arbustoPequeno, { backgroundColor: tema.forest }]} />
      <View style={[estilos.curva, { backgroundColor: tema.background }]} />
    </View>
  );
}

function Ventanas() {
  const tema = useTheme();
  return (
    <View style={estilos.ventanas}>
      <View style={[estilos.ventana, { backgroundColor: tema.forest }]} />
      <View style={[estilos.ventana, { backgroundColor: tema.forest }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { gap: 8, paddingHorizontal: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { flex: 1, fontWeight: '800', letterSpacing: -0.9 },
  subtitulo: { fontSize: 15, lineHeight: 22 },
  encabezadoComercios: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tituloComercios: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  cercaDeVos: { fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6, flexShrink: 1 },
  acentos: { width: 23, height: 28, flexShrink: 0 },
  acento: { position: 'absolute', width: 5, height: 13, borderRadius: 4 },
  acentoAlto: { left: 3, top: 0, transform: [{ rotate: '22deg' }] },
  acentoMedio: { left: 13, top: 8, transform: [{ rotate: '52deg' }] },
  acentoBajo: { left: 15, top: 20, height: 8, transform: [{ rotate: '82deg' }] },
  planta: { width: 44, height: 48, flexShrink: 0, overflow: 'hidden' },
  hoja: { position: 'absolute', width: 13, height: 33, borderRadius: 12 },
  hojaIzquierda: { left: 7, top: 12, transform: [{ rotate: '-35deg' }] },
  hojaCentral: { left: 20, top: 0, transform: [{ rotate: '8deg' }] },
  hojaDerecha: { left: 29, top: 20, transform: [{ rotate: '37deg' }] },
  tallo: { position: 'absolute', width: 3, height: 35, left: 24, bottom: -4, borderRadius: 2, transform: [{ rotate: '-15deg' }] },
  barrio: { height: 100, flexShrink: 0, overflow: 'hidden', borderTopLeftRadius: 58, borderBottomLeftRadius: 68, borderTopRightRadius: 10 },
  loma: { position: 'absolute', left: '-15%', right: '-20%', bottom: -15, height: 57, borderTopLeftRadius: 70, borderTopRightRadius: 70 },
  edificioAlto: { position: 'absolute', right: -3, top: 0, width: '31%', height: 96, borderTopLeftRadius: 6 },
  edificioMedio: { position: 'absolute', right: '23%', top: 19, width: '31%', height: 76, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  casa: { position: 'absolute', right: '12%', bottom: 0, width: '33%', height: 47, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  techo: { position: 'absolute', left: -3, right: -3, top: -4, height: 7, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  ventanas: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 12 },
  ventana: { width: 7, height: 13, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  puerta: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 10, height: 20, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  arbol: { position: 'absolute', left: 4, bottom: 15, width: 30, height: 64 },
  copa: { width: 30, height: 46, borderRadius: 19, transform: [{ rotate: '-8deg' }] },
  tronco: { position: 'absolute', left: 15, bottom: 0, width: 3, height: 49, borderRadius: 2 },
  rama: { position: 'absolute', left: 10, top: 27, width: 3, height: 17, borderRadius: 2, transform: [{ rotate: '-32deg' }] },
  farol: { position: 'absolute', left: '34%', bottom: 15, alignItems: 'center' },
  luz: { width: 10, height: 13, borderWidth: 2, borderRadius: 3 },
  poste: { width: 2, height: 24 },
  arbusto: { position: 'absolute', bottom: -1, right: 1, width: 27, height: 27, borderRadius: 20 },
  arbustoPequeno: { position: 'absolute', bottom: -3, right: 18, width: 18, height: 19, borderRadius: 15 },
  curva: { position: 'absolute', left: -57, bottom: -47, width: 150, height: 70, borderRadius: 80, transform: [{ rotate: '16deg' }] },
});
