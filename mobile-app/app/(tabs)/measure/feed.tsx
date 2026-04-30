import { useState, useEffect, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, Vibration, TextInput as RNTextInput,
} from 'react-native';
import { Text, TextInput, Button, Card, Chip, IconButton, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/theme/colors';
import { calculateLog, formatNumber, validateMeasurement } from '@/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMeasurementsStore } from '@/stores/measurementsStore';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { track } from '@/services/analytics';

export default function MeasurementFeedScreen() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams<{ containerId: string }>();
  const { logsByContainer, loadLogs, saveLog, deleteLog } = useMeasurementsStore();
  const { purchases, loadPurchases } = usePurchasesStore();

  const logs = (containerId && logsByContainer[containerId as string]) || [];

  // Find container info
  const container: any = purchases
    .flatMap((p: any) => p.containers || [])
    .find((c: any) => c.id === containerId);

  const [le1, setLe1] = useState('');
  const [l, setL] = useState('');
  const [g1, setG1] = useState('');
  const [g2, setG2] = useState('');
  const [saving, setSaving] = useState(false);

  const le1Ref = useRef<RNTextInput>(null);
  const lRef = useRef<RNTextInput>(null);
  const g1Ref = useRef<RNTextInput>(null);
  const g2Ref = useRef<RNTextInput>(null);

  useEffect(() => {
    if (containerId) {
      loadLogs(containerId as string);
    }
    if (purchases.length === 0) loadPurchases();
  }, [containerId]);

  // Live preview calculation
  const preview = (() => {
    const a = parseFloat(le1), b = parseFloat(l), c = parseFloat(g1), d = parseFloat(g2);
    if (!isNaN(a) && !isNaN(b) && !isNaN(c) && !isNaN(d) && c > 0 && d > 0) {
      return calculateLog(a, b, c, d);
    }
    return null;
  })();

  const handleSave = async () => {
    const validation = validateMeasurement(le1, l, g1, g2);
    if (!validation.valid) {
      Alert.alert('Invalid input', validation.errors.join('\n'));
      return;
    }
    if (!containerId) return;

    setSaving(true);
    try {
      await saveLog(
        containerId as string,
        parseFloat(le1),
        parseFloat(l),
        parseFloat(g1),
        parseFloat(g2)
      );
      track('measurement_saved', { containerId });
      // Auto-advance: clear and focus first field, vibrate
      Vibration.vibrate(40);
      setLe1(''); setL(''); setG1(''); setG2('');
      le1Ref.current?.focus();
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (logId: string) => {
    Alert.alert(
      'Delete log',
      'Are you sure you want to delete this measurement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!containerId) return;
            await deleteLog(containerId as string, logId);
          },
        },
      ]
    );
  };

  // Totals
  const totals = (() => {
    const pieces = logs.length;
    const totalCbm1 = logs.reduce((s, x) => s + (x.cbm1 || 0), 0);
    const totalCbm2 = logs.reduce((s, x) => s + (x.cbm2 || 0), 0);
    const totalCft1 = logs.reduce((s, x) => s + (x.cft1 || 0), 0);
    const totalCft2 = logs.reduce((s, x) => s + (x.cft2 || 0), 0);
    const avgG1 = pieces > 0 ? logs.reduce((s, x) => s + x.g1, 0) / pieces : 0;
    const avgG2 = pieces > 0 ? logs.reduce((s, x) => s + x.g2, 0) / pieces : 0;
    const shortCbm = container?.cbmNet ? container.cbmNet - totalCbm2 : 0;
    return { pieces, totalCbm1, totalCbm2, totalCft1, totalCft2, avgG1, avgG2, shortCbm };
  })();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={colors.textInverse}
          size={24}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1 }}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {container?.containerNumber || 'Container'}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            Sr #{container?.srNo || '-'} • {logs.length} logs entered
          </Text>
        </View>
        <IconButton
          icon="checkbox-marked-circle-outline"
          iconColor={colors.textInverse}
          size={24}
          onPress={() => router.push(`/(tabs)/measure/complete?containerId=${containerId}`)}
        />
      </View>

      {/* Live Stats Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip} contentContainerStyle={{ gap: spacing.xs }}>
        <Chip compact style={styles.statChip}>Pieces: {totals.pieces}</Chip>
        <Chip compact style={styles.statChip}>CBM1: {formatNumber(totals.totalCbm1, 4)}</Chip>
        <Chip compact style={styles.statChip}>CBM2: {formatNumber(totals.totalCbm2, 4)}</Chip>
        <Chip compact style={styles.statChip}>Avg G1: {formatNumber(totals.avgG1, 1)}</Chip>
        <Chip compact style={styles.statChip}>Avg G2: {formatNumber(totals.avgG2, 1)}</Chip>
        {container?.cbmNet ? (
          <Chip
            compact
            style={[
              styles.statChip,
              { backgroundColor: totals.shortCbm > 0 ? colors.errorLight : colors.successLight },
            ]}
            textStyle={{
              color: totals.shortCbm > 0 ? colors.error : colors.success,
              fontWeight: 'bold',
            }}
          >
            Short: {formatNumber(totals.shortCbm, 3)}
          </Chip>
        ) : null}
      </ScrollView>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Quick Entry Form */}
        <Card style={styles.entryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.entryTitle}>New Log #{logs.length + 1}</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text variant="labelSmall" style={styles.inputLabel}>LE1 (cm)</Text>
                <TextInput
                  ref={le1Ref as any}
                  value={le1}
                  onChangeText={setLe1}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  returnKeyType="next"
                  onSubmitEditing={() => lRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text variant="labelSmall" style={styles.inputLabel}>L (cm)</Text>
                <TextInput
                  ref={lRef as any}
                  value={l}
                  onChangeText={setL}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  returnKeyType="next"
                  onSubmitEditing={() => g1Ref.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text variant="labelSmall" style={styles.inputLabel}>G1 (cm)</Text>
                <TextInput
                  ref={g1Ref as any}
                  value={g1}
                  onChangeText={setG1}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  returnKeyType="next"
                  onSubmitEditing={() => g2Ref.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text variant="labelSmall" style={styles.inputLabel}>G2 (cm)</Text>
                <TextInput
                  ref={g2Ref as any}
                  value={g2}
                  onChangeText={setG2}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            {preview && (
              <View style={styles.preview}>
                <Divider style={{ marginVertical: spacing.sm }} />
                <View style={styles.previewRow}>
                  <Text variant="bodySmall" style={styles.previewLabel}>CBM1:</Text>
                  <Text variant="bodyMedium" style={styles.previewValue}>{formatNumber(preview.cbm1, 6)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text variant="bodySmall" style={styles.previewLabel}>CBM2:</Text>
                  <Text variant="bodyMedium" style={styles.previewValue}>{formatNumber(preview.cbm2, 6)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text variant="bodySmall" style={styles.previewLabel}>CFT1:</Text>
                  <Text variant="bodySmall" style={styles.previewValue}>{formatNumber(preview.cft1, 3)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text variant="bodySmall" style={styles.previewLabel}>CFT2:</Text>
                  <Text variant="bodySmall" style={styles.previewValue}>{formatNumber(preview.cft2, 3)}</Text>
                </View>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving || !preview}
              style={styles.saveBtn}
              buttonColor={colors.primary}
              icon="content-save-plus"
            >
              Save & Next
            </Button>
          </Card.Content>
        </Card>

        {/* Log History */}
        <Text variant="titleMedium" style={styles.historyTitle}>
          Logged Measurements ({logs.length})
        </Text>
        {logs.length === 0 ? (
          <View style={styles.emptyHistory}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.textTertiary} />
            <Text variant="bodyMedium" style={styles.emptyHistoryText}>No logs yet. Enter your first measurement above.</Text>
          </View>
        ) : (
          [...logs].reverse().map((log) => (
            <Card key={log.id || log.logNumber} style={styles.logCard}>
              <Card.Content style={{ paddingVertical: spacing.sm }}>
                <View style={styles.logRow}>
                  <Text variant="titleSmall" style={styles.logNumberText}>#{log.logNumber}</Text>
                  <Text variant="bodySmall" style={styles.logDetail}>
                    LE1:{log.le1} L:{log.l} G1:{log.g1} G2:{log.g2}
                  </Text>
                  {log.id && (
                    <IconButton
                      icon="trash-can-outline"
                      size={18}
                      iconColor={colors.error}
                      onPress={() => handleDelete(log.id!)}
                    />
                  )}
                </View>
                <Text variant="bodySmall" style={styles.logCbm}>
                  CBM1: {formatNumber(log.cbm1, 6)} • CBM2: {formatNumber(log.cbm2, 6)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerTitle: { color: colors.textInverse, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textInverse, opacity: 0.85 },
  statsStrip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 50,
  },
  statChip: { marginRight: spacing.xs, backgroundColor: colors.infoLight, height: 28 },
  content: { flex: 1, padding: spacing.md },
  entryCard: { marginBottom: spacing.md, elevation: 3 },
  entryTitle: { fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  inputGroup: { flex: 1 },
  inputLabel: { marginBottom: 4, color: colors.textSecondary, fontWeight: '600' },
  preview: { marginTop: spacing.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  previewLabel: { color: colors.textSecondary },
  previewValue: { fontWeight: 'bold', color: colors.primary },
  saveBtn: { marginTop: spacing.md, height: 48, justifyContent: 'center' },
  historyTitle: { fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
  emptyHistory: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyHistoryText: { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  logCard: { marginBottom: spacing.xs, elevation: 1 },
  logRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logNumberText: { fontWeight: 'bold', color: colors.primary, width: 36 },
  logDetail: { flex: 1, color: colors.textSecondary, marginLeft: spacing.sm },
  logCbm: { color: colors.textSecondary, marginTop: 2 },
});
