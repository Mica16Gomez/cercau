import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Resena } from '../../tipos/resena';

interface Props {
  resena: Resena;
  esComercio?: boolean;
  usuarioActivoId?: string;
  onEditar?: (resena: Resena) => void;
  onEliminar?: (id: string) => void;
  onReportar?: (id: string) => void;
  onResponder?: (id: string, respuesta: string) => Promise<void>;
}

const TarjetaResena: React.FC<Props> = ({
  resena,
  esComercio = false,
  usuarioActivoId,
  onEditar,
  onEliminar,
  onReportar,
  onResponder,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  // Evalúa si la reseña pertenece al usuario activo actual
  const esMia =
    Boolean(usuarioActivoId) &&
    resena.usuarioId === usuarioActivoId;
  const calificacionSegura = Math.max(0, Math.min(5, resena.calificacion || 0));
  const puedeResponderComercio = esComercio && !resena.respuestaComercio;

  const handleAccion = (accion: () => void) => {
    setMenuVisible(false);
    accion();
  };

  const enviarRespuesta = async () => {
    if (!textoRespuesta.trim() || !onResponder || enviandoRespuesta) return;
    setEnviandoRespuesta(true);
    try {
      await onResponder(resena.id, textoRespuesta.trim());
      setRespondiendo(false);
      setTextoRespuesta('');
    } catch (error) {
      Alert.alert('No se pudo guardar la respuesta', error instanceof Error ? error.message : 'Ocurrió un error.');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  return (
    <View
      style={[
        styles.contenedor,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.encabezado}>
        <View style={styles.filaAutor}>
          <Text style={[styles.nombre, { color: theme.text }]}>{resena.nombreUsuario}</Text>
          {resena.pendienteSincronizacion && (
            <View
              style={[
                styles.etiquetaEstado,
                { backgroundColor: theme.promotionBackground },
              ]}>
              <Text style={[styles.textoEtiquetaEstado, { color: theme.promotion }]}>
                Guardada localmente · Demo
              </Text>
            </View>
          )}
          {resena.reportada && (
            <View
              style={[
                styles.etiquetaEstado,
                { backgroundColor: theme.errorBackground },
              ]}>
              <Text style={[styles.textoEtiquetaEstado, { color: theme.error }]}>
                {resena.reporteDemoLocal ? 'Reportada · demostración' : 'Reportada'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controlesSuperiores}>
          <Text style={[styles.fecha, { color: theme.textSecondary }]}>
            {resena.fechaCreacion
              ? new Date(resena.fechaCreacion).toLocaleDateString()
              : 'Recién publicado'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Opciones de la reseña de ${resena.nombreUsuario}`}
            style={styles.botonOpciones}
            onPress={() => setMenuVisible(!menuVisible)}>
            <Text style={[styles.textoOpciones, { color: theme.text }]}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {menuVisible && (
        <View
          style={[
            styles.menuOpciones,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          {esMia ? (
            <>
              <TouchableOpacity
                onPress={() => onEditar && handleAccion(() => onEditar(resena))}
                style={styles.opcionMenu}>
                <Text style={[styles.textoOpcion, { color: theme.text }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEliminar && handleAccion(() => onEliminar(resena.id))}
                style={styles.opcionMenu}>
                <Text style={[styles.textoOpcion, { color: theme.error }]}>Eliminar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {puedeResponderComercio && (
                <TouchableOpacity
                  onPress={() => handleAccion(() => setRespondiendo(true))}
                  style={styles.opcionMenu}>
                  <Text style={[styles.textoOpcion, { color: theme.primary }]}>
                    Responder como comercio
                  </Text>
                </TouchableOpacity>
              )}
              {resena.reportada ? (
                <View style={styles.opcionMenu}>
                  <Text style={[styles.textoOpcionDeshabilitada, { color: theme.textSecondary }]}>
                    Ya reportada
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => onReportar && handleAccion(() => onReportar(resena.id))}
                  style={styles.opcionMenu}>
                  <Text style={[styles.textoOpcion, { color: theme.error }]}>
                    Reportar reseña
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      <Text style={[styles.estrellas, { color: theme.star }]}>
        {'★'.repeat(calificacionSegura)}
        {'☆'.repeat(5 - calificacionSegura)}
      </Text>

      {resena.comentario ? (
        <Text style={[styles.comentario, { color: theme.text }]}>{resena.comentario}</Text>
      ) : null}

      {resena.fotos && resena.fotos.length > 0 && (
        <View style={styles.galeria}>
          {resena.fotos.map((fotoUrl, index) => (
            <Image
              key={`${fotoUrl}-${index}`}
              source={{ uri: fotoUrl }}
              style={[styles.fotoAdjunta, { backgroundColor: theme.backgroundSelected }]}
            />
          ))}
        </View>
      )}

      {resena.respuestaComercio && (
        <View
          style={[
            styles.respuestaContenedor,
            { backgroundColor: theme.primarySoft, borderColor: theme.border },
          ]}>
          <View style={styles.respuestaEncabezado}>
            <Text style={[styles.respuestaTitulo, { color: theme.primary }]}>
              {resena.respuestaDemoLocal
                ? 'Respuesta de demostración · Solo en este dispositivo'
                : 'Respuesta del comercio'}
            </Text>
            {resena.respuestaComercio.fechaCreacion && (
              <Text style={[styles.respuestaFecha, { color: theme.textSecondary }]}>
                {new Date(resena.respuestaComercio.fechaCreacion).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Text style={[styles.respuestaTexto, { color: theme.text }]}>
            {resena.respuestaComercio.comentario}
          </Text>
        </View>
      )}

      {respondiendo && !resena.respuestaComercio && (
        <View style={styles.cajaRespuesta}>
          <TextInput
            style={[
              styles.inputRespuesta,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Escribí la respuesta única del comercio..."
            placeholderTextColor={theme.textSecondary}
            value={textoRespuesta}
            onChangeText={setTextoRespuesta}
            multiline
          />
          <View style={styles.botonesRespuesta}>
            <TouchableOpacity
              style={[styles.botonAccionRespuesta, { backgroundColor: theme.terracottaSoft }]}
              onPress={() => {
                setRespondiendo(false);
                setTextoRespuesta('');
              }}>
              <Text style={[styles.textoBotonRespuesta, { color: theme.actionText }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonAccionRespuesta, { backgroundColor: theme.forest }]}
              onPress={() => void enviarRespuesta()}
              disabled={enviandoRespuesta}>
              <Text style={[styles.textoBotonRespuesta, { color: theme.onForest }]}>
                {enviandoRespuesta ? 'Enviando...' : 'Enviar respuesta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default TarjetaResena;

const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
    gap: 8,
  },
  filaAutor: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  etiquetaEstado: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  textoEtiquetaEstado: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlesSuperiores: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fecha: {
    fontSize: 12,
    marginRight: 8,
  },
  botonOpciones: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoOpciones: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuOpciones: {
    position: 'absolute',
    top: 40,
    right: 10,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    zIndex: 10,
    elevation: 5,
    minWidth: 150,
  },
  opcionMenu: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textoOpcion: {
    fontSize: 14,
    fontWeight: '500',
  },
  textoOpcionDeshabilitada: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  estrellas: {
    fontSize: 18,
    marginVertical: 6,
  },
  comentario: {
    fontSize: 14,
    lineHeight: 20,
  },
  galeria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  fotoAdjunta: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  respuestaContenedor: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  respuestaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  respuestaTitulo: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  respuestaFecha: {
    fontSize: 11,
  },
  respuestaTexto: {
    fontSize: 13,
    lineHeight: 18,
  },
  cajaRespuesta: {
    marginTop: 12,
  },
  inputRespuesta: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  botonesRespuesta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  botonAccionRespuesta: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  textoBotonRespuesta: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});