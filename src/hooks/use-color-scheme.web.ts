import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// No necesitamos escuchar eventos: React detecta cuándo la página está lista.
function subscribe() {
  return () => undefined;
}

export function useColorScheme() {
  // La página estática empieza en claro; luego usa el tema del navegador.
  const hasHydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
