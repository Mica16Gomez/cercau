import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { IndicadorSesion } from '@/components/autenticacion/controles';
import { ProveedorAutenticacion, useAutenticacion } from '@/contextos/autenticacion';
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
        <Navegacion />
      </ProveedorAutenticacion>
    </ThemeProvider>
  );
}

function Navegacion() {
  const theme = useTheme();
  const { usuario, recuperandoSesion } = useAutenticacion();
  if (recuperandoSesion) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}><IndicadorSesion /></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Protected guard={!usuario}>
      <Stack.Screen name="iniciar-sesion" />
      <Stack.Screen name="seleccionar-rol" />
      <Stack.Screen name="registrarse" />
    </Stack.Protected>
    <Stack.Protected guard={!!usuario}>
      <Stack.Screen name="cuenta-creada" />
      <Stack.Screen name="editar-perfil" />
      <Stack.Screen name="favoritos" />
      <Stack.Screen name="ajustes-cuenta" />
      <Stack.Screen name="mis-resenas" />
    </Stack.Protected>
  </Stack>;
}
