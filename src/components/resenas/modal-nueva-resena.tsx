import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { guardarFotoLocalmente } from '../../servicios/persistencia-fotos';
import { Resena } from '../../tipos/resena';

interface Props {
  visible: boolean;
  resenaInicial?: Resena | null;
  guardando?: boolean;
  onCerrar: () => void;
  onPublicar: (calificacion: number, comentario: string, fotos: string[]) => Promise<void> | void;
}

export const ModalNuevaResena: React.FC<Props> = ({
  visible,
  resenaInicial,
  guardando = false,
  onCerrar,
  onPublicar,
}) => {
  const theme = useTheme();
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);


  const prepararFormulario = () => {
    setErrorValidacion(null);

    if (resenaInicial) {
      setCalificacion(resenaInicial.calificacion);
      setComentario(resenaInicial.comentario || '');
      setFotos(resenaInicial.fotos || []);
    } else {
      setCalificacion(5);
      setComentario('');
      setFotos([]);
    }
  };


  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus fotos.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets.length > 0) {
        const uriTemporal = resultado.assets[0].uri;
        const uriPermanente = await guardarFotoLocalmente(uriTemporal);
        setFotos((prev) => [...prev, uriPermanente]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const eliminarFoto = (indexAEliminar: number) => {
    setFotos((prev) => prev.filter((_, index) => index !== indexAEliminar));
  };

  const handleGuardar = async () => {
    if (calificacion < 1 || calificacion > 5) {
      setErrorValidacion('Seleccioná entre 1 y 5 estrellas.');
      return;
    }
    if (!comentario.trim()) {
      setErrorValidacion('Escribí un breve comentario sobre tu experiencia.');
      return;
    }

    setErrorValidacion(null);
    await onPublicar(calificacion, comentario.trim(), fotos);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={prepararFormulario}
    >
      <View style={[styles.fondoModal, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.contenedorModal,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.tituloModal, { color: theme.text }]}>
            {resenaInicial ? 'Editar opinión' : 'Nueva opinión'}
          </Text>

          <Text style={[styles.label, { color: theme.textSecondaryStrong }]}>
            Calificación (1 a 5 estrellas):
          </Text>
          <View style={styles.contenedorEstrellas}>
            {[1, 2, 3, 4, 5].map((estrella) => (
              <TouchableOpacity
                key={estrella}
                disabled={guardando}
                accessibilityRole="button"
                accessibilityLabel={`${estrella} estrellas`}
                onPress={() => setCalificacion(estrella)}>
                <Text
                  style={[
                    styles.estrella,
                    { color: calificacion >= estrella ? theme.star : theme.border },
                  ]}>
                  {calificacion >= estrella ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.textSecondaryStrong }]}>Comentario:</Text>
          <TextInput
            style={[
              styles.inputComentario,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: errorValidacion ? theme.error : theme.border,
              },
            ]}
            multiline
            numberOfLines={4}
            editable={!guardando}
            placeholder="¿Qué te pareció el lugar?"
            placeholderTextColor={theme.textSecondary}
            value={comentario}
            onChangeText={(texto) => {
              setComentario(texto);
              if (errorValidacion) setErrorValidacion(null);
            }}
          />

          {errorValidacion && (
            <Text style={[styles.textoError, { color: theme.error }]}>{errorValidacion}</Text>
          )}

          <View style={styles.seccionFotos}>
            <TouchableOpacity
              disabled={guardando}
              style={[
                styles.botonFoto,
                { backgroundColor: theme.primarySoft, borderColor: theme.border },
              ]}
              onPress={seleccionarImagen}>
              <Text style={[styles.textoBotonFoto, { color: theme.primary }]}>+ Adjuntar foto</Text>
            </TouchableOpacity>

            <View style={styles.galeriaMiniaturas}>
              {fotos.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.contenedorMiniatura}>
                  <Image
                    source={{ uri }}
                    style={[styles.miniatura, { backgroundColor: theme.backgroundSelected }]}
                  />

                  <TouchableOpacity
                    disabled={guardando}
                    style={[styles.botonEliminarFoto, { backgroundColor: theme.error }]}
                    onPress={() => eliminarFoto(index)}>
                    <Text style={styles.textoEliminarFoto}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.filaBotones}>
            <TouchableOpacity
              disabled={guardando}
              style={styles.botonCancelar}
              onPress={onCerrar}>
              <Text style={[styles.textoBotonSecundario, { color: theme.textSecondaryStrong }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={guardando}
              style={[
                styles.botonPublicar,
                { backgroundColor: theme.forest, opacity: guardando ? 0.6 : 1 },
              ]}
              onPress={() => void handleGuardar()}>
              <Text style={[styles.textoBotonPrincipal, { color: theme.onForest }]}>
                {guardando
                  ? 'Guardando...'
                  : resenaInicial
                    ? 'Guardar cambios'
                    : 'Publicar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fondoModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorModal: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  tituloModal: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  contenedorEstrellas: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  estrella: {
    fontSize: 32,
    marginHorizontal: 4,
  },
  inputComentario: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
    minHeight: 100,
    marginBottom: 12,
  },
  textoError: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  seccionFotos: {
    marginBottom: 20,
  },
  botonFoto: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  textoBotonFoto: {
    fontSize: 13,
    fontWeight: '600',
  },
  galeriaMiniaturas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contenedorMiniatura: {
    position: 'relative',
  },
  miniatura: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  botonEliminarFoto: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoEliminarFoto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filaBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botonCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botonPublicar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  textoBotonSecundario: {
    fontWeight: 'bold',
  },
  textoBotonPrincipal: {
    fontWeight: 'bold',
  },
});