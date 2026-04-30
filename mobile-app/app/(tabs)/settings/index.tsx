import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/theme/colors';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Profile</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Name: {profile?.full_name}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Username: {profile?.username}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Company: {profile?.company_name}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Subscription</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Status: {profile?.subscription_status?.toUpperCase()}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Plan: {profile?.subscription_plan?.toUpperCase()}
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={colors.error}
        >
          Logout
        </Button>
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
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  infoText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});