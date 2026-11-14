import axios, { isAxiosError } from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import {
  guardarFotosApiEnCache,
  obtenerFotosOffline,
  quitarFotoApiDeCache
} from '../../servicios/persistencia-fotos';

interface Props {
  comercioId: string;
  nombreComercio?: string;
  tokenSesion?: string | null;
  puedeEditar?: boolean;
}

interface ComercioApi {
  datos: { imagenes?: string[] | null };
}

interface ArchivoSubidoApi {
  datos: { url: string };
}

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');
const MAX_FOTOS = 8;
const MAX_BYTES = 5 * 1024 * 1024;

// Las URLs que entrega Docker pueden contener localhost; en el iPhone usamos la IP del .env.
const adaptarUrlImagen = (url: string): string => {
  const origenApi = API_BASE_URL.match(/^https?:\/\/[^/]+/i)?.[0] ?? API_BASE_URL;
  return url.replace(
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/|$)/i,
    origenApi
  );
};

const esRutaLocal = (url: string): boolean =>
  url.startsWith('file://') || url.startsWith('content://');

export const GaleriaComercio: React.FC<Props> = ({
  comercioId,
  nombreComercio = 'el comercio',
  tokenSesion,
  puedeEditar = false,
}) => {
  const theme = useTheme();
  // En línea: URLs oficiales. Sin conexión: rutas de archivos guardados en el dispositivo.
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotosOffline, setFotosOffline] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoSeleccionadaModal, setFotoSeleccionadaModal] = useState<string | null>(null);
  const [mostrandoOffline, setMostrandoOffline] = useState(false);
  const autorizadoParaEditar = puedeEditar && Boolean(tokenSesion);

  const resolverFoto = (uri: string): string => {
    if (esRutaLocal(uri)) return uri;
    const nombre = uri.split('?')[0].split('/').pop();
    const copiaLocal = fotosOffline.find(
      (local) => Boolean(nombre) && local.endsWith(`_${nombre}`)
    );
    return copiaLocal ?? adaptarUrlImagen(uri);
  };

  const cargarFotos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await axios.get<ComercioApi>(
        `${API_BASE_URL}/comercios/${encodeURIComponent(comercioId)}`,
        { timeout: 12000 }
      );
      const listaApi = respuesta.data?.datos?.imagenes;
      const urls = Array.isArray(listaApi)
        ? listaApi.filter((url): url is string => typeof url === 'string' && url.length > 0)
        : [];
      setFotos(urls);
      setMostrandoOffline(false);

      // Guardamos copias físicas + sus rutas SQLite. Si falla la caché, la API sigue funcionando.
      try {
        await guardarFotosApiEnCache(comercioId, urls.map(adaptarUrlImagen));
        setFotosOffline(await obtenerFotosOffline(comercioId));
      } catch (errorCache) {
        console.warn('No se pudo actualizar la caché de fotografías:', errorCache);
        setFotosOffline(await obtenerFotosOffline(comercioId));
      }
    } catch (err) {
      console.warn('API de fotografías no disponible, usando SQLite:', err);
      try {
        const locales = await obtenerFotosOffline(comercioId);
        setFotosOffline(locales);
        setFotos(locales);
        setMostrandoOffline(true);
        if (locales.length === 0) {
          setError('No hay conexión con Docker ni fotografías guardadas en el celular.');
        }
      } catch {
        setFotos([]);
        setError('No se pudieron recuperar las fotografías locales.');
      }
    } finally {
      setCargando(false);
    }
  }, [comercioId]);

  useEffect(() => {
  let activo = true;

  Promise.resolve().then(() => {
    if (activo) {
      void cargarFotos();
    }
  });

  return () => {
    activo = false;
  };
 }, [cargarFotos]);


  const verificarConexion = async (): Promise<boolean> => {
    const red = await Network.getNetworkStateAsync();
    return Boolean(red.isConnected && red.isInternetReachable !== false);
  };

  const actualizarImagenesApi = async (imagenes: string[], token: string) => {
    await axios.patch(
      `${API_BASE_URL}/mi-comercio`,
      { imagenes },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
  };

  const seleccionarYGuardarFoto = async () => {
    if (!autorizadoParaEditar || !tokenSesion) {
      Alert.alert('Acceso restringido', 'Solo el dueño autenticado puede agregar fotografías.');
      return;
    }
    if (fotos.length >= MAX_FOTOS && !mostrandoOffline) {
      Alert.alert('Límite alcanzado', 'El comercio puede tener hasta 8 fotografías.');
      return;
    }
    try {
      if (!(await verificarConexion())) {
        Alert.alert('Sin conexión', 'Para subir una foto necesitás conexión con Docker. Las fotos guardadas siguen disponibles para ver.');
        return;
      }
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para seleccionar una fotografía.');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
      });
      if (resultado.canceled || !resultado.assets.length) return;
      const foto = resultado.assets[0];
      if (foto.fileSize && foto.fileSize > MAX_BYTES) {
        Alert.alert('Imagen demasiado grande', 'La API permite imágenes de hasta 5 MB.');
        return;
      }
      const mimeType = foto.mimeType || (foto.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        Alert.alert('Formato no admitido', 'Seleccioná una imagen JPG, PNG o WEBP.');
        return;
      }
      setGuardando(true);
      // Se vuelve a consultar antes de PATCH porque PATCH reemplaza toda la lista.
      const consulta = await axios.get<ComercioApi>(
        `${API_BASE_URL}/comercios/${encodeURIComponent(comercioId)}`,
        { timeout: 12000 }
      );
      const imagenesActuales = consulta.data?.datos?.imagenes ?? [];
      if (imagenesActuales.length >= MAX_FOTOS) {
        Alert.alert('Límite alcanzado', 'El comercio ya tiene 8 fotografías.');
        return;
      }
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const formData = new FormData();
      formData.append('archivo', {
        uri: foto.uri,
        name: `comercio-${Date.now()}.${extension}`,
        type: mimeType,
      } as unknown as Blob);
      const subida = await axios.post<ArchivoSubidoApi>(
        `${API_BASE_URL}/archivos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenSesion}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );
      const nuevaUrl = subida.data?.datos?.url;
      if (!nuevaUrl) throw new Error('La API no devolvió la URL de la fotografía.');
      await actualizarImagenesApi([...imagenesActuales, nuevaUrl], tokenSesion);
      await cargarFotos();
      Alert.alert('Fotografía agregada', 'La imagen se subió a Docker y quedó asociada al comercio.');
    } catch (err) {
      console.error('Error subiendo fotografía:', err);
      const mensaje = isAxiosError(err)
        ? (err.response?.data as { error?: { mensaje?: string } } | undefined)?.error?.mensaje
        : null;
      Alert.alert('Error al guardar', mensaje || 'No se pudo subir la fotografía. Revisá la conexión con Docker.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarFoto = (url: string) => {
    if (!autorizadoParaEditar || !tokenSesion) return;
    if (esRutaLocal(url)) {
      Alert.alert('Foto local', 'Esta copia offline no se puede eliminar de Docker sin conexión.');
      return;
    }
    Alert.alert('Eliminar fotografía', '¿Querés quitar esta foto de la ficha del comercio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setGuardando(true);
              if (!(await verificarConexion())) {
                Alert.alert('Sin conexión', 'Para eliminar una fotografía del comercio necesitás conexión con Docker.');
                return;
              }
              const consulta = await axios.get<ComercioApi>(
                `${API_BASE_URL}/comercios/${encodeURIComponent(comercioId)}`
              );
              const actuales = consulta.data?.datos?.imagenes ?? [];
              await actualizarImagenesApi(actuales.filter((item) => item !== url), tokenSesion);
              try {
                await quitarFotoApiDeCache(comercioId, url);
              } catch (errorCache) {
                console.warn('No se pudo limpiar la copia offline:', errorCache);
              }
              setFotoSeleccionadaModal(null);
              await cargarFotos();
              Alert.alert('Fotografía eliminada', 'Se quitó de la ficha del comercio.');
            } catch (err) {
              console.error('Error eliminando fotografía:', err);
              Alert.alert('Error', 'No se pudo quitar la fotografía de la ficha.');
            } finally {
              setGuardando(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <View style={styles.columnaTitulo}>
          <Text style={[styles.titulo, { color: theme.text }]}>Fotografías</Text>
          <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>Imagenes del Comercio</Text>
        </View>
        {autorizadoParaEditar && (
          <TouchableOpacity
            disabled={guardando || cargando}
            style={[styles.botonCargar, { backgroundColor: theme.forest, opacity: guardando || cargando ? 0.6 : 1 }]}
            onPress={() => void seleccionarYGuardarFoto()}>
            <Text style={[styles.textoBotonCargar, { color: theme.onForest }]}>
              {guardando ? 'Subiendo...' : '+ Cargar foto'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {mostrandoOffline && !cargando && fotos.length > 0 && (
        <Text style={[styles.textoEstado, { color: theme.textSecondary, marginBottom: 8 }]}>
          Mostrando fotografías guardadas en este dispositivo (sin conexión).
        </Text>
      )}

      {cargando ? (
        <View style={styles.contenedorCarga}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.textoEstado, { color: theme.textSecondary }]}>Cargando fotografías...</Text>
        </View>
      ) : error ? (
        <View style={[styles.contenedorError, { backgroundColor: theme.errorBackground, borderColor: theme.border }]}>
          <Text style={[styles.textoError, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.botonReintentar, { backgroundColor: theme.forest }]}
            onPress={() => void cargarFotos()}>
            <Text style={[styles.textoBotonCargar, { color: theme.onForest }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : fotos.length > 0 ? (
        <View style={styles.galeriaGrid}>
          {fotos.map((url, index) => (
            <TouchableOpacity
              key={`${url}-${index}`}
              activeOpacity={0.8}
              onPress={() => setFotoSeleccionadaModal(url)}>
              <Image
                source={{ uri: resolverFoto(url) }}
                style={[styles.fotoGrid, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.contenedorVacio, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.textoVacio, { color: theme.textSecondary }]}>Este comercio aún no tiene fotografías.</Text>
        </View>
      )}

      {fotoSeleccionadaModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setFotoSeleccionadaModal(null)}>
          <View style={[styles.modalFondo, { backgroundColor: theme.overlay }]}>
            <View style={[styles.modalContenedor, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Image
                source={{ uri: resolverFoto(fotoSeleccionadaModal) }}
                style={styles.fotoModalVista}
                resizeMode="contain"
              />
              <View style={styles.modalBotonesFila}>
                {autorizadoParaEditar && !mostrandoOffline && (
                  <TouchableOpacity
                    disabled={guardando}
                    style={[styles.modalBotonEliminar, { backgroundColor: theme.error }]}
                    onPress={() => confirmarEliminarFoto(fotoSeleccionadaModal)}>
                    <Text style={styles.textoBotonBlanco}>Eliminar foto</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalBotonCerrar, { backgroundColor: theme.forest }]}
                  onPress={() => setFotoSeleccionadaModal(null)}>
                  <Text style={[styles.textoBotonBlanco, { color: theme.onForest }]}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default GaleriaComercio;

const styles = StyleSheet.create({
  contenedor: { marginBottom: 20 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  columnaTitulo: { flex: 1 },
  titulo: { fontSize: 18, fontWeight: 'bold' },
  subtitulo: { fontSize: 13, marginTop: 2 },
  botonCargar: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  textoBotonCargar: { fontWeight: 'bold', fontSize: 13 },
  contenedorCarga: { paddingVertical: 16, alignItems: 'center', gap: 6 },
  textoEstado: { fontSize: 13 },
  contenedorError: { padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', gap: 8 },
  textoError: { fontSize: 13, textAlign: 'center' },
  botonReintentar: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 },
  contenedorVacio: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  textoVacio: { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
  galeriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoGrid: { width: 100, height: 100, borderRadius: 10, borderWidth: 1 },
  modalFondo: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContenedor: { width: '100%', maxWidth: 360, borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 14 },
  fotoModalVista: { width: '100%', height: 240, borderRadius: 10 },
  modalBotonesFila: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10 },
  modalBotonEliminar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flex: 1, alignItems: 'center' },
  modalBotonCerrar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flex: 1, alignItems: 'center' },
  textoBotonBlanco: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
});
