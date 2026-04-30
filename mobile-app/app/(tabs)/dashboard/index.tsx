import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Chip, Button, ActivityIndicator, IconButton, Menu, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, useSubscription } from '@/hooks/useAuth';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { useSync } from '@/hooks/useSync';
import { colors, spacing } from '@/theme/colors';
import { exportDealSheet } from '@/services/excel';
import { formatNumber, formatDate } from '@/utils/calculations';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const subscription = useSubscription();
  const { purchases, loading, loadPurchases } = usePurchasesStore();
  const { sync, syncing, lastSyncAt } = useSync();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPurchases(), sync()]);
    setRefreshing(false);
  };

  const kpis = useMemo(() => {
    let totalBLs = purchases.length;
    let totalContainers = 0;
    let completedContainers = 0;
    let pendingContainers = 0;
    let totalCbmGross = 0;
    let totalCbmNet = 0;
    let totalPcsSupplier = 0;
    const supplierSet = new Set<string>();
    const countrySet = new Set<string>();

    purchases.forEach((p: any) => {
      supplierSet.add(p.supplierName);
      countrySet.add(p.country);
      (p.containers || []).forEach((c: any) => {
        totalContainers += 1;
        if (c.isLoadingComplete) completedContainers += 1;
        else pendingContainers += 1;
        totalCbmGross += c.cbmGross || 0;
        totalCbmNet += c.cbmNet || 0;
        totalPcsSupplier += c.pcsSupplier || 0;
      });
    });

    return {
      totalBLs,
      totalContainers,
      completedContainers,
      pendingContainers,
      totalCbmGross,
      totalCbmNet,
      totalPcsSupplier,
      suppliers: supplierSet.size,
      countries: countrySet.size,
      progress: totalContainers > 0 ? (completedContainers / totalContainers) * 100 : 0,
    };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p: any) => {
      if (supplierFilter && p.supplierName !== supplierFilter) return false;
      if (filter === 'all') return true;

      const containers = p.containers || [];
      const completed = containers.filter((c: any) => c.isLoadingComplete).length;
      const total = containers.length;

      if (filter === 'pending') return completed === 0 && total > 0;
      if (filter === 'in_progress') return completed > 0 && completed < total;
      if (filter === 'completed') return total > 0 && completed === total;
      return true;
    });
  }, [purchases, filter, supplierFilter]);

  const supplierList = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p: any) => set.add(p.supplierName));
    return Array.from(set);
  }, [purchases]);

  const handleExport = async (scope: 'all' | 'completed') => {
    if (!subscription.canAccessFeature('export')) {
      Alert.alert(
        'Pro Feature',
        'Excel export is available on the Pro plan. Upgrade to unlock.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall') },
        ]
      );
      return;
    }

    setExportMenuVisible(false);
    setExporting(true);
    try {
      const target = scope === 'completed'
        ? filteredPurchases.filter((p: any) =>
            (p.containers || []).every((c: any) => c.isLoadingComplete) && (p.containers || []).length > 0
          )
        : filteredPurchases;

      if (target.length === 0) {
        Alert.alert('No data', 'No purchases match the selected scope.');
        return;
      }

      await exportDealSheet(target, profile?.company_name || 'TimberLog Pro');
    } catch (err: any) {
      Alert.alert('Export failed', err.message || 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {profile?.company_name || 'Your Company'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon={syncing ? 'sync' : 'cloud-sync'}
              iconColor={colors.textInverse}
              size={22}
              onPress={() => sync()}
              disabled={syncing}
            />
            <Menu
              visible={exportMenuVisible}
              onDismiss={() => setExportMenuVisible(false)}
              anchor={
                <IconButton
                  icon="file-excel"
                  iconColor={colors.textInverse}
                  size={22}
                  onPress={() => setExportMenuVisible(true)}
                  disabled={exporting}
                />
              }
            >
              <Menu.Item
                onPress={() => handleExport('all')}
                title="Export All Filtered"
                leadingIcon="export"
              />
              <Menu.Item
                onPress={() => handleExport('completed')}
                title="Export Completed Only"
                leadingIcon="check-all"
              />
            </Menu>
          </View>
        </View>
        {subscription.isTrial && (
          <Chip
            icon="clock-outline"
            style={styles.trialChip}
            textStyle={{ color: colors.primary, fontWeight: 'bold' }}
            onPress={() => router.push('/paywall')}
          >
            Trial: {subscription.daysRemaining} days left — Upgrade
          </Chip>
        )}
        {lastSyncAt && (
          <Text variant="bodySmall" style={styles.syncText}>
            Last sync: {new Date(lastSyncAt).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="file-document-multiple"
            label="Total BLs"
            value={kpis.totalBLs.toString()}
            color={colors.primary}
          />
          <KpiCard
            icon="package-variant"
            label="Containers"
            value={`${kpis.completedContainers}/${kpis.totalContainers}`}
            color={colors.accent}
            sublabel={`${kpis.pendingContainers} pending`}
          />
          <KpiCard
            icon="cube-outline"
            label="CBM Gross"
            value={formatNumber(kpis.totalCbmGross, 2)}
            color={colors.info}
          />
          <KpiCard
            icon="cube"
            label="CBM Net"
            value={formatNumber(kpis.totalCbmNet, 2)}
            color={colors.success}
          />
          <KpiCard
            icon="counter"
            label="Total Pieces"
            value={kpis.totalPcsSupplier.toString()}
            color={colors.warning}
          />
          <KpiCard
            icon="earth"
            label="Origins"
            value={kpis.countries.toString()}
            color={colors.primary}
            sublabel={`${kpis.suppliers} suppliers`}
          />
        </View>

        {/* Progress Bar */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text variant="titleMedium" style={styles.progressTitle}>Overall Progress</Text>
              <Text variant="titleLarge" style={styles.progressPct}>{formatNumber(kpis.progress, 0)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${kpis.progress}%` },
                ]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Filters */}
        <View style={styles.filtersWrap}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(['all', 'pending', 'in_progress', 'completed'] as FilterStatus[]).map((f) => (
              <Chip
                key={f}
                selected={filter === f}
                onPress={() => setFilter(f)}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                textStyle={filter === f ? { color: colors.textInverse } : undefined}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Chip>
            ))}
          </ScrollView>

          {supplierList.length > 0 && (
            <>
              <Text variant="titleSmall" style={[styles.sectionTitle, { marginTop: spacing.md }]}>Filter by Supplier</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <Chip
                  selected={!supplierFilter}
                  onPress={() => setSupplierFilter(null)}
                  style={[styles.filterChip, !supplierFilter && styles.filterChipActive]}
                  textStyle={!supplierFilter ? { color: colors.textInverse } : undefined}
                >
                  All Suppliers
                </Chip>
                {supplierList.map((s) => (
                  <Chip
                    key={s}
                    selected={supplierFilter === s}
                    onPress={() => setSupplierFilter(s)}
                    style={[styles.filterChip, supplierFilter === s && styles.filterChipActive]}
                    textStyle={supplierFilter === s ? { color: colors.textInverse } : undefined}
                  >
                    {s}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Recent Purchases */}
        <View style={styles.recentSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {filter === 'all' ? 'All Purchases' : `${filter.replace('_', ' ').toUpperCase()}`} ({filteredPurchases.length})
          </Text>

          {loading && purchases.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : filteredPurchases.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="filter-off" size={48} color={colors.textTertiary} />
              <Text variant="bodyMedium" style={styles.emptyText}>No purchases match the filter.</Text>
            </View>
          ) : (
            filteredPurchases.map((p: any) => {
              const containers = p.containers || [];
              const completed = containers.filter((c: any) => c.isLoadingComplete).length;
              const total = containers.length;
              const pct = total > 0 ? (completed / total) * 100 : 0;
              const isDone = total > 0 && completed === total;

              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/(tabs)/purchases/${p.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.recentCard}>
                    <Card.Content>
                      <View style={styles.recentHeader}>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleMedium" style={styles.recentTitle}>{p.blNumber}</Text>
                          <Text variant="bodySmall" style={styles.recentSub}>
                            {p.supplierName} • {p.country} • {formatDate(p.blDate)}
                          </Text>
                        </View>
                        <Chip
                          compact
                          icon={isDone ? 'check-circle' : 'progress-clock'}
                          style={[
                            styles.statusBadge,
                            { backgroundColor: isDone ? colors.successLight : colors.warningLight },
                          ]}
                          textStyle={{
                            color: isDone ? colors.success : colors.warning,
                            fontSize: 11,
                            fontWeight: 'bold',
                          }}
                        >
                          {completed}/{total}
                        </Chip>
                      </View>
                      <View style={styles.miniProgressBar}>
                        <View
                          style={[
                            styles.miniProgressFill,
                            { width: `${pct}%`, backgroundColor: isDone ? colors.success : colors.warning },
                          ]}
                        />
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function KpiCard({ icon, label, value, color, sublabel }: { icon: any; label: string; value: string; color: string; sublabel?: string }) {
  return (
    <Card style={[styles.kpiCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.kpiContent}>
        <MaterialCommunityIcons name={icon} size={28} color={color} style={styles.kpiIcon} />
        <Text variant="bodySmall" style={styles.kpiLabel}>{label}</Text>
        <Text variant="headlineSmall" style={[styles.kpiValue, { color }]}>{value}</Text>
        {sublabel ? <Text variant="bodySmall" style={styles.kpiSubLabel}>{sublabel}</Text> : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.textInverse, fontWeight: 'bold' },
  subtitle: { color: colors.textInverse, opacity: 0.85, marginTop: 2 },
  trialChip: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  syncText: { color: colors.textInverse, opacity: 0.7, marginTop: spacing.xs },
  content: { flex: 1 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  kpiCard: {
    width: '47%',
    borderLeftWidth: 4,
    elevation: 2,
  },
  kpiContent: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  kpiIcon: { marginBottom: spacing.xs },
  kpiLabel: { color: colors.textSecondary, fontWeight: '600' },
  kpiValue: { fontWeight: 'bold', marginTop: 2 },
  kpiSubLabel: { color: colors.textTertiary, marginTop: 2 },
  progressCard: {
    margin: spacing.md,
    elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTitle: { fontWeight: '600', color: colors.textPrimary },
  progressPct: { fontWeight: 'bold', color: colors.primary },
  progressBar: {
    height: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  filtersWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sectionTitle: { fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  chipRow: { gap: spacing.sm, paddingRight: spacing.md },
  filterChip: { marginRight: spacing.xs, backgroundColor: colors.surfaceVariant },
  filterChipActive: { backgroundColor: colors.primary },
  divider: { marginVertical: spacing.md, marginHorizontal: spacing.md },
  recentSection: { paddingHorizontal: spacing.md },
  recentCard: { marginBottom: spacing.sm, elevation: 1 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  recentTitle: { fontWeight: 'bold', color: colors.primary },
  recentSub: { color: colors.textSecondary, marginTop: 2 },
  statusBadge: { height: 26 },
  miniProgressBar: {
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { color: colors.textSecondary, marginTop: spacing.sm },
});
