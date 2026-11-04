import { useAutenticacion } from '@/contextos/autenticacion';
import { obtenerPromociones } from '@/servicios/promociones';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

type PromocionType = {
  id: string;
  titulo?: string;
  descripcion?: string;
  descuento?: number;
  imagenUrl?: string;
  comercio?: {
    nombre: string;
    categoria?: string;
  };
};

export default function PromotionsScreen() {
  const { usuario } = useAutenticacion();
  const esComercio = usuario?.rol === 'comercio';

  const [promociones, setPromociones] = useState<PromocionType[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filtroActivo, setFiltroActivo] = useState<'vigentes' | 'proximas' | 'vencer'>('vigentes');
  const [promoSeleccionada, setPromoSeleccionada] = useState<PromocionType | null>(null);
  const [codigoUso, setCodigoUso] = useState<string | null>(null);
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
    // REGLA DEL PRD: Si es visitante anónimo, lo mandamos a iniciar sesión para obtener el código
    if (!usuario) {
      setPromoSeleccionada(null);
      router.push('/iniciar-sesion');
      return;
    }

    Vibration.vibrate(100);
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCodigoUso(`CCU-${aleatorio.slice(0, 4)}-${aleatorio.slice(4)}`);
  };

  const simularEscaneoQR = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    const codigoEjemplo = `CCU-PROMO-${Math.floor(1000 + Math.random() * 9000)}`;
    setCuponEscaneado(codigoEjemplo);

    setTimeout(() => {
      setCuponEscaneado(null);
    }, 3000);
  };

  if (esComercio) {
    return (
      <View style={styles.containerComercio}>
        <View style={styles.headerRow}>
          <Text style={styles.logoMarca}>Cercau<Text style={styles.logoPunto}>.</Text></Text>
        </View>
        <Text style={styles.titulo}>Panel de Validación</Text>
        <Text style={styles.subtitulo}>Simulador de escáner QR de cupones para el comercio.</Text>

        <TouchableOpacity style={styles.areaEscanerSimulado} onPress={simularEscaneoQR}>
          <Text style={styles.textoEscanerInstruccion}>📷 Tocar aquí para simular escaneo de QR</Text>
          <Text style={styles.textoEscanerSub}>El cliente presenta su código en pantalla</Text>
        </TouchableOpacity>

        {cuponEscaneado && (
          <View style={styles.resultadoBox}>
            <Text style={styles.textoResultado}>¡Cupón Validado con Éxito!</Text>
            <Text style={styles.codigoEscaneado}>{cuponEscaneado}</Text>
          </View>
        )}
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#e5e5e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.logoMarca}>Cercau<Text style={styles.logoPunto}>.</Text></Text>
      </View>

      <Text style={styles.titulo}>Promociones</Text>
      <Text style={styles.subtitulo}>Lo bueno de comprar cerca.</Text>
      
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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => {
              setPromoSeleccionada(item);
              setCodigoUso(null);
            }}
          >
            {item.imagenUrl && item.imagenUrl.startsWith('http') ? (
              <Image source={{ uri: item.imagenUrl }} style={styles.imagen} resizeMode="cover" />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Text style={styles.bannerEtiqueta}>
                  {item.descuento ? `✨ ${item.descuento}% DE DESCUENTO` : '🔥 PROMOCIÓN EXCLUSIVA'}
                </Text>
              </View>
            )}
            
            <View style={styles.contenidoCard}>
              <Text style={styles.comercioNombre}>
                {item.comercio?.nombre || 'Comercio local'}
              </Text>
              <Text style={styles.promoTitulo}>
                {item.titulo || item.descripcion}
              </Text>
              {item.descuento ? (
                <Text style={styles.descuentoText}>{item.descuento}% de descuento</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={promoSeleccionada !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPromoSeleccionada(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalComercio}>{promoSeleccionada?.comercio?.nombre || 'Comercio local'}</Text>
            <Text style={styles.modalTitulo}>{promoSeleccionada?.titulo || promoSeleccionada?.descripcion}</Text>
            
            {promoSeleccionada?.descuento && (
              <Text style={styles.modalDescuento}>{promoSeleccionada.descuento}% de Descuento</Text>
            )}

            {codigoUso ? (
              <View style={styles.cuponBox}>
                <Text style={styles.cuponLabel}>Tu código de uso:</Text>
                <Text style={styles.cuponTexto}>{codigoUso}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.botonGenerar} onPress={generarCodigo}>
                <Text style={styles.textoBotonGenerar}>
                  {usuario ? 'Generar Código de Uso' : 'Iniciar sesión para obtener código'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.botonCerrar} 
              onPress={() => setPromoSeleccionada(null)}
            >
              <Text style={styles.textoBotonCerrar}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#121c18' },
  containerComercio: { flex: 1, padding: 16, backgroundColor: '#121c18', justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 8 },
  logoMarca: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  logoPunto: { color: '#ff6b35' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  subtitulo: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  
  areaEscanerSimulado: { width: '100%', height: 260, backgroundColor: '#1a2e26', borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 20, borderWidth: 2, borderColor: '#2b5329', borderStyle: 'dashed' },
  textoEscanerInstruccion: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  textoEscanerSub: { color: '#9ca3af', fontSize: 13, textAlign: 'center' },
  resultadoBox: { marginTop: 20, backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
  textoResultado: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  codigoEscaneado: { color: '#fff', fontSize: 15, letterSpacing: 1 },

  contenedorFiltros: { flexDirection: 'row', marginBottom: 16 },
  chipFiltro: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#1a2e26', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#2b5329' },
  chipActivo: { backgroundColor: '#2b5329', borderColor: '#4ade80' },
  textoChip: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },
  textoChipActivo: { color: '#fff' },

  card: { 
    backgroundColor: '#1a2e26', 
    borderRadius: 16, 
    marginBottom: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#233d33',
  },
  imagen: { width: '100%', height: 150 },
  bannerPlaceholder: { 
    width: '100%', 
    height: 80, 
    backgroundColor: '#1f3a30', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2b5329',
  },
  bannerEtiqueta: { 
    color: '#4ade80', 
    fontSize: 14, 
    fontWeight: 'bold', 
    letterSpacing: 1,
    textAlign: 'center',
  },
  contenidoCard: { padding: 16 },
  comercioNombre: { fontSize: 12, color: '#4ade80', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  promoTitulo: { fontSize: 17, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  descuentoText: { fontSize: 13, color: '#fbbf24', fontWeight: '600' },

  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121c18' },
  error: { color: '#f87171', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a2e26', width: '100%', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#2b5329' },
  modalComercio: { fontSize: 13, color: '#4ade80', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#fff' },
  modalDescuento: { fontSize: 16, color: '#fbbf24', fontWeight: 'bold', marginBottom: 20 },
  botonGenerar: { backgroundColor: '#2b5329', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
  textoBotonGenerar: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cuponBox: { backgroundColor: '#121c18', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#4ade80', borderStyle: 'dashed' },
  cuponLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  cuponTexto: { fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  botonCerrar: { paddingVertical: 8, width: '100%', alignItems: 'center' },
  textoBotonCerrar: { color: '#9ca3af', fontSize: 15, fontWeight: '600' }
});