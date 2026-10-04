import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

function subscribe(onStoreChange: () => void) {
  const subscription = Appearance.addChangeListener(onStoreChange);
  return () => subscription.remove();
}

function getSnapshot() {
  return Appearance.getColorScheme();
}

function getServerSnapshot() {
  // La página estática y su primera renderización comparten el mismo tema.
  return 'light';
}

export function useColorScheme() {
  // Mantiene todos los componentes sincronizados cuando cambia el tema web.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
