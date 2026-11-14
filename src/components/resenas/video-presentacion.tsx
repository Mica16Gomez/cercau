
import axios from 'axios';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface Props {
  comercioId?: string;
  videoUrl?: string;
  nombreComercio?: string;
}

interface RespuestaComercioApi {
  datos?: {
    videoUrl?: string | null;
  };
}

// Usa la misma API que ya configuraste para las reseñas.
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

// La API puede devolver localhost, pero el celular debe usar
// la dirección IP de la computadora donde está Docker.
function adaptarUrlVideo(url: string): string {
  const origenApi =
    API_BASE_URL.match(/^https?:\/\/[^/]+/i)?.[0] ??
    API_BASE_URL;

  return url
    .trim()
    .replace(
      /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/|$)/i,
      origenApi
    );
}

export const VideoPresentacion: React.FC<Props> = ({
  comercioId = 'com-118',
  videoUrl,
  nombreComercio = 'el comercio',
}) => {
  const theme = useTheme();

  const [urlFinal, setUrlFinal] = useState<string | null>(null);
  const [consultandoApi, setConsultandoApi] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [intentoConsulta, setIntentoConsulta] = useState(0);
  const [intentoWeb, setIntentoWeb] = useState(0);

  // Se crea inicialmente sin video porque la URL llega desde Axios.
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // PASO 1: Obtener el video real desde la API.
  useEffect(() => {
    let vigente = true;

    const consultarVideo = async () => {
      try {
        const respuesta = await axios.get<RespuestaComercioApi>(
          `${API_BASE_URL}/comercios/${encodeURIComponent(comercioId)}`,
          { timeout: 12000 }
        );

        if (!vigente) return;

        const urlApi = respuesta.data?.datos?.videoUrl;

        // El video de Docker tiene prioridad sobre cualquier video local.
        if (typeof urlApi === 'string' && urlApi.trim()) {
          setUrlFinal(adaptarUrlVideo(urlApi));
        } else {
          setUrlFinal(null);
        }

        setErrorCarga(false);
        setMensajeError(null);
      } catch {
        if (!vigente) return;

        // Respaldo opcional para pantallas que envían videoUrl.
        if (videoUrl?.trim()) {
          setUrlFinal(adaptarUrlVideo(videoUrl));
          setErrorCarga(false);
          setMensajeError(null);
        } else {
          setUrlFinal(null);
          setErrorCarga(true);
          setMensajeError(
            'No se pudo consultar el video del comercio en la API.'
          );
        }
      } finally {
        if (vigente) {
          setConsultandoApi(false);
        }
      }
    };

    void consultarVideo();

    return () => {
      vigente = false;
    };
  }, [comercioId, videoUrl, intentoConsulta]);

  // PASO 2: Escuchar el estado del reproductor nativo.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const suscripcion = player.addListener(
      'statusChange',
      ({ status, error }) => {
        if (status === 'loading') {
          setCargando(true);
          setErrorCarga(false);
          setMensajeError(null);
        } else if (status === 'readyToPlay') {
          setCargando(false);
          setErrorCarga(false);
          setMensajeError(null);
        } else if (status === 'error') {
          setCargando(false);
          setErrorCarga(true);
          setMensajeError(
            error?.message ||
              'Ocurrió un error al reproducir el video.'
          );
        }
      }
    );

    return () => {
      suscripcion.remove();
    };
  }, [player]);

  // PASO 3: Cuando Axios obtiene la URL, cargarla en expo-video.
  useEffect(() => {
    if (Platform.OS === 'web' || !urlFinal) return;

    let vigente = true;

    const cargarVideo = async () => {
      try {
        await player.replaceAsync(urlFinal);
      } catch {
        if (!vigente) return;

        setCargando(false);
        setErrorCarga(true);
        setMensajeError(
          'No se pudo cargar el video obtenido desde la API.'
        );
      }
    };

    void cargarVideo();

    return () => {
      vigente = false;
    };
  }, [player, urlFinal]);

  const reintentarCarga = async () => {
    setErrorCarga(false);
    setMensajeError(null);

    // Si falló la consulta, volver a pedir los datos a Docker.
    if (!urlFinal) {
      setConsultandoApi(true);
      setIntentoConsulta((actual) => actual + 1);
      return;
    }

    setCargando(true);

    if (Platform.OS === 'web') {
      // Recrear el elemento de video para que vuelva a cargar.
      setIntentoWeb((actual) => actual + 1);
      return;
    }

    try {
      await player.replaceAsync(urlFinal);
    } catch {
      setCargando(false);
      setErrorCarga(true);
      setMensajeError(
        'No se pudo reintentar la reproducción del video.'
      );
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.titulo, { color: theme.text }]}>
        Video de Presentacion
      </Text>

      <Text
        style={[
          styles.subtitulo,
          { color: theme.textSecondary },
        ]}>
        Conoce el comercio
      </Text>

      <View
        style={[
          styles.marcoVideo,
          { borderColor: theme.border },
        ]}>

        {consultandoApi ? (
          <View
            style={[
              styles.contenedorSinVideo,
              { backgroundColor: theme.backgroundElement },
            ]}>
            <ActivityIndicator
              size="large"
              color={theme.primary}
            />
            <Text
              style={[
                styles.textoSinVideo,
                {
                  color: theme.textSecondary,
                  marginTop: 10,
                },
              ]}>
              Consultando video en la API...
            </Text>
          </View>
        ) : !urlFinal ? (
          <View
            style={[
              styles.contenedorSinVideo,
              { backgroundColor: theme.backgroundElement },
            ]}>
            <Text
              style={[
                styles.textoSinVideo,
                { color: theme.textSecondary },
              ]}>
              {errorCarga
                ? 'No se pudo obtener el video del comercio.'
                : 'Este comercio aún no tiene un video de presentación configurado.'}
            </Text>
          </View>
        ) : Platform.OS === 'web' ? (
          <View style={styles.contenedorWeb}>
            <video
              key={`${urlFinal}-${intentoWeb}`}
              src={urlFinal}
              controls
              playsInline
              preload="metadata"
              onLoadStart={() => setCargando(true)}
              onCanPlay={() => {
                setCargando(false);
                setErrorCarga(false);
                setMensajeError(null);
              }}
              onError={() => {
                setCargando(false);
                setErrorCarga(true);
                setMensajeError(
                  'No se pudo reproducir el video en el navegador.'
                );
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#000000',
              }}
            />

            {cargando && !errorCarga && (
              <View style={styles.overlayCarga}>
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                />
                <Text style={styles.textoCargando}>
                  Cargando video...
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.contenedorNativo}>
            <VideoView
              style={styles.video}
              player={player}
              nativeControls={true}
              allowsPictureInPicture={true}
            />

            {cargando && !errorCarga && (
              <View style={styles.overlayCarga}>
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                />
                <Text style={styles.textoCargando}>
                  Cargando video...
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {errorCarga && (
        <View
          style={[
            styles.contenedorError,
            {
              backgroundColor: theme.errorBackground,
              borderColor: theme.border,
            },
          ]}>
          <Text
            style={[
              styles.textoError,
              { color: theme.error },
            ]}>
            {mensajeError || 'No se pudo reproducir el video.'}
          </Text>

          <TouchableOpacity
            style={[
              styles.botonReintentar,
              { backgroundColor: theme.forest },
            ]}
            onPress={() => void reintentarCarga()}>
            <Text
              style={[
                styles.textoBotonReintentar,
                { color: theme.onForest },
              ]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default VideoPresentacion;

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 13,
    marginBottom: 10,
    marginTop: 2,
  },
  marcoVideo: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  contenedorSinVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textoSinVideo: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contendorWeb: {
    width: '100%',
    height: '100%',
  },
  contenedorWeb: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  contenedorNativo: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlayCarga: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  textoCargando: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contenedorError: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  textoError: {
    fontSize: 13,
    flex: 1,
  },
  botonReintentar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  textoBotonReintentar: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
