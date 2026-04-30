import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '@/theme/colors';

export default function PurchasesScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Purchases</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Feature coming soon...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});