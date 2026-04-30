import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/theme/colors';

export default function DashboardScreen() {
  const { profile } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Dashboard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Welcome back, {profile?.full_name || 'User'}!
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">🚀 App is Ready!</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Your TimberLog Pro foundation is set up and ready to build upon.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Company</Text>
            <Text variant="bodyLarge" style={styles.cardText}>
              {profile?.company_name}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Subscription Status</Text>
            <Text variant="bodyLarge" style={styles.cardText}>
              {profile?.subscription_status?.toUpperCase()}
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardText: {
    marginTop: spacing.sm,
  },
});