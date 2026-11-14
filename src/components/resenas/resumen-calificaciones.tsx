import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface Props {
  promedio: number;
  total: number;
}

export const ResumenCalificaciones: React.FC<Props> = ({ promedio, total }) => {
  const theme = useTheme();
  const estrellasLlenas = Math.max(0, Math.min(5, Math.round(promedio)));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={[styles.columnaPuntaje, { borderRightColor: theme.border }]}>
        <Text style={[styles.numeroPromedio, { color: theme.text }]}>
          {promedio > 0 ? promedio : '-'}
        </Text>
        <Text style={[styles.estrellas, { color: theme.star }]}>
          {'★'.repeat(estrellasLlenas)}
          {'☆'.repeat(5 - estrellasLlenas)}
        </Text>
      </View>
      <View style={styles.columnaInfo}>
        <Text style={[styles.totalTexto, { color: theme.text }]}>
          {total === 1 ? '1 calificación' : `${total} calificaciones`}
        </Text>
        <Text style={[styles.subtexto, { color: theme.textSecondary }]}>
          Opiniones de la comunidad
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  columnaPuntaje: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
  },
  numeroPromedio: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  estrellas: {
    fontSize: 14,
  },
  columnaInfo: {
    paddingLeft: 16,
  },
  totalTexto: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtexto: {
    fontSize: 13,
    marginTop: 2,
  },
});