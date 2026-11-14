import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';
import { recuperarSesion } from '@/servicios/almacenamiento-sesion';
import * as Network from 'expo-network';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  calcularEstadisticasResenas,
  crearResena,
  crearResenaOffline,
  editarResena,
  eliminarResenaServicio,
  obtenerResenasPorComercio,
  reportarResenaServicio,
  responderResenaServicio,
  sincronizarResenasPendientes
} from '../../servicios/resenas';
import { borrarAccionesDemoLocales, guardarReporteDemoLocal, guardarRespuestaDemoLocal } from '../../servicios/respuestas-demo';
import { ingresarApiResenas, type SesionPruebaResenas } from '../../servicios/sesion-prueba-resenas';
import { Resena } from '../../tipos/resena';
import { GaleriaComercio } from './galeria-comercio';
import { ModalNuevaResena } from './modal-nueva-resena';
import { ResumenCalificaciones } from './resumen-calificaciones';
import TarjetaResena from './tarjeta-resena';
import { VideoPresentacion } from './video-presentacion';

interface Props {
  comercioId: string;
  tokenSesion?: string;
  nombreComercio?: string;
  mostrarMultimedia?: boolean;
}



type ModoPruebaRol = 'vecino' | 'comercio';

function tieneConexionActiva(red: Network.NetworkState): boolean {
  return Boolean(red.isConnected && red.isInternetReachable !== false);
}

export const SeccionResenas: React.FC<Props> = ({
  comercioId,
  tokenSesion,
  nombreComercio,
  mostrarMultimedia = true,
}) => {
  const theme = useTheme();
  const nombreVisibleComercio = nombreComercio ?? 'Comercio';
  const { usuario } = useAutenticacion();
  const [tokenCompartido, setTokenCompartido] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
  
    if (!usuario) {
      return () => {
        activo = false;
      };
    }
  
    void recuperarSesion()
      .then((sesion) => {
        if (activo) {
          setTokenCompartido(
            sesion?.usuarioId === usuario.id ? sesion.token : null
          );
        }
      })
      .catch((error) => {
        console.warn('No se pudo recuperar la sesión para reseñas:', error);
        if (activo) setTokenCompartido(null);
      });
  
    return () => {
      activo = false;
    };
  }, [usuario]);

  const [modalVisible, setModalVisible] = useState(false);
  const [resenaEditando, setResenaEditando] = useState<Resena | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [sinInternet, setSinInternet] = useState(false);
  const huboDesconexion = useRef(false);

  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState({ promedio: 0, total: 0 });

  // Acceso independiente para probar operaciones REALES sin integrar el Rol 1.
  const [rolDemo, setRolDemo] = useState<ModoPruebaRol>('vecino');
  const [sesionPrueba, setSesionPrueba] = useState<SesionPruebaResenas | null>(null);
  const [correoPrueba, setCorreoPrueba] = useState('');
  const [clavePrueba, setClavePrueba] = useState('');
  const [ingresando, setIngresando] = useState(false);

  const tokenActual =
  usuario && tokenCompartido
    ? tokenCompartido
    : tokenSesion ?? sesionPrueba?.token;

    
  
  const usuarioActual = usuario ?? sesionPrueba?.usuario; 
  const usuarioActivoId = usuarioActual?.id ?? 'demo-local';
  const nombreUsuarioActivo = usuarioActual?.nombre ?? 'Usuario de demostración';
  const puedeUsarModoDemo = !tokenActual;
  const incluirRespuestasDemo = !tokenActual;
  const esDueñoDelComercio = tokenActual
    ? usuarioActual?.rol === 'comercio' && usuarioActual.comercioId === comercioId
    : rolDemo === 'comercio';

  const iniciarSesionPrueba = async () => {
    if (ingresando) return;
    setIngresando(true);
    try {
      const sesion = await ingresarApiResenas(correoPrueba, clavePrueba);
      setSesionPrueba(sesion);
      setClavePrueba('');
      setRolDemo(sesion.usuario.rol === 'comercio' ? 'comercio' : 'vecino');
      Alert.alert(
        'Sesión de API iniciada',
        `${sesion.usuario.nombre} · ${sesion.usuario.rol}. Las acciones ahora usarán Docker.`
      );
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setIngresando(false);
    }
  };
  const cargarResenas = useCallback(
    async (mostrarIndicador = true) => {
      try {
        if (mostrarIndicador) {
          setCargando(true);
        }
        setError(null);
        // 1. Verificamos si hay internet para sincronizar las pendientes de SQLite ANTES de listar
        try {
          const estadoRed = await Network.getNetworkStateAsync();
          if (tieneConexionActiva(estadoRed)) {
            const resultadoSync = await sincronizarResenasPendientes(comercioId, tokenActual ? { token: tokenActual, usuarioId: usuarioActivoId } : undefined);
            if (resultadoSync.sincronizadas > 0) {
              Alert.alert(
                'Sincronización completa',
                `Se ${
                  resultadoSync.sincronizadas === 1
                    ? 'sincronizó 1 reseña guardada'
                    : `sincronizaron ${resultadoSync.sincronizadas} reseñas guardadas`
                } sin conexión.`
              );
            }
          }
        } catch (errRed) {
          console.error('Error al verificar red durante carga:', errRed);
        }

        // 2. Cargamos el listado actualizado desde el servicio (persistido en SQLite)
        const data = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
        setResenas(data);
        setEstadisticas(calcularEstadisticasResenas(data));
      } catch {
        setError('Ocurrió un error al cargar las opiniones.');
      } finally {
        setCargando(false);
      }
    },
    [comercioId, tokenActual, usuarioActivoId, incluirRespuestasDemo]
  );

  useEffect(() => {
    let activo = true;

    const iniciarCarga = async () => {
      await Promise.resolve();

      if (activo) {
        await cargarResenas(true);
      }
    };

    void iniciarCarga();

    return () => {
      activo = false;
    };
  }, [cargarResenas]);

  // Refleja el estado de Internet y mantiene visible la cola local cuando vuelve la conexión.
  useEffect(() => {
    let activo = true;
    const actualizarEstadoRed = (red: Network.NetworkState) => {
      if (!activo) return;
      const conectado = tieneConexionActiva(red);
      setSinInternet(!conectado);
      if (!conectado) {
        huboDesconexion.current = true;
      } else if (huboDesconexion.current) {
        huboDesconexion.current = false;
        // Recuperar Internet no significa que Docker haya recibido las reseñas.
        Alert.alert(
          'Conexión recuperada',
          'Tus reseñas guardadas sin Internet siguen en el dispositivo. Todavía están pendientes de publicación hasta que se autentiquen y se envíen a la API.'
        );
        void cargarResenas(false);
      }
    };

    void Network.getNetworkStateAsync()
      .then(actualizarEstadoRed)
      .catch((error) => console.warn('No se pudo consultar el estado de red:', error));

    const suscripcion = Network.addNetworkStateListener((estadoRed) => {
      actualizarEstadoRed(estadoRed);
      if (tieneConexionActiva(estadoRed)) {
        void (async () => {
          try {
            const resultado = await sincronizarResenasPendientes(
              comercioId,
              tokenActual ? { token: tokenActual, usuarioId: usuarioActivoId } : undefined
            );
            if (resultado.sincronizadas > 0) {
              await cargarResenas(false);
              Alert.alert(
                'Sincronización completa',
                'Tus reseñas guardadas sin conexión se han sincronizado con el servidor.'
              );
            }
          } catch (error) {
            console.warn('No se pudo sincronizar al recuperar Internet:', error);
          }
        })();
      }
    });

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, [comercioId, tokenActual, usuarioActivoId, cargarResenas]);

  const abrirParaNueva = () => {
    setResenaEditando(null);
    setModalVisible(true);
  };

  const abrirParaEditar = (resena: Resena) => {
    setResenaEditando(resena);
    setModalVisible(true);
  };

  const eliminarResena = (id: string) => {
    Alert.alert('Eliminar reseña', '¿Estás seguro de que querés eliminar esta reseña?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await eliminarResenaServicio(id, usuarioActivoId, tokenActual);
              const actualizadas = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
              setResenas(actualizadas);
              setEstadisticas(calcularEstadisticasResenas(actualizadas));
              Alert.alert('Reseña eliminada', 'La reseña se eliminó correctamente.');
            } catch (err) {
              const mensaje =
                err instanceof Error ? err.message : 'No se pudo eliminar la reseña.';
              Alert.alert('Error', mensaje);
            }
          })();
        },
      },
    ]);
  };

  const reportarResena = (id: string) => {
    Alert.alert(
      'Reportar reseña ofensiva',
      '¿Querés reportar esta reseña por contenido ofensivo o inapropiado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                if (incluirRespuestasDemo && rolDemo === 'vecino') {
                  const resena = resenas.find((item) => item.id === id);
                  if (!resena || resena.reportada || resena.usuarioId === usuarioActivoId) {
                    throw new Error('No podés reportar esta reseña en el modo de prueba.');
                  }
                  guardarReporteDemoLocal(comercioId, id);
                  setResenas((actuales) => actuales.map((item) =>
                    item.id === id ? { ...item, reportada: true, reporteDemoLocal: true } : item
                  ));
                  Alert.alert('Reporte de prueba guardado',
                    'El reporte se guardó solo en este dispositivo. No se envió a Docker.');
                  return;
                }
                await reportarResenaServicio(id, 'Contenido ofensivo o inapropiado', tokenActual);
                const actualizadas = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
                setResenas(actualizadas);
                Alert.alert(
                  'Reporte registrado',
                  'Gracias. La reseña quedó marcada como reportada para su moderación.'
                );
              } catch (err) {
                const mensaje =
                  err instanceof Error ? err.message : 'No se pudo registrar el reporte.';
                Alert.alert('Aviso', mensaje);
              }
            })();
          },
        },
      ]
    );
  };

  const responderResena = async (id: string, respuesta: string): Promise<void> => {
    if (incluirRespuestasDemo && rolDemo === 'comercio') {
      const resenaActual = resenas.find((item) => item.id === id);
      if (!resenaActual || resenaActual.respuestaComercio) {
        throw new Error('Esta reseña no está disponible para responder.');
      }
      const respuestaLocal = guardarRespuestaDemoLocal(comercioId, id, respuesta);
      setResenas((actuales) => actuales.map((item) =>
        item.id === id
          ? { ...item, respuestaComercio: respuestaLocal, respuestaDemoLocal: true }
          : item
      ));
      Alert.alert(
        'Respuesta de prueba guardada',
        'La respuesta se guardó solo en este dispositivo. No se publicó en Docker.'
      );
      return;
    }

    // Fuera del modo demo, la API debe confirmar la respuesta con un token real.
    await responderResenaServicio(id, respuesta, tokenActual);
    const actualizadas = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
    setResenas(actualizadas);
    setEstadisticas(calcularEstadisticasResenas(actualizadas));
    Alert.alert('Respuesta publicada', 'La respuesta fue confirmada por el servidor.');
  };

  const handlePublicar = async (calificacion: number, comentario: string, fotos: string[]) => {
    try {
      setGuardando(true);
      const red = await Network.getNetworkStateAsync();
      const online = tieneConexionActiva(red);
      setSinInternet(!online);
      if (!online) huboDesconexion.current = true;

      if (resenaEditando) {
        await editarResena(
          {
            id: resenaEditando.id,
            usuarioId: usuarioActivoId,
            calificacion,
            comentario,
            fotos,
          },
          online,
          tokenActual
        );
        const actualizadas = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
        setResenas(actualizadas);
        setEstadisticas(calcularEstadisticasResenas(actualizadas));
        Alert.alert(
          resenaEditando.pendienteSincronizacion ? 'Reseña local actualizada' : 'Reseña actualizada',
          resenaEditando.pendienteSincronizacion
            ? online
              ? 'Los cambios quedaron guardados en SQLite y siguen pendientes de publicación.'
              : 'Sin Internet: los cambios se guardaron en SQLite y estarán disponibles al recuperar la conexión.'
            : 'Los cambios fueron confirmados por el servidor.'
        );
      } else if (online && tokenActual && fotos.length === 0) {
        await crearResena({
          comercioId,
          usuarioId: usuarioActivoId,
          nombreUsuario: nombreUsuarioActivo,
          calificacion,
          comentario,
          fotos,
        }, tokenActual);
        const actualizadas = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
        setResenas(actualizadas);
        setEstadisticas(calcularEstadisticasResenas(actualizadas));
        Alert.alert('Reseña publicada',
          'La reseña fue confirmada por el servidor.');
      } else {
        await crearResenaOffline({
          comercioId,
          usuarioId: usuarioActivoId,
          nombreUsuario: nombreUsuarioActivo,
          calificacion,
          comentario,
          fotos,
        });
        const actualizadas = await obtenerResenasPorComercio(comercioId, incluirRespuestasDemo);
        setResenas(actualizadas);
        setEstadisticas(calcularEstadisticasResenas(actualizadas));

        Alert.alert(
          !online
            ? 'Reseña guardada sin Internet'
            : fotos.length > 0
              ? 'Reseña con fotografía guardada'
              : 'Reseña de demostración guardada',

          !online
            ? 'La reseña se guardó en SQLite porque no hay conexión. Todavía no se publicó en Docker.'
            : fotos.length > 0
              ? 'La reseña y su fotografía se guardaron localmente. La API actual no permite asociar fotografías a las reseñas, por lo que no se publicó en Docker.'
              : 'La reseña se guardó en SQLite porque no hay una sesión de API disponible. Todavía no se publicó en Docker.'
        );




      }

      setModalVisible(false);
      setResenaEditando(null);
    } catch (err) {
      console.error('Error al guardar la reseña:', err);
      const mensaje =
        err instanceof Error ? err.message : 'Hubo un problema al intentar guardar la reseña.';
      Alert.alert('Error', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const pendientesCount = resenas.filter((r) => r.pendienteSincronizacion).length;

  return (
    <View style={styles.contenedor}>
     {!tokenActual && !usuario && (
        <View style={[styles.barraDemo, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.textoDemo, { color: theme.text }]}>Conexión real con la API · Rol 4</Text>
          {sesionPrueba ? (
            <View style={styles.filaSesion}>
              <Text style={[styles.textoDemo, { color: theme.text }]}>
                Sesión activa: {sesionPrueba.usuario.nombre} ({sesionPrueba.usuario.rol})
              </Text>
              <TouchableOpacity
                onPress={() => { setSesionPrueba(null); setRolDemo('vecino'); }}
                style={[styles.chipDemo, { backgroundColor: theme.backgroundSelected }]}>
                <Text style={{ color: theme.text }}>Cerrar sesión de prueba</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.filaSesion}>
              <Text style={[styles.textoDemo, { color: theme.textSecondaryStrong }]}>
                Iniciá sesión con una cuenta de la API para publicar o responder en Docker.
                Sin iniciar sesión, podés seguir usando el modo demo local.
              </Text>
              <TextInput
                accessibilityLabel="Correo de la API"
                style={[styles.campoSesion, { borderColor: theme.border, color: theme.text }]}
                value={correoPrueba}
                onChangeText={setCorreoPrueba}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholder="Correo de prueba de la API"
                placeholderTextColor={theme.textSecondary}
              />
              <TextInput
                accessibilityLabel="Contraseña de la API"
                style={[styles.campoSesion, { borderColor: theme.border, color: theme.text }]}
                value={clavePrueba}
                onChangeText={setClavePrueba}
                secureTextEntry
                placeholder="Contraseña"
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity
                disabled={ingresando}
                onPress={() => void iniciarSesionPrueba()}
                style={[styles.chipDemo, { backgroundColor: theme.forest }]}>
                <Text style={[styles.textoDemo, { color: theme.onForest }]}>
                  {ingresando ? 'Ingresando...' : 'Iniciar sesión con Docker'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {sinInternet && (
        <View
          style={[
            styles.avisoPendientes,
            { backgroundColor: theme.errorBackground, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoAvisoPendientes, { color: theme.error }]}>
            Sin conexión a Internet · Modo offline. Las reseñas se guardan en SQLite y quedan pendientes de publicación.
          </Text>
        </View>
      )}



<View style={{ marginBottom: 24 }}>
  <Text
    style={{
      color: theme.text,
      fontSize: 26,
      fontWeight: 'bold',
    }}>
    {nombreVisibleComercio}
  </Text>

  <Text
    style={{
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 4,
    }}>
    Fotografías, video y opiniones del comercio
  </Text>
</View>


{mostrarMultimedia && (
  <>
    <GaleriaComercio
      comercioId={comercioId}
      nombreComercio={nombreVisibleComercio}
      tokenSesion={tokenActual}
      puedeEditar={Boolean(tokenActual) && esDueñoDelComercio}
    />

    <VideoPresentacion
      comercioId={comercioId}
      nombreComercio={nombreVisibleComercio}
    />
  </>
)}

      {/* Selector de demostración exclusivo para pruebas independientes cuando no hay sesión iniciada */}
      {puedeUsarModoDemo && (
        <View
          style={[
            styles.barraDemo,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoDemo, { color: theme.textSecondaryStrong }]}>
            Modo prueba Rol 4:
          </Text>
          <View style={styles.botonesDemo}>
            <TouchableOpacity
              onPress={() => setRolDemo('vecino')}
              style={[
                styles.chipDemo,
                {
                  backgroundColor:
                    rolDemo === 'vecino' ? theme.forest : theme.backgroundSelected,
                },
              ]}>
              <Text
                style={[
                  styles.textoChipDemo,
                  { color: rolDemo === 'vecino' ? theme.onForest : theme.text },
                ]}>
                Vecino (demo local)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRolDemo('comercio')}
              style={[
                styles.chipDemo,
                {
                  backgroundColor:
                    rolDemo === 'comercio' ? theme.forest : theme.backgroundSelected,
                },
              ]}>
              <Text
                style={[
                  styles.textoChipDemo,
                  { color: rolDemo === 'comercio' ? theme.onForest : theme.text },
                ]}>
                Dueño del comercio
              </Text>
            </TouchableOpacity>
          </View>
          {incluirRespuestasDemo && (
            <TouchableOpacity
              onPress={() => Alert.alert(
                'Reiniciar acciones de prueba',
                'Borrará las respuestas y reportes de demostración. No elimina tus reseñas locales ni cambia Docker.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Reiniciar pruebas',
                    style: 'destructive',
                    onPress: () => {
                      try {
                        borrarAccionesDemoLocales(comercioId);
                        void cargarResenas(false);
                      } catch (error) {
                        Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron reiniciar las pruebas.');
                      }
                    },
                  },
                ]
              )}>
              <Text style={[styles.linkSincronizar, { color: theme.actionText }]}>Reiniciar acciones demo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {pendientesCount > 0 && (
        <View
          style={[
            styles.avisoPendientes,
            { backgroundColor: theme.promotionBackground, borderColor: theme.border },
          ]}>
          <Text style={[styles.textoAvisoPendientes, { color: theme.promotion }]}>
            Tenés {pendientesCount}{' '}
            {pendientesCount === 1 ? 'reseña guardada localmente' : 'reseñas guardadas localmente'} en
            SQLite (modo demostración).
          </Text>
          {tokenActual ? (
            <TouchableOpacity onPress={() => void cargarResenas(false)}>
              <Text style={[styles.linkSincronizar, { color: theme.actionText }]}>Sincronizar ahora</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.linkSincronizar, { color: theme.actionText }]}>Pendiente de publicación</Text>
          )}
        </View>
      )}

      <View style={styles.encabezado}>
        <Text style={[styles.titulo, { color: theme.text }]}>Opiniones y Reseñas</Text>
        <TouchableOpacity
          style={[styles.botonOpinar, { backgroundColor: theme.forest }]}
          onPress={abrirParaNueva}>
          <Text style={[styles.textoBotonOpinar, { color: theme.onForest }]}>+ Opinar</Text>
        </TouchableOpacity>
      </View>

      <ResumenCalificaciones promedio={estadisticas.promedio} total={estadisticas.total} />

      <View style={styles.lista}>
        {cargando ? (
          <View style={styles.contenedorEstado}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.textoEstado, { color: theme.textSecondary }]}>
              Cargando opiniones...
            </Text>
          </View>
        ) : error ? (
          <View
            style={[
              styles.contenedorError,
              { backgroundColor: theme.errorBackground, borderColor: theme.border },
            ]}>
            <Text style={[styles.textoError, { color: theme.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.botonReintentar, { backgroundColor: theme.forest }]}
              onPress={() => void cargarResenas(true)}>
              <Text style={[styles.textoBotonOpinar, { color: theme.onForest }]}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : resenas.length > 0 ? (
          resenas.map((resena) => (
            <TarjetaResena
              key={resena.id}
              resena={resena}
              esComercio={esDueñoDelComercio}
              usuarioActivoId={usuarioActivoId}
              onEditar={abrirParaEditar}
              onEliminar={eliminarResena}
              onReportar={reportarResena}
              onResponder={responderResena}
            />
          ))
        ) : (
          <Text style={[styles.textoVacio, { color: theme.textSecondary }]}>
            Aún no hay opiniones para este comercio. ¡Sé el primero en comentar!
          </Text>
        )}
      </View>

      <ModalNuevaResena
        visible={modalVisible}
        resenaInicial={resenaEditando}
        guardando={guardando}
        onCerrar={() => {
          if (!guardando) {
            setModalVisible(false);
            setResenaEditando(null);
          }
        }}
        onPublicar={handlePublicar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  filaSesion: { width: '100%', gap: 9 },
  campoSesion: { width: '100%', borderWidth: 1, borderRadius: 10, minHeight: 44, paddingHorizontal: 12 },
  barraDemo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  textoDemo: {
    fontSize: 12,
    fontWeight: '600',
  },
  botonesDemo: {
    flexDirection: 'row',
    gap: 6,
  },
  chipDemo: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  textoChipDemo: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  avisoPendientes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  textoAvisoPendientes: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  linkSincronizar: {
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  botonOpinar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  textoBotonOpinar: { fontWeight: 'bold' },
  lista: { gap: 12 },
  contenedorEstado: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  textoEstado: {
    fontSize: 14,
  },
  contenedorError: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  textoError: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  botonReintentar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  textoVacio: { textAlign: 'center', fontStyle: 'italic', marginTop: 20 },
});