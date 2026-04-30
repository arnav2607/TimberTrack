import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, FAB, Chip, IconButton, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { colors, spacing } from '@/theme/colors';
import { formatDate } from '@/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PurchasesScreen() {
  const router = useRouter();
  const { purchases, loading, loadPurchases, deletePurchase } = usePurchasesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchases();
    setRefreshing(false);
  };

  const filteredPurchases = purchases.filter(p => 
    p.blNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (containers: any[]) => {
    if (!containers || containers.length === 0) return colors.pending;
    const completed = containers.filter(c => c.isLoadingComplete).length;
    if (completed === 0) return colors.pending;
    if (completed === containers.length) return colors.completed;
    return colors.inProgress;
  };

  const getStatusText = (containers: any[]) => {
    if (!containers || containers.length === 0) return 'No Containers';
    const completed = containers.filter(c => c.isLoadingComplete).length;
    if (completed === 0) return 'Pending';
    if (completed === containers.length) return 'Completed';
    return 'In Progress';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Purchases</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Manage your Bill of Lading (BL) records
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search BL or Supplier..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && purchases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color={colors.textTertiary} />
            <Text variant="bodyLarge" style={styles.emptyText}>Loading purchases...</Text>
          </View>
        ) : filteredPurchases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={64} color={colors.textTertiary} />
            <Text variant="titleLarge" style={styles.emptyTitle}>No Purchases Yet</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Tap the + button below to add your first BL
            </Text>
          </View>
        ) : (
          filteredPurchases.map((purchase) => {
            const statusColor = getStatusColor(purchase.containers);
            const statusText = getStatusText(purchase.containers);
            const completed = purchase.containers?.filter((c: any) => c.isLoadingComplete).length || 0;
            const total = purchase.containers?.length || 0;
            const progress = total > 0 ? (completed / total) * 100 : 0;

            return (
              <TouchableOpacity
                key={purchase.id}
                onPress={() => router.push(`/(tabs)/purchases/${purchase.id}`)}
                activeOpacity={0.7}
              >
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleRow}>
                        <MaterialCommunityIcons name="file-document" size={24} color={colors.primary} />
                        <Text variant="titleLarge" style={styles.blNumber}>{purchase.blNumber}</Text>
                      </View>
                      <Chip 
                        style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}
                        textStyle={{ color: statusColor, fontSize: 11, fontWeight: 'bold' }}
                      >
                        {statusText}
                      </Chip>
                    </View>

                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="office-building" size={16} color={colors.textSecondary} />
                        <Text variant="bodyMedium" style={styles.detailText}>{purchase.supplierName}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="earth" size={16} color={colors.textSecondary} />
                        <Text variant="bodyMedium" style={styles.detailText}>{purchase.country}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
                        <Text variant="bodyMedium" style={styles.detailText}>{formatDate(purchase.blDate)}</Text>
                      </View>
                    </View>

                    <View style={styles.containerInfo}>
                      <View style={styles.containerStats}>
                        <MaterialCommunityIcons name="package-variant" size={18} color={colors.accent} />
                        <Text variant="bodyMedium" style={styles.containerText}>
                          Containers: {completed}/{total}
                        </Text>
                      </View>
                      {total > 0 && (
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: statusColor }]} />
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/purchases/add')}
        label="Add BL"
      />
    </View>
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
    opacity: 0.9,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchBar: {
    elevation: 0,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  blNumber: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusChip: {
    height: 28,
  },
  cardDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    color: colors.textSecondary,
  },
  containerInfo: {
    marginTop: spacing.sm,
  },
  containerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  containerText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});