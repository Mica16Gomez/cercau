import { obtenerPromociones } from '@/servicios/promociones';
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
  const [promociones, setPromociones] = useState<PromocionType[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para los filtros de vigencia requeridos
  const [filtroActivo, setFiltroActivo] = useState<'vigentes' | 'proximas' | 'vencer'>('vigentes');
  
  // Estados para detalle y cupón del vecino
  const [promoSeleccionada, setPromoSeleccionada] = useState<PromocionType | null>(null);
  const [codigoUso, setCodigoUso] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
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
  }, [filtroActivo]);

  const generarCodigo = () => {
    Vibration.vibrate(100);
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCodigoUso(`CCU-${aleatorio.slice(0, 4)}-${aleatorio.slice(4)}`);
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2b5329" />
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
      <Text style={styles.titulo}>Promociones</Text>
      <Text style={styles.subtitulo}>Lo bueno de comprar cerca.</Text>
      
      {/* Botones de filtro de vigencia */}
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
              <Image source={{ uri: item.imagenUrl }} style={styles.imagen} />
            ) : null}
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

      {/* Modal de Detalle y Cupón */}
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
                <Text style={styles.textoBotonGenerar}>Generar Código de Uso</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#fcf8f2' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 12 },
  contenedorFiltros: { flexDirection: 'row', marginBottom: 16 },
  chipFiltro: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#e5e7eb', borderRadius: 20, marginRight: 8 },
  chipActivo: { backgroundColor: '#2b5329' },
  textoChip: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  textoChipActivo: { color: '#fff' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 16, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imagen: { width: '100%', height: 140 },
  contenidoCard: { padding: 16 },
  comercioNombre: { fontSize: 13, color: '#2b5329', fontWeight: '600', marginBottom: 4 },
  promoTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 6 },
  descuentoText: { fontSize: 14, color: '#d97706', fontWeight: '600' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalComercio: { fontSize: 14, color: '#2b5329', fontWeight: '600', marginBottom: 8 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#1a1a1a' },
  modalDescuento: { fontSize: 16, color: '#d97706', fontWeight: 'bold', marginBottom: 20 },
  botonGenerar: { backgroundColor: '#2b5329', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
  textoBotonGenerar: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cuponBox: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  cuponLabel: { fontSize: 12, color: '#4b5563', marginBottom: 4 },
  cuponTexto: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', letterSpacing: 2 },
  botonCerrar: { paddingVertical: 8, width: '100%', alignItems: 'center' },
  textoBotonCerrar: { color: '#666', fontSize: 15, fontWeight: '600' }
});