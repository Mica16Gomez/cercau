import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// El mismo dibujo se reutiliza en el encabezado y, a menor escala, en el saludo.
export function BarrioIlustrado({ compacto = false, variante = 'cuenta' }: { compacto?: boolean; variante?: 'cuenta' | 'login' }) {
  const tema = useTheme();
  if (variante === 'login') return <CalleBarrial compacto={compacto} />;
  return (
    <View style={[estilos.marco, compacto && estilos.marcoCompacto]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[estilos.escena, compacto && estilos.escenaCompacta]}>
        <View style={[estilos.loma, { backgroundColor: tema.sage }]} />
        <View style={[estilos.edificioFondo, { backgroundColor: tema.mustard }]}>
          <Ventanas />
        </View>
        <View style={[estilos.casa, { backgroundColor: tema.onForest }]}>
          <View style={[estilos.techo, { backgroundColor: tema.terracotta }]} />
          <Ventanas />
          <View style={[estilos.puerta, { backgroundColor: tema.forest }]} />
        </View>
        <View style={estilos.arbolAlto}><Arbol /></View>
        <View style={estilos.farol}>
          <View style={[estilos.luz, { borderColor: tema.onForest }]} />
          <View style={[estilos.poste, { backgroundColor: tema.onForest }]} />
        </View>
        <View style={estilos.arbolBajo}><Arbol oscuro /></View>
        <View style={[estilos.acento, estilos.acentoUno, { backgroundColor: tema.mustard }]} />
        <View style={[estilos.acento, estilos.acentoDos, { backgroundColor: tema.mustard }]} />
      </View>
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

function Arbol({ oscuro = false }: { oscuro?: boolean }) {
  const tema = useTheme();
  return (
    <View style={estilos.arbol}>
      <View style={[estilos.copa, { backgroundColor: oscuro ? tema.forest : tema.sage }]} />
      <View style={[estilos.copaLateral, { backgroundColor: oscuro ? tema.forest : tema.sage }]} />
      <View style={[estilos.tronco, { backgroundColor: oscuro ? tema.sage : tema.forest }]} />
      <View style={[estilos.rama, estilos.ramaIzquierda, { backgroundColor: oscuro ? tema.sage : tema.forest }]} />
      <View style={[estilos.rama, estilos.ramaDerecha, { backgroundColor: oscuro ? tema.sage : tema.forest }]} />
    </View>
  );
}

function CalleBarrial({ compacto }: { compacto: boolean }) {
  const tema = useTheme();
  const construcciones = [
    { izquierda: '15%', altura: 38, tono: 'sage' },
    { izquierda: '44%', altura: 56, tono: 'onForest' },
    { izquierda: '73%', altura: 46, tono: 'mustard' },
  ] as const;
  return (
    <View style={[estilos.calle, compacto && estilos.calleCompacta]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {construcciones.map((casa) => (
        <View key={casa.tono} style={[estilos.fachada, { left: casa.izquierda, height: casa.altura, backgroundColor: tema[casa.tono] }]}>
          <View style={[estilos.techoCalle, { backgroundColor: tema.terracotta }]} />
          <View style={estilos.ventanasCalle}>
            <View style={[estilos.ventanaCalle, { backgroundColor: tema.forest }]} />
            <View style={[estilos.ventanaCalle, { backgroundColor: tema.forest }]} />
          </View>
          <View style={[estilos.puertaCalle, { backgroundColor: tema.forest }]} />
        </View>
      ))}
      <View style={estilos.arbolCalle}>
        <View style={[estilos.copaCalle, { backgroundColor: tema.sage }]} />
        <View style={[estilos.troncoCalle, { backgroundColor: tema.forest }]} />
        <View style={[estilos.ramaCalle, { backgroundColor: tema.forest }]} />
      </View>
      <View style={estilos.farolCalle}>
        <View style={[estilos.luzCalle, { borderColor: tema.onForest }]} />
        <View style={[estilos.posteCalle, { backgroundColor: tema.onForest }]} />
      </View>
      <View style={[estilos.arbusto, { backgroundColor: tema.buttonBackground }]} />
      <View style={[estilos.arbustoPequeno, { backgroundColor: tema.sage }]} />
      <View style={[estilos.veredaCalle, { backgroundColor: tema.sage }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: { width: 160, height: 200, overflow: 'hidden', pointerEvents: 'none' },
  marcoCompacto: { width: 88, height: 100, flexShrink: 0 },
  escena: { width: 160, height: 200 },
  escenaCompacta: { position: 'absolute', left: -36, top: -50, transform: [{ scale: 0.5 }] },
  loma: { position: 'absolute', bottom: -55, left: 6, width: 185, height: 125, borderTopLeftRadius: 95, borderTopRightRadius: 70 },
  edificioFondo: { position: 'absolute', right: -6, bottom: 12, width: 51, height: 136, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  casa: { position: 'absolute', left: 68, bottom: 0, width: 61, height: 107 },
  techo: { position: 'absolute', top: -10, left: -8, width: 77, height: 23, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  ventanas: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 27 },
  ventana: { width: 12, height: 27, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  puerta: { position: 'absolute', bottom: 0, left: 24, width: 17, height: 37, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  arbolAlto: { position: 'absolute', top: 19, left: 0 },
  arbolBajo: { position: 'absolute', bottom: -29, right: -1, transform: [{ scale: 0.8 }, { rotate: '12deg' }] },
  arbol: { width: 65, height: 128 },
  copa: { position: 'absolute', top: 0, left: 15, width: 42, height: 85, borderRadius: 30, transform: [{ rotate: '9deg' }] },
  copaLateral: { position: 'absolute', top: 37, left: 4, width: 59, height: 54, borderRadius: 30 },
  tronco: { position: 'absolute', bottom: 0, left: 32, width: 4, height: 94, borderRadius: 3, transform: [{ rotate: '6deg' }] },
  rama: { position: 'absolute', width: 4, height: 32, borderRadius: 3 },
  ramaIzquierda: { top: 58, left: 22, transform: [{ rotate: '-30deg' }] },
  ramaDerecha: { top: 43, left: 41, transform: [{ rotate: '31deg' }] },
  farol: { position: 'absolute', top: 74, left: 60, alignItems: 'center' },
  luz: { width: 14, height: 21, borderWidth: 3, borderRadius: 3 },
  poste: { width: 3, height: 45 },
  acento: { position: 'absolute', width: 5, height: 21, borderRadius: 4 },
  acentoUno: { left: 6, bottom: 35, transform: [{ rotate: '-34deg' }] },
  acentoDos: { left: 18, bottom: 40, height: 15, transform: [{ rotate: '-12deg' }] },
  calle: { height: 82, width: '100%', pointerEvents: 'none' },
  calleCompacta: { height: 70 },
  fachada: { position: 'absolute', bottom: 4, width: '21%', borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  techoCalle: { position: 'absolute', left: -3, right: -3, top: -5, height: 8, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  ventanasCalle: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10 },
  ventanaCalle: { width: 8, height: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  puertaCalle: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 12, height: 15, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  arbolCalle: { position: 'absolute', bottom: 4, left: '1%', width: 29, height: 64 },
  copaCalle: { position: 'absolute', top: 0, width: 29, height: 49, borderRadius: 18 },
  troncoCalle: { position: 'absolute', left: 14, bottom: 0, width: 3, height: 47, borderRadius: 2 },
  ramaCalle: { position: 'absolute', left: 8, top: 27, width: 3, height: 18, borderRadius: 2, transform: [{ rotate: '-30deg' }] },
  farolCalle: { position: 'absolute', bottom: 4, left: '37%', alignItems: 'center' },
  luzCalle: { width: 12, height: 16, borderWidth: 2, borderRadius: 3 },
  posteCalle: { width: 2, height: 31 },
  arbusto: { position: 'absolute', bottom: 4, left: '64%', width: 30, height: 14, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  arbustoPequeno: { position: 'absolute', bottom: 4, left: '60%', width: 18, height: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  veredaCalle: { position: 'absolute', bottom: 2, left: 0, right: 0, height: 2, borderRadius: 2 },
});
