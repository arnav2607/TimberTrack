import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, IconButton, Chip, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMeasurementsStore } from '@/stores/measurementsStore';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { useSync } from '@/hooks/useSync';
import { colors, spacing } from '@/theme/colors';
import { formatDateForInput, formatNumber } from '@/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { track } from '@/services/analytics';

const QUALITY_OPTIONS = ['Premium', 'A Grade', 'B Grade', 'C Grade', 'Mixed'];

export default function CompleteContainerScreen() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams<{ containerId: string }>();
  const { logsByContainer, loadLogs, completeContainer } = useMeasurementsStore();
  const { purchases, loadPurchases } = usePurchasesStore();
  const { sync } = useSync();

  const logs = (containerId && logsByContainer[containerId as string]) || [];
  const container: any = purchases
    .flatMap((p: any) => p.containers || [])
    .find((c: any) => c.id === containerId);

  const [bendPercent, setBendPercent] = useState('');
  const [qualityByUs, setQualityByUs] = useState('');
  const [measurementDate, setMeasurementDate] = useState(formatDateForInput());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (containerId) loadLogs(containerId as string);
    if (purchases.length === 0) loadPurchases();
  }, [containerId]);

  useEffect(() => {
    if (container) {
      setBendPercent(container.bendPercent ? String(container.bendPercent) : '');
      setQualityByUs(container.qualityByUs || '');
      setMeasurementDate(container.measurementDate || formatDateForInput());
    }
  }, [container?.id]);

  const totalCbm2 = logs.reduce((s, l) => s + (l.cbm2 || 0), 0);
  const shortCbm = container?.cbmNet ? container.cbmNet - totalCbm2 : 0;

  const handleComplete = async () => {
    if (!containerId) return;
    if (logs.length === 0) {
      Alert.alert('No measurements', 'You must enter at least one log measurement before completing.');
      return;
    }

    setSaving(true);
    try {
      await completeContainer(containerId as string, {
        bendPercent: bendPercent ? parseFloat(bendPercent) : 0,
        qualityByUs,
        measurementDate,
      });
      track('container_completed', { containerId, pieces: logs.length });
      sync();
      Alert.alert('Container Marked Complete!', 'Loading completion saved successfully.');
      router.back();
      router.back();
    } catch (e: any) {
      Alert.alert('Failed to complete', e.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.textInverse} size={24} onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>Complete Container</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summary}>
          <Text variant="titleMedium" style={styles.summaryTitle}>Container Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Container:</Text>
            <Text style={styles.summaryValue}>{container?.containerNumber || '-'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pieces logged:</Text>
            <Text style={styles.summaryValue}>{logs.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total CBM2:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalCbm2, 4)}</Text>
          </View>
          {container?.cbmNet ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Short CBM (vs Net):</Text>
              <Text style={[
                styles.summaryValue,
                { color: shortCbm > 0 ? colors.error : colors.success },
              ]}>
                {formatNumber(shortCbm, 4)}
              </Text>
            </View>
          ) : null}
        </View>

        <Divider style={{ marginVertical: spacing.md }} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Loading Completion Form</Text>

        <TextInput
          label="Measurement Date"
          value={measurementDate}
          onChangeText={setMeasurementDate}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="calendar" />}
          placeholder="YYYY-MM-DD"
        />

        <TextInput
          label="Bend Percentage (%)"
          value={bendPercent}
          onChangeText={setBendPercent}
          mode="outlined"
          style={styles.input}
          keyboardType="decimal-pad"
          left={<TextInput.Icon icon="rotate-360" />}
          right={<TextInput.Affix text="%" />}
        />

        <Text variant="bodyMedium" style={styles.qualityLabel}>Quality (Our Grade)</Text>
        <View style={styles.qualityChips}>
          {QUALITY_OPTIONS.map((q) => (
            <Chip
              key={q}
              selected={qualityByUs === q}
              onPress={() => setQualityByUs(q)}
              style={[styles.qualityChip, qualityByUs === q && styles.qualityChipActive]}
              textStyle={qualityByUs === q ? { color: colors.textInverse, fontWeight: 'bold' } : undefined}
            >
              {q}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Custom Grade (optional)"
          value={QUALITY_OPTIONS.includes(qualityByUs) ? '' : qualityByUs}
          onChangeText={setQualityByUs}
          mode="outlined"
          style={styles.input}
          placeholder="Enter custom grade..."
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleComplete}
          loading={saving}
          disabled={saving || logs.length === 0}
          style={styles.saveButton}
          buttonColor={colors.success}
          icon="check-circle"
        >
          Mark Complete ({logs.length} logs)
        </Button>
      </View>
    </KeyboardAvoidingView>
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
  summary: {
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: 12,
  },
  summaryTitle: { fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { color: colors.textSecondary },
  summaryValue: { fontWeight: 'bold', color: colors.textPrimary },
  sectionTitle: { fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md },
  input: { marginBottom: spacing.md },
  qualityLabel: { color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600' },
  qualityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  qualityChip: { backgroundColor: colors.surfaceVariant },
  qualityChipActive: { backgroundColor: colors.primary },
  footer: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
  },
  cancelButton: { flex: 1 },
  saveButton: { flex: 2 },
});
