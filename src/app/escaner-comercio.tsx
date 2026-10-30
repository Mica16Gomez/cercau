import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

export default function PanelComercioScreen() {
  const [permisoCamara, solicitarPermisoCamara] = useCameraPermissions();
  const [escanerActivo, setEscanerActivo] = useState<boolean>(false);
  const [resultadoEscaneo, setResultadoEscaneo] = useState<string | null>(null);

  const manejarEscaneoQR = ({ data }: { data: string }) => {
    // Vibración diferenciada al validar el código con éxito
    Vibration.vibrate([0, 100, 50, 100]);
    setResultadoEscaneo(data);
    
    setTimeout(() => {
      setResultadoEscaneo(null);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Panel de Comercio</Text>
      <Text style={styles.subtitulo}>Validación de cupones mediante escáner QR.</Text>

      {!escanerActivo ? (
        <View style={styles.menuComercio}>
          <TouchableOpacity 
            style={styles.botonAbrirEscaner}
            onPress={async () => {
              if (!permisoCamara?.granted) {
                await solicitarPermisoCamara();
              }
              setEscanerActivo(true);
            }}
          >
            <Text style={styles.textoBotonEscaner}>Escanear Cupón de Vecino</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.camaraContenedor}>
          {permisoCamara?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={resultadoEscaneo ? undefined : manejarEscaneoQR}
            />
          ) : (
            <View style={styles.centrado}>
              <Text style={styles.textoPermiso}>Necesitamos permiso de cámara para validar los cupones.</Text>
              <Button title="Conceder permiso" onPress={solicitarPermisoCamara} />
            </View>
          )}

          {resultadoEscaneo && (
            <View style={styles.resultadoBox}>
              <Text style={styles.textoResultado}>¡Cupón Validado con Éxito!</Text>
              <Text style={styles.codigoEscaneado}>{resultadoEscaneo}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.botonCerrarEscaner} 
            onPress={() => setEscanerActivo(false)}
          >
            <Text style={styles.textoBotonCerrar}>Cerrar Cámara</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fcf8f2' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 20 },
  menuComercio: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  botonAbrirEscaner: { backgroundColor: '#2b5329', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center', width: '100%' },
  textoBotonEscaner: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  camaraContenedor: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  textoPermiso: { textAlign: 'center', marginBottom: 12, color: '#fff', fontSize: 15 },
  resultadoBox: { position: 'absolute', top: 40, alignSelf: 'center', backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', width: '85%', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  textoResultado: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  codigoEscaneado: { color: '#fff', fontSize: 15, letterSpacing: 1 },
  botonCerrarEscaner: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  textoBotonCerrar: { color: '#1f2937', fontSize: 15, fontWeight: '600' }
});