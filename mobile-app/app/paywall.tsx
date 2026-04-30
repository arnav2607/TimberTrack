import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Text, Card, Button, IconButton, ActivityIndicator, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { useAuth, useSubscription } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { getOfferings, purchasePackage, restorePurchases, hasActiveEntitlement } from '@/services/revenuecat';
import { colors, spacing } from '@/theme/colors';
import { track } from '@/services/analytics';

const FEATURES = [
  { icon: 'infinity', label: 'Unlimited BLs & Containers' },
  { icon: 'file-excel', label: 'Excel / Deal Sheet Export' },
  { icon: 'cloud-sync', label: 'Auto Cloud Sync' },
  { icon: 'chart-box', label: 'Advanced Dashboard & Filters' },
  { icon: 'shield-check', label: 'Priority Support' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const subscription = useSubscription();
  const { loadProfile } = useAuthStore();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const o = await getOfferings();
      setOffering(o);
      setLoadingOfferings(false);
    })();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo && hasActiveEntitlement(customerInfo, 'pro')) {
        track('subscription_started', { plan: pkg.identifier });
        Alert.alert('Welcome to Pro!', 'Your subscription is now active.');
        // Refresh profile from server (will be updated by webhook)
        await loadProfile();
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Purchase failed', e.message || 'Try again later');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setPurchasing('restore');
    try {
      const info = await restorePurchases();
      if (info && hasActiveEntitlement(info, 'pro')) {
        Alert.alert('Restored!', 'Your Pro subscription is active.');
        await loadProfile();
        router.back();
      } else {
        Alert.alert('No active subscription found', 'Make sure you are logged in to the same account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="close" iconColor={colors.textInverse} size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>Upgrade to Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <MaterialCommunityIcons name="crown" size={56} color={colors.accent} />
          <Text variant="headlineMedium" style={styles.heroTitle}>TimberLog Pro</Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Unlock the full power of timber tracking
          </Text>
          {subscription.isTrial && (
            <View style={styles.trialBanner}>
              <Text variant="bodyMedium" style={styles.trialText}>
                Free Trial: {subscription.daysRemaining} days remaining
              </Text>
            </View>
          )}
        </View>

        <Card style={styles.featuresCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.featuresTitle}>What's Included</Text>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <MaterialCommunityIcons name={f.icon as any} size={22} color={colors.success} />
                <Text variant="bodyMedium" style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.plansTitle}>Choose Your Plan</Text>

        {loadingOfferings ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : !offering ? (
          <Card style={styles.fallbackCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.fallbackText}>
                Subscriptions are not yet configured. Please contact support to upgrade.
              </Text>
              <Button
                mode="outlined"
                onPress={() => Linking.openURL('mailto:support@timberlogpro.com')}
                style={{ marginTop: spacing.md }}
              >
                Contact Support
              </Button>
            </Card.Content>
          </Card>
        ) : (
          offering.availablePackages.map((pkg) => {
            const isPurchasing = purchasing === pkg.identifier;
            const isYearly = pkg.identifier.toLowerCase().includes('annual') || pkg.identifier.toLowerCase().includes('year');
            return (
              <Card key={pkg.identifier} style={[styles.planCard, isYearly && styles.planCardHighlight]}>
                <Card.Content>
                  {isYearly && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text variant="titleLarge" style={styles.planTitle}>
                    {pkg.product.title}
                  </Text>
                  <Text variant="headlineMedium" style={styles.planPrice}>
                    {pkg.product.priceString}
                  </Text>
                  <Text variant="bodySmall" style={styles.planDescription}>
                    {pkg.product.description}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => handlePurchase(pkg)}
                    loading={isPurchasing}
                    disabled={!!purchasing}
                    style={styles.purchaseBtn}
                    buttonColor={isYearly ? colors.accent : colors.primary}
                  >
                    Subscribe Now
                  </Button>
                </Card.Content>
              </Card>
            );
          })
        )}

        <Divider style={{ marginVertical: spacing.lg }} />

        <Button
          mode="text"
          onPress={handleRestore}
          loading={purchasing === 'restore'}
          disabled={!!purchasing}
        >
          Restore Purchases
        </Button>

        <Text variant="bodySmall" style={styles.disclaimer}>
          Subscriptions auto-renew unless cancelled. Manage in your store account settings.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
  },
  headerTitle: { color: colors.textInverse, fontWeight: 'bold' },
  content: { flex: 1, padding: spacing.md },
  heroSection: { alignItems: 'center', paddingVertical: spacing.lg },
  heroTitle: { fontWeight: 'bold', color: colors.primary, marginTop: spacing.sm },
  heroSubtitle: { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  trialBanner: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  trialText: { color: colors.warning, fontWeight: 'bold' },
  featuresCard: { marginVertical: spacing.md, elevation: 2 },
  featuresTitle: { fontWeight: 'bold', marginBottom: spacing.md, color: colors.primary },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  featureText: { color: colors.textPrimary, flex: 1 },
  plansTitle: { fontWeight: 'bold', color: colors.textPrimary, marginVertical: spacing.md },
  planCard: { marginBottom: spacing.md, elevation: 2 },
  planCardHighlight: {
    borderWidth: 2,
    borderColor: colors.accent,
    elevation: 4,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: { color: colors.textInverse, fontSize: 10, fontWeight: 'bold' },
  planTitle: { fontWeight: 'bold', color: colors.textPrimary },
  planPrice: { fontWeight: 'bold', color: colors.primary, marginVertical: spacing.xs },
  planDescription: { color: colors.textSecondary, marginBottom: spacing.md },
  purchaseBtn: { marginTop: spacing.sm, height: 48, justifyContent: 'center' },
  fallbackCard: { backgroundColor: colors.surfaceVariant },
  fallbackText: { color: colors.textPrimary, textAlign: 'center' },
  disclaimer: { color: colors.textTertiary, textAlign: 'center', marginVertical: spacing.md },
});
