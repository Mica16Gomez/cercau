import { LogoCercau } from '@/components/logo-cercau';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useTheme } from '@/hooks/use-theme';
import { obtenerPromociones } from '@/servicios/promociones';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PromocionType = {
  id: string;
  titulo?: string;
  descripcion?: string;
  descuento?: number;
  imagenUrl?: string | null;
  comercio?: {
    nombre: string;
    categoria?: string;
  };
};

const fotosFallback = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
];

export default function PromotionsScreen() {
  const tema = useTheme();
  const { usuario } = useAutenticacion();
  const esComercio = usuario?.rol === 'comercio';

  const [promociones, setPromociones] = useState<PromocionType[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filtroActivo, setFiltroActivo] = useState<'vigentes' | 'proximas' | 'vencer'>('vigentes');
  const [promoSeleccionada, setPromoSeleccionada] = useState<PromocionType | null>(null);
  const [codigoUso, setCodigoUso] = useState<string | null>(null);
  
  const [permisoCamara, solicitarPermisoCamara] = useCameraPermissions();
  const [escaneandoReal, setEscanerActivo] = useState<boolean>(false);
  const [cuponEscaneado, setCuponEscaneado] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      if (esComercio) return;
      try {
        setCargando(true);
        setError(null);
        const data = await obtenerPromociones(filtroActivo);
        setPromociones(data);
      } catch (err) {
        setError('No se pudieron cargar las promociones.');
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [filtroActivo, esComercio]);

  const generarCodigo = () => {
    if (!usuario) {
      setPromoSeleccionada(null);
      router.push('/iniciar-sesion');
      return;
    }

    Vibration.vibrate(100);
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCodigoUso(`CCU-${aleatorio.slice(0, 4)}-${aleatorio.slice(4)}`);
  };

  const manejarEscaneoQR = ({ data }: { data: string }) => {
    if (data) {
      Vibration.vibrate([0, 100, 50, 100]);
      setCuponEscaneado(data);
      setEscanerActivo(false);
    }
  };

  if (esComercio) {
    if (!permisoCamara) {
      return <View style={styles.centrado}><ActivityIndicator size="large" color="#2b5329" /></View>;
    }

    if (!permisoCamara.granted) {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.background }]}>
          <View style={[styles.containerComercio, { backgroundColor: tema.background, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={[styles.titulo, { color: tema.text, textAlign: 'center' }]}>Permiso de Cámara Requerido</Text>
            <Text style={[styles.subtituloDinamico, { color: tema.text, textAlign: 'center', marginBottom: 20 }]}>
              Necesitamos acceso a la cámara para que el comercio pueda escanear los códigos QR de los clientes.
            </Text>
            <Button title="Conceder Permiso" onPress={solicitarPermisoCamara} color="#2b5329" />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.background }]} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={[styles.containerComercio, { backgroundColor: tema.background }]}>
          <View style={styles.headerRow}>
            <LogoCercau variante="claro" />
          </View>
          
          <View style={styles.infoPanelBox}>
            <Text style={[styles.titulo, { color: tema.text }]}>Panel de Comercio</Text>
            <Text style={[styles.subtituloDinamico, { color: tema.text, opacity: 0.7 }]}>
              Escáner activo con cámara nativa para validar cupones de clientes.
            </Text>

            {escaneandoReal ? (
              <View style={styles.camaraContenedorFijo}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  onBarcodeScanned={manejarEscaneoQR}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                <TouchableOpacity style={styles.botonCerrarCamara} onPress={() => setEscanerActivo(false)}>
                  <Text style={styles.textoBotonCerrarCamara}>✕ Cancelar Escaneo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.areaEscanerReal} onPress={() => setEscanerActivo(true)} activeOpacity={0.8}>
                <Text style={styles.iconoEscaner}>📷</Text>
                <Text style={styles.textoEscanerInstruccion}>Abrir Cámara para Escanear QR</Text>
                <Text style={styles.textoEscanerSub}>Tocar para iniciar la lectura del código del cliente</Text>
              </TouchableOpacity>
            )}

            {cuponEscaneado && (
              <View style={styles.resultadoBox}>
                <Text style={styles.textoResultado}>¡Cupón Validado con Éxito!</Text>
                <Text style={styles.codigoEscaneado}>{cuponEscaneado}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.background }]}>
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#2b5329" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.background }]}>
        <View style={styles.centrado}>
          <Text style={styles.error}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { backgroundColor: tema.background }]}>
        <View style={styles.headerRow}>
          <LogoCercau variante="claro" />
        </View>

        <Text style={[styles.titulo, { color: tema.text }]}>Promociones</Text>
        <Text style={[styles.subtituloDinamico, { color: tema.text, opacity: 0.7 }]}>Lo bueno de comprar cerca.</Text>
        
        <View style={styles.contenedorFiltros}>
          <TouchableOpacity 
            style={[styles.chipFiltro, filtroActivo === 'vigentes' && styles.chipActivo]}
            onPress={() => setFiltroActivo('vigentes')}
          >
            <Text style={[styles.textoChip, filtroActivo === 'vigentes' && styles.textoChipActivo]}>Vigentes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chipFiltro, filtroActivo === 'proximas' && styles.chipActivo]}
            onPress={() => setFiltroActivo('proximas')}
          >
            <Text style={[styles.textoChip, filtroActivo === 'proximas' && styles.textoChipActivo]}>Próximas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.chipFiltro, filtroActivo === 'vencer' && styles.chipActivo]}
            onPress={() => setFiltroActivo('vencer')}
          >
            <Text style={[styles.textoChip, filtroActivo === 'vencer' && styles.textoChipActivo]}>Por vencer</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={promociones}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item, index }) => {
            const imagenAMostrar = (item.imagenUrl && typeof item.imagenUrl === 'string' && item.imagenUrl.startsWith('http'))
              ? item.imagenUrl
              : fotosFallback[index % fotosFallback.length];

            return (
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]} 
                onPress={() => {
                  setPromoSeleccionada(item);
                  setCodigoUso(null);
                }}
              >
                <Image source={{ uri: imagenAMostrar }} style={styles.imagen} resizeMode="cover" />
                
                <View style={styles.contenidoCard}>
                  <Text style={styles.comercioNombre}>
                    {item.comercio?.nombre || 'Comercio local'}
                  </Text>
                  <Text style={[styles.promoTitulo, { color: '#1a1a1a' }]}>
                    {item.titulo || item.descripcion}
                  </Text>
                  {item.descuento ? (
                    <Text style={styles.descuentoText}>{item.descuento}% de descuento</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <Modal
          visible={promoSeleccionada !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPromoSeleccionada(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#fff' }]}>
              <Text style={styles.modalComercio}>{promoSeleccionada?.comercio?.nombre || 'Comercio local'}</Text>
              <Text style={[styles.modalTitulo, { color: '#1a1a1a' }]}>{promoSeleccionada?.titulo || promoSeleccionada?.descripcion}</Text>
              
              {promoSeleccionada?.descuento && (
                <Text style={styles.modalDescuento}>{promoSeleccionada.descuento}% de Descuento</Text>
              )}

              {codigoUso ? (
                <View style={styles.cuponBox}>
                  <Text style={styles.cuponLabel}>Presentá este código QR en el comercio:</Text>
                  <Image 
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${codigoUso}` }} 
                    style={styles.imagenQr} 
                  />
                  <Text style={styles.cuponTexto}>{codigoUso}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.botonGenerar} onPress={generarCodigo}>
                  <Text style={styles.textoBotonGenerar}>
                    {usuario ? 'Generar Código QR' : 'Iniciar sesión para obtener código'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.botonCerrar} 
                onPress={() => setPromoSeleccionada(null)}
              >
                <Text style={[styles.textoBotonCerrar, { color: '#1a1a1a' }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  containerComercio: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24, alignItems: 'flex-start' },
  infoPanelBox: { width: '100%', marginTop: 8 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8, alignSelf: 'flex-start' },
  
  titulo: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  subtituloDinamico: { fontSize: 13, marginBottom: 20 },
  
  areaEscanerReal: { width: '100%', backgroundColor: '#2b5329', borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 28, elevation: 4 },
  camaraContenedorFijo: { width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', position: 'relative', marginTop: 8 },
  botonCerrarCamara: { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  textoBotonCerrarCamara: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  iconoEscaner: { fontSize: 32, marginBottom: 8 },
  textoEscanerInstruccion: { color: '#fff', fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  textoEscanerSub: { color: '#d1d5db', fontSize: 13, textAlign: 'center' },
  resultadoBox: { marginTop: 20, backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
  textoResultado: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  codigoEscaneado: { color: '#fff', fontSize: 15, letterSpacing: 1 },

  contenedorFiltros: { flexDirection: 'row', marginBottom: 16 },
  chipFiltro: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#e5e7eb', borderRadius: 20, marginRight: 8 },
  chipActivo: { backgroundColor: '#2b5329' },
  textoChip: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  textoChipActivo: { color: '#fff' },

  card: { 
    borderRadius: 16, 
    marginBottom: 16, 
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  imagen: { width: '100%', height: 160 },
  contenidoCard: { padding: 16 },
  comercioNombre: { fontSize: 12, color: '#2b5329', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  promoTitulo: { fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
  descuentoText: { fontSize: 13, color: '#d97706', fontWeight: '600' },

  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalComercio: { fontSize: 13, color: '#2b5329', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  modalDescuento: { fontSize: 16, color: '#d97706', fontWeight: 'bold', marginBottom: 20 },
  botonGenerar: { backgroundColor: '#2b5329', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
  textoBotonGenerar: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cuponBox: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  cuponLabel: { fontSize: 12, color: '#4b5563', marginBottom: 6, textAlign: 'center' },
  imagenQr: { width: 150, height: 150, marginVertical: 8, borderRadius: 8 },
  cuponTexto: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5, color: '#1f2937', marginTop: 4 },
  botonCerrar: { paddingVertical: 8, width: '100%', alignItems: 'center' },
  textoBotonCerrar: { fontSize: 15, fontWeight: '600' }
});