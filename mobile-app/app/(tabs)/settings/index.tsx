import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Text, Button, Card, IconButton, Chip, Divider, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth, useSubscription } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { logoutRevenueCat } from '@/services/revenuecat';
import { reset as resetAnalytics } from '@/services/analytics';
import { colors, spacing } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const subscription = useSubscription();
  const { sync, syncing, lastSyncAt } = useSync();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Sign out?',
      'You will need to log in again to access your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await logoutRevenueCat();
            resetAnalytics();
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    const result = await sync();
    if (result) {
      Alert.alert(
        'Sync Complete',
        `Pushed: ${result.pushed} • Pulled: ${result.pulled}${result.errors.length ? `\n\nErrors:\n${result.errors.slice(0, 3).join('\n')}` : ''}`
      );
    }
  };

  const statusChipColor = subscription.isActive
    ? subscription.isTrial
      ? { bg: colors.warningLight, text: colors.warning }
      : { bg: colors.successLight, text: colors.success }
    : { bg: colors.errorLight, text: colors.error };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Settings</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>{profile?.full_name}</Text>
      </View>

      <View style={styles.content}>
        {/* Profile */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-circle" size={24} color={colors.primary} />
              <Text variant="titleMedium" style={styles.cardTitle}>Profile</Text>
            </View>
            <InfoRow label="Name" value={profile?.full_name || '-'} />
            <InfoRow label="Username" value={profile?.username || '-'} />
            <InfoRow label="Company" value={profile?.company_name || '-'} />
          </Card.Content>
        </Card>

        {/* Subscription */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="crown" size={24} color={colors.accent} />
              <Text variant="titleMedium" style={styles.cardTitle}>Subscription</Text>
            </View>

            <View style={styles.subRow}>
              <Text variant="bodyMedium" style={styles.subLabel}>Status</Text>
              <Chip
                style={{ backgroundColor: statusChipColor.bg }}
                textStyle={{ color: statusChipColor.text, fontWeight: 'bold', fontSize: 12 }}
              >
                {(subscription.subscriptionStatus || 'free').toUpperCase()}
              </Chip>
            </View>
            <View style={styles.subRow}>
              <Text variant="bodyMedium" style={styles.subLabel}>Plan</Text>
              <Text variant="bodyMedium" style={styles.subValue}>
                {(subscription.subscriptionPlan || 'free').toUpperCase()}
              </Text>
            </View>
            {subscription.isTrial && (
              <View style={styles.subRow}>
                <Text variant="bodyMedium" style={styles.subLabel}>Trial Ends</Text>
                <Text variant="bodyMedium" style={[styles.subValue, { color: colors.warning, fontWeight: 'bold' }]}>
                  {subscription.daysRemaining} days
                </Text>
              </View>
            )}

            {!subscription.isActive || subscription.isTrial ? (
              <Button
                mode="contained"
                buttonColor={colors.accent}
                onPress={() => router.push('/paywall')}
                style={styles.upgradeBtn}
                icon="crown"
              >
                {subscription.isTrial ? 'Upgrade to Pro' : 'Subscribe Now'}
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}
                style={styles.upgradeBtn}
                icon="cog"
              >
                Manage Subscription
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Sync */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cloud-sync" size={24} color={colors.info} />
              <Text variant="titleMedium" style={styles.cardTitle}>Cloud Sync</Text>
            </View>
            <Text variant="bodySmall" style={styles.syncInfo}>
              {lastSyncAt ? `Last sync: ${new Date(lastSyncAt).toLocaleString()}` : 'Never synced'}
            </Text>
            <Button
              mode="contained"
              onPress={handleSync}
              loading={syncing}
              disabled={syncing}
              style={styles.syncBtn}
              icon="sync"
            >
              Sync Now
            </Button>
          </Card.Content>
        </Card>

        {/* About / Legal */}
        <Card style={styles.card}>
          <Card.Content style={{ paddingHorizontal: 0 }}>
            <List.Item
              title="Help & Support"
              description="FAQ, contact, feedback"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('mailto:support@timberlogpro.com')}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('https://timberlogpro.com/privacy')}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('https://timberlogpro.com/terms')}
            />
            <Divider />
            <List.Item
              title="App Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutBtn}
          buttonColor={colors.error}
          icon="logout"
        >
          Sign Out
        </Button>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodyMedium" style={styles.infoLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, backgroundColor: colors.primary },
  title: { color: colors.textInverse, fontWeight: 'bold' },
  subtitle: { color: colors.textInverse, opacity: 0.85, marginTop: 2 },
  content: { padding: spacing.md },
  card: { marginBottom: spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontWeight: 'bold', color: colors.textPrimary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  infoLabel: { color: colors.textSecondary },
  infoValue: { color: colors.textPrimary, fontWeight: '600' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  subLabel: { color: colors.textSecondary },
  subValue: { color: colors.textPrimary, fontWeight: '600' },
  upgradeBtn: { marginTop: spacing.md },
  syncInfo: { color: colors.textSecondary, marginBottom: spacing.sm },
  syncBtn: { marginTop: spacing.xs },
  logoutBtn: { marginTop: spacing.lg },
});
