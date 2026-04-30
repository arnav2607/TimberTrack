import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Chip, Banner } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { colors, spacing } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ContainersScreen() {
  const router = useRouter();
  const { blId } = useLocalSearchParams();
  const { purchases } = usePurchasesStore();
  
  const purchase = purchases.find(p => p.id === blId);
  const containers = purchase?.containers || [];

  const getContainerStatus = (container: any) => {
    if (container.isLoadingComplete) return 'completed';
    // Check if has measurements (we'll implement this later)
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.completed;
      case 'in_progress': return colors.inProgress;
      default: return colors.pending;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'in_progress': return 'progress-clock';
      default: return 'play-circle-outline';
    }
  };

  if (!purchase) {
    return (
      <View style={styles.container}>
        <Text>Purchase not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.textInverse}
          size={24}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={styles.headerTitle}>Select Container</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>{purchase.blNumber}</Text>
        </View>
      </View>

      <Banner
        visible={true}
        icon="information"
        style={styles.banner}
      >
        BL: {purchase.blNumber} | Supplier: {purchase.supplierName}
      </Banner>

      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {containers.map((container: any) => {
            const status = getContainerStatus(container);
            const statusColor = getStatusColor(status);
            const statusIcon = getStatusIcon(status);

            return (
              <TouchableOpacity
                key={container.id}
                onPress={() => router.push(`/(tabs)/measure/feed?containerId=${container.id}`)}
                activeOpacity={0.7}
                style={styles.gridItem}
              >
                <Card 
                  style={[
                    styles.containerCard,
                    status === 'completed' && styles.completedCard,
                    status === 'in_progress' && styles.inProgressCard,
                  ]}
                >
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <MaterialCommunityIcons 
                        name={statusIcon} 
                        size={32} 
                        color={statusColor} 
                      />
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    </View>

                    <Text variant="bodySmall" style={styles.containerLabel}>Container #{container.srNo}</Text>
                    <Text variant="titleMedium" style={styles.containerNumber} numberOfLines={1}>
                      {container.containerNumber}
                    </Text>

                    {container.pcsSupplier && (
                      <View style={styles.statsRow}>
                        <MaterialCommunityIcons name="package" size={14} color={colors.textSecondary} />
                        <Text variant="bodySmall" style={styles.statsText}>
                          {container.pcsSupplier} pcs
                        </Text>
                      </View>
                    )}

                    {container.cbmGross && (
                      <View style={styles.statsRow}>
                        <MaterialCommunityIcons name="cube" size={14} color={colors.textSecondary} />
                        <Text variant="bodySmall" style={styles.statsText}>
                          {container.cbmGross} CBM
                        </Text>
                      </View>
                    )}

                    <Chip 
                      compact
                      style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}
                      textStyle={{ color: statusColor, fontSize: 10, fontWeight: 'bold' }}
                    >
                      {status.toUpperCase()}
                    </Chip>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textInverse,
    opacity: 0.8,
  },
  banner: {
    backgroundColor: colors.infoLight,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '48%',
  },
  containerCard: {
    elevation: 2,
  },
  completedCard: {
    backgroundColor: colors.successLight,
  },
  inProgressCard: {
    backgroundColor: colors.warningLight,
  },
  cardContent: {
    minHeight: 160,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  containerLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  containerNumber: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statsText: {
    color: colors.textSecondary,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    height: 22,
  },
});