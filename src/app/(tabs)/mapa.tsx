import { useLocalSearchParams } from 'expo-router';
import { MapaDirectorio } from '@/components/directorio/mapa-directorio';

export default function MapScreen() {
  const parametros = useLocalSearchParams<{ comercioId?: string | string[]; rubroId?: string | string[] }>();
  const comercioId = typeof parametros.comercioId === 'string' ? parametros.comercioId : parametros.comercioId?.[0];
  const rubroId = typeof parametros.rubroId === 'string' ? parametros.rubroId : parametros.rubroId?.[0];
  return <MapaDirectorio comercioId={comercioId} rubroId={rubroId} />;
}
