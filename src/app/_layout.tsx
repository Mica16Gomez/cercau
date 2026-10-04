import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProveedorAutenticacion } from '@/contextos/autenticacion';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Los enlaces directos a un formulario también tienen los tabs como pantalla de regreso.
export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={{
      ...navigationTheme,
      colors: {
        ...navigationTheme.colors,
        primary: theme.primary,
        background: theme.background,
        card: theme.backgroundElement,
        text: theme.text,
        border: theme.border,
      },
    }}>
      <ProveedorAutenticacion>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="iniciar-sesion" />
          <Stack.Screen name="seleccionar-rol" />
          <Stack.Screen name="registrarse" />
        </Stack>
      </ProveedorAutenticacion>
    </ThemeProvider>
  );
}
