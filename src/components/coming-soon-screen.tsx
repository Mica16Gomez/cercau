import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ComingSoonScreenProps = {
  title: string;
  icon: SymbolViewProps['name'];
};

export function ComingSoonScreen({ title, icon }: ComingSoonScreenProps) {
  const theme = useTheme();

  return (
    // En iPhone, NativeTabs ajusta los márgenes del ScrollView automáticamente.
    <SafeAreaView edges={Platform.OS === 'ios' ? [] : ['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
          <SymbolView name={icon} tintColor={theme.primary} size={36} />
        </View>
        <ThemedText accessibilityRole="header" style={styles.title}>{title}</ThemedText>
        <ThemedText themeColor="textSecondary">Próximamente</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  icon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700', textAlign: 'center' },
});
