import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs style={[styles.container, { backgroundColor: theme.background }]}>
      <TabSlot style={styles.content} />
      <TabList asChild>
        <SafeAreaView edges={['bottom']} style={StyleSheet.flatten([styles.tabList, { borderColor: theme.border, backgroundColor: theme.backgroundElement }])}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={{ web: 'search' }}>Buscar</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon={{ web: 'sell' }}>Promociones</TabButton>
          </TabTrigger>
          <TabTrigger name="mapa" href="/mapa" asChild>
            <TabButton icon={{ web: 'map' }}>Mapa</TabButton>
          </TabTrigger>
          <TabTrigger name="mi-cuenta" href="/mi-cuenta" asChild>
            <TabButton icon={{ web: 'account_circle' }}>Mi cuenta</TabButton>
          </TabTrigger>
        </SafeAreaView>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: SymbolViewProps['name'] };

function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && { backgroundColor: theme.primarySoft },
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} tintColor={isFocused ? theme.primary : theme.textSecondary} size={22} />
      <ThemedText style={styles.tabLabel} themeColor={isFocused ? 'primary' : 'textSecondary'}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, minHeight: 0 },
  tabList: { flexDirection: 'row', borderTopWidth: 1, paddingHorizontal: 8, paddingVertical: 8, gap: 4 },
  tabButton: { flex: 1, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 16 },
  tabLabel: { fontSize: 11, lineHeight: 16, fontWeight: '600', textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
