import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type IlustracionComercioProps = { categoria: string; iniciales: string };

export function IlustracionComercio({ categoria, iniciales }: IlustracionComercioProps) {
  const tema = useTheme();
  const panaderia = categoria === 'Panaderías';
  const cafeteria = categoria === 'Cafeterías';
  const farmacia = categoria === 'Farmacias';
  const fondo = panaderia ? tema.terracotta : cafeteria ? tema.mustard : tema.sage;

  return (
    <View
      style={[estilos.miniatura, { backgroundColor: fondo }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <ThemedText style={[estilos.iniciales, { color: panaderia ? tema.onForest : tema.forest }]}>
        {iniciales}
      </ThemedText>
      {panaderia ? (
        <View style={estilos.panaderia}>
          <View style={[estilos.pan, { backgroundColor: tema.mustard, borderColor: tema.favorite }]}>
            <View style={[estilos.corte, estilos.corteUno, { backgroundColor: tema.favorite }]} />
            <View style={[estilos.corte, estilos.corteDos, { backgroundColor: tema.favorite }]} />
            <View style={[estilos.corte, estilos.corteTres, { backgroundColor: tema.favorite }]} />
          </View>
        </View>
      ) : cafeteria ? (
        <View style={estilos.cafeteria}>
          <View style={[estilos.vapor, estilos.vaporUno, { borderColor: tema.onForest }]} />
          <View style={[estilos.vapor, estilos.vaporDos, { borderColor: tema.onForest }]} />
          <View style={[estilos.asa, { borderColor: tema.forest }]} />
          <View style={[estilos.taza, { borderColor: tema.forest, backgroundColor: tema.onForest }]} />
          <View style={[estilos.cafe, { backgroundColor: tema.forest }]} />
          <View style={[estilos.platillo, { backgroundColor: tema.forest }]} />
        </View>
      ) : farmacia ? (
        <View style={[estilos.farmacia, { backgroundColor: tema.onForest }]}>
          <View style={[estilos.cruzVertical, { backgroundColor: tema.buttonBackground }]} />
          <View style={[estilos.cruzHorizontal, { backgroundColor: tema.buttonBackground }]} />
        </View>
      ) : (
        <View style={estilos.otroComercio}>
          <SymbolView name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} tintColor={tema.forest} size={36} />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  miniatura: { width: 68, height: 78, borderRadius: 17, flexShrink: 0, overflow: 'hidden' },
  iniciales: { position: 'absolute', left: 9, top: 5, fontSize: 17, lineHeight: 23, fontWeight: '800' },
  panaderia: { position: 'absolute', left: 8, bottom: 11, width: 54, height: 30, transform: [{ rotate: '-12deg' }] },
  pan: { width: 52, height: 29, borderRadius: 20, borderBottomWidth: 4 },
  corte: { position: 'absolute', top: 4, width: 3, height: 15, borderRadius: 3, transform: [{ rotate: '28deg' }] },
  corteUno: { left: 14 },
  corteDos: { left: 25 },
  corteTres: { left: 36 },
  cafeteria: { position: 'absolute', left: 9, bottom: 8, width: 51, height: 40 },
  vapor: { position: 'absolute', top: -1, width: 7, height: 10, borderLeftWidth: 2, borderTopLeftRadius: 7 },
  vaporUno: { left: 16 },
  vaporDos: { left: 25, top: -3 },
  asa: { position: 'absolute', right: 2, top: 13, width: 15, height: 16, borderWidth: 3, borderRadius: 9 },
  taza: { position: 'absolute', top: 10, left: 5, width: 34, height: 25, borderWidth: 3, borderBottomLeftRadius: 13, borderBottomRightRadius: 13 },
  cafe: { position: 'absolute', top: 8, left: 5, width: 34, height: 8, borderRadius: 8 },
  platillo: { position: 'absolute', bottom: 0, left: 0, width: 48, height: 3, borderRadius: 3 },
  farmacia: { position: 'absolute', bottom: 8, left: 14, width: 41, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cruzVertical: { position: 'absolute', width: 10, height: 29, borderRadius: 2 },
  cruzHorizontal: { position: 'absolute', width: 29, height: 10, borderRadius: 2 },
  otroComercio: { position: 'absolute', left: 15, bottom: 8 },
});
