import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { RefAttributes } from 'react';
import { Pressable, StyleSheet, type ViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAutenticacion } from '@/contextos/autenticacion';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();
  const ruta = usePathname();
  const { usuario } = useAutenticacion();
  const referencia = ruta === '/' || (ruta === '/mi-cuenta' && !usuario);

  return (
    <Tabs style={[styles.container, { backgroundColor: theme.background }]}>
      <TabSlot style={styles.content} />
      <TabList asChild>
        <SafeAreaView edges={['bottom', 'left', 'right']} style={StyleSheet.flatten([styles.tabList, { borderColor: theme.border, backgroundColor: theme.tabBackground }])}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton referencia={referencia} icon={{ web: 'search' }}>Buscar</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton referencia={referencia} icon={{ web: 'sell' }}>Promociones</TabButton>
          </TabTrigger>
          <TabTrigger name="mapa" href="/mapa" asChild>
            <TabButton referencia={referencia} icon={{ web: 'map' }}>Mapa</TabButton>
          </TabTrigger>
          <TabTrigger name="mi-cuenta" href="/mi-cuenta" asChild>
            <TabButton referencia={referencia} icon={{ web: referencia ? 'person' : 'account_circle' }}>Mi cuenta</TabButton>
          </TabTrigger>
        </SafeAreaView>
      </TabList>
    </Tabs>
  );
}

// React Native 0.88 referencia la instancia de View, no el componente.
type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & RefAttributes<ViewInstance> & { icon: SymbolViewProps['name']; referencia: boolean };

function TabButton({ children, isFocused, icon, referencia, ...props }: TabButtonProps) {
  const theme = useTheme();
  const oscuro = useColorScheme() === 'dark';
  const color = referencia && !oscuro ? isFocused ? '#E65A14' : '#7C8494' : isFocused ? theme.actionText : theme.textSecondary;

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} tintColor={color} size={referencia ? 25 : 22} />
      <ThemedText style={[styles.tabLabel, referencia && styles.referenceLabel, isFocused && styles.selectedLabel, { color }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, minHeight: 0 },
  tabList: { flexDirection: 'row', borderTopWidth: 1, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  tabButton: { flex: 1, minHeight: 56, paddingVertical: 6, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 16 },
  tabLabel: { fontSize: 11, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
  selectedLabel: { fontWeight: '700' },
  referenceLabel: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
  pressed: { opacity: 0.65 },
});
