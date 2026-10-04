import { ComingSoonScreen } from '@/components/coming-soon-screen';

// Reutilizamos la ruta de la plantilla; su nombre visible ahora es Promociones.
export default function PromotionsScreen() {
  return <ComingSoonScreen title="Promociones" icon={{ ios: 'tag', android: 'sell', web: 'sell' }} />;
}
