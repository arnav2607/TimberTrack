import { useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, IconButton, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { colors, spacing } from '@/theme/colors';
import { formatDate, formatNumber } from '@/utils/calculations';

export default function PurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { purchases, deletePurchase, loadPurchases } = usePurchasesStore();

  const purchase: any = useMemo(() => purchases.find((p: any) => p.id === id), [purchases, id]);

  useEffect(() => {
    if (purchases.length === 0) loadPurchases();
  }, []);

  const containers = purchase?.containers || [];
  const completed = containers.filter((c: any) => c.isLoadingComplete).length;
  const total = containers.length;
  const totalCbmGross = containers.reduce((s: number, c: any) => s + (c.cbmGross || 0), 0);
  const totalCbmNet = containers.reduce((s: number, c: any) => s + (c.cbmNet || 0), 0);
  const totalPcs = containers.reduce((s: number, c: any) => s + (c.pcsSupplier || 0), 0);

  const handleDelete = () => {
    Alert.alert(
      'Delete Purchase',
      `Are you sure you want to delete BL ${purchase?.blNumber}? This will remove all containers and measurements.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePurchase(id as string);
              router.back();
            } catch (e: any) {
              Alert.alert('Failed', e.message || 'Could not delete');
            }
          },
        },
      ]
    );
  };

  if (!purchase) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={colors.textInverse} size={24} onPress={() => router.back()} />
          <Text variant="titleLarge" style={styles.headerTitle}>Purchase</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <Text>Purchase not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.textInverse} size={24} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={styles.headerTitle}>{purchase.blNumber}</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>{purchase.supplierName}</Text>
        </View>
        <IconButton
          icon="delete-outline"
          iconColor={colors.textInverse}
          size={24}
          onPress={handleDelete}
        />
      </View>

      <ScrollView style={styles.content}>
        {/* BL Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Bill of Lading Details</Text>

            <DetailRow icon="calendar" label="BL Date" value={formatDate(purchase.blDate)} />
            <DetailRow icon="office-building" label="Supplier" value={purchase.supplierName} />
            <DetailRow icon="earth" label="Country" value={purchase.country} />
            <DetailRow
              icon="sync"
              label="Sync Status"
              value={purchase.localStatus === 'synced' ? 'Synced' : 'Pending'}
              valueColor={purchase.localStatus === 'synced' ? colors.success : colors.warning}
            />
            {purchase.remarks ? (
              <View style={styles.remarks}>
                <Text variant="bodySmall" style={styles.remarksLabel}>Remarks</Text>
                <Text variant="bodyMedium" style={styles.remarksText}>{purchase.remarks}</Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>

        {/* Aggregate Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Totals</Text>
            <View style={styles.statsGrid}>
              <Stat label="Containers" value={`${completed}/${total}`} color={colors.primary} />
              <Stat label="CBM Gross" value={formatNumber(totalCbmGross, 2)} color={colors.info} />
              <Stat label="CBM Net" value={formatNumber(totalCbmNet, 2)} color={colors.success} />
              <Stat label="Total Pcs" value={totalPcs.toString()} color={colors.warning} />
            </View>
          </Card.Content>
        </Card>

        {/* Container List */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Containers ({total})</Text>

        {containers.map((c: any) => {
          const statusColor = c.isLoadingComplete ? colors.success : colors.warning;
          return (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/(tabs)/measure/feed?containerId=${c.id}`)}
            >
              <Card style={styles.containerCard}>
                <Card.Content>
                  <View style={styles.containerHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.containerTitleRow}>
                        <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.primary} />
                        <Text variant="titleMedium" style={styles.containerNumber}>
                          {c.containerNumber}
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={styles.containerSr}>Sr #{c.srNo}</Text>
                    </View>
                    <Chip
                      compact
                      style={{ backgroundColor: c.isLoadingComplete ? colors.successLight : colors.warningLight }}
                      textStyle={{ color: statusColor, fontWeight: 'bold', fontSize: 11 }}
                    >
                      {c.isLoadingComplete ? 'Complete' : 'Pending'}
                    </Chip>
                  </View>

                  <Divider style={{ marginVertical: spacing.sm }} />

                  <View style={styles.containerStats}>
                    {c.cbmGross ? <MiniStat label="CBM Gross" value={formatNumber(c.cbmGross, 3)} /> : null}
                    {c.cbmNet ? <MiniStat label="CBM Net" value={formatNumber(c.cbmNet, 3)} /> : null}
                    {c.pcsSupplier ? <MiniStat label="Pcs" value={String(c.pcsSupplier)} /> : null}
                    {c.qualitySupplier ? <MiniStat label="Quality" value={c.qualitySupplier} /> : null}
                  </View>

                  {c.isLoadingComplete && (
                    <View style={styles.completedSection}>
                      <Divider style={{ marginVertical: spacing.sm }} />
                      <Text variant="bodySmall" style={styles.completedLabel}>Loading Completion</Text>
                      <View style={styles.containerStats}>
                        {c.measurementDate ? <MiniStat label="Date" value={formatDate(c.measurementDate)} /> : null}
                        {c.bendPercent ? <MiniStat label="Bend" value={`${c.bendPercent}%`} /> : null}
                        {c.qualityByUs ? <MiniStat label="Our Grade" value={c.qualityByUs} /> : null}
                      </View>
                    </View>
                  )}

                  <Button
                    mode="text"
                    icon="ruler"
                    onPress={() => router.push(`/(tabs)/measure/feed?containerId=${c.id}`)}
                    style={styles.measureBtn}
                  >
                    Open Measurements
                  </Button>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) {
  return (
    <View style={dStyles.row}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.textSecondary} />
      <Text style={dStyles.label}>{label}:</Text>
      <Text style={[dStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={dStyles.stat}>
      <Text variant="bodySmall" style={dStyles.statLabel}>{label}</Text>
      <Text variant="headlineSmall" style={[dStyles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={dStyles.miniStat}>
      <Text variant="bodySmall" style={dStyles.miniStatLabel}>{label}</Text>
      <Text variant="bodyMedium" style={dStyles.miniStatValue}>{value}</Text>
    </View>
  );
}

const dStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: 4 },
  label: { color: colors.textSecondary, minWidth: 90 },
  value: { color: colors.textPrimary, fontWeight: '600', flex: 1 },
  stat: { width: '47%', alignItems: 'flex-start' },
  statLabel: { color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontWeight: 'bold', marginTop: 2 },
  miniStat: { width: '50%', marginBottom: 6 },
  miniStatLabel: { color: colors.textSecondary, fontSize: 10 },
  miniStatValue: { color: colors.textPrimary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
  },
  headerTitle: { color: colors.textInverse, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textInverse, opacity: 0.85 },
  content: { flex: 1, padding: spacing.md },
  card: { marginBottom: spacing.md, elevation: 2 },
  cardTitle: { fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  remarks: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceVariant, borderRadius: 8 },
  remarksLabel: { color: colors.textSecondary, fontWeight: '600' },
  remarksText: { color: colors.textPrimary, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  sectionTitle: { fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  containerCard: { marginBottom: spacing.sm, elevation: 1 },
  containerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  containerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  containerNumber: { fontWeight: 'bold', color: colors.textPrimary },
  containerSr: { color: colors.textSecondary, marginTop: 2 },
  containerStats: { flexDirection: 'row', flexWrap: 'wrap' },
  completedSection: { marginTop: 4 },
  completedLabel: { color: colors.success, fontWeight: '600', marginBottom: 4 },
  measureBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
