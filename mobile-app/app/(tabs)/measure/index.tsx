import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Searchbar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { colors, spacing } from '@/theme/colors';
import { formatDate } from '@/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MeasureScreen() {
  const router = useRouter();
  const { purchases, loadPurchases } = usePurchasesStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const filteredPurchases = purchases.filter(p => 
    p.blNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPendingContainerCount = (containers: any[]) => {
    return containers?.filter(c => !c.isLoadingComplete).length || 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Measure</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Select BL to start measuring logs
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search BL..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <ScrollView style={styles.content}>
        {filteredPurchases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ruler" size={64} color={colors.textTertiary} />
            <Text variant="titleLarge" style={styles.emptyTitle}>No Purchases Available</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Add purchases first in the Purchases tab
            </Text>
          </View>
        ) : (
          filteredPurchases.map((purchase) => {
            const pendingCount = getPendingContainerCount(purchase.containers);
            const totalContainers = purchase.containers?.length || 0;

            return (
              <TouchableOpacity
                key={purchase.id}
                onPress={() => router.push(`/(tabs)/measure/containers?blId=${purchase.id}`)}
                activeOpacity={0.7}
              >
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.titleRow}>
                        <MaterialCommunityIcons name="file-document" size={24} color={colors.primary} />
                        <Text variant="titleLarge" style={styles.blNumber}>{purchase.blNumber}</Text>
                      </View>
                      {pendingCount > 0 && (
                        <Chip 
                          icon="alert-circle" 
                          style={styles.pendingChip}
                          textStyle={{ color: colors.warning, fontWeight: 'bold' }}
                        >
                          {pendingCount} pending
                        </Chip>
                      )}
                    </View>

                    <View style={styles.details}>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="office-building" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{purchase.supplierName}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{formatDate(purchase.blDate)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="package-variant" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>{totalContainers} containers</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  blNumber: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  pendingChip: {
    backgroundColor: colors.warningLight,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    color: colors.textSecondary,
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
});