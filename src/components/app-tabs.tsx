import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { usePathname } from 'expo-router';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const colors = useTheme();
  const ruta = usePathname();
  const { usuario } = useAutenticacion();
  const oscuro = useColorScheme() === 'dark';
  const referencia = ruta === '/' || (ruta === '/mi-cuenta' && !usuario);
  const activo = referencia && !oscuro ? '#E65A14' : colors.actionText;
  const inactivo = referencia && !oscuro ? '#7C8494' : colors.textSecondary;

  return (
    <NativeTabs
      backgroundColor={colors.tabBackground}
      shadowColor={colors.border}
      tintColor={activo}
      indicatorColor={colors.terracottaSoft}
      iconColor={{ default: inactivo, selected: activo }}
      labelStyle={{ default: { color: inactivo, fontWeight: '500' }, selected: { color: activo, fontWeight: '700' } }}>
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Promociones</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tag" md="sell" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mapa" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Mapa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mi-cuenta" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Mi cuenta</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={referencia ? { default: 'person', selected: 'person.fill' } : 'person.crop.circle'} md={referencia ? 'person' : 'account_circle'} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
