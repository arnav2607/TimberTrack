import { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Chip, IconButton, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/theme/colors';
import { calculateLog, formatNumber } from '@/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogEntry {
  le1: string;
  l: string;
  g1: string;
  g2: string;
  cbm1?: number;
  cbm2?: number;
  cft1?: number;
  cft2?: number;
}

export default function MeasurementFeedScreen() {
  const router = useRouter();
  const { containerId } = useLocalSearchParams();
  
  const [logs, setLogs] = useState<LogEntry[]>([
    { le1: '', l: '', g1: '', g2: '' }
  ]);

  const updateLog = (index: number, field: keyof LogEntry, value: string) => {
    const updated = [...logs];
    updated[index][field] = value;
    
    // Auto-calculate if all fields filled
    const log = updated[index];
    if (log.le1 && log.l && log.g1 && log.g2) {
      const calc = calculateLog(
        parseFloat(log.le1),
        parseFloat(log.l),
        parseFloat(log.g1),
        parseFloat(log.g2)
      );
      updated[index] = { ...log, ...calc };
    }
    
    setLogs(updated);
  };

  const addLog = () => {
    setLogs([...logs, { le1: '', l: '', g1: '', g2: '' }]);
  };

  const removeLog = (index: number) => {
    if (logs.length > 1) {
      setLogs(logs.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const pieces = logs.filter(l => l.cbm1 && l.cbm2).length;
    const totalCbm1 = logs.reduce((sum, l) => sum + (l.cbm1 || 0), 0);
    const totalCbm2 = logs.reduce((sum, l) => sum + (l.cbm2 || 0), 0);
    const totalCft1 = logs.reduce((sum, l) => sum + (l.cft1 || 0), 0);
    const totalCft2 = logs.reduce((sum, l) => sum + (l.cft2 || 0), 0);
    const avgG1 = pieces > 0 ? logs.reduce((sum, l) => sum + parseFloat(l.g1 || '0'), 0) / pieces : 0;
    const avgG2 = pieces > 0 ? logs.reduce((sum, l) => sum + parseFloat(l.g2 || '0'), 0) / pieces : 0;

    return { pieces, totalCbm1, totalCbm2, totalCft1, totalCft2, avgG1, avgG2 };
  };

  const totals = calculateTotals();

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
          <Text variant="titleLarge" style={styles.headerTitle}>Log Measurement</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>Container ID: {containerId}</Text>
        </View>
        <IconButton
          icon="content-save"
          iconColor={colors.textInverse}
          size={24}
          onPress={() => console.log('Save')}
        />
      </View>

      {/* Live Stats Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip}>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          Pieces: {totals.pieces}
        </Chip>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          CBM1: {formatNumber(totals.totalCbm1, 3)}
        </Chip>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          CBM2: {formatNumber(totals.totalCbm2, 3)}
        </Chip>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          CFT1: {formatNumber(totals.totalCft1, 2)}
        </Chip>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          CFT2: {formatNumber(totals.totalCft2, 2)}
        </Chip>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          Avg G1: {formatNumber(totals.avgG1, 1)}
        </Chip>
        <Chip compact style={styles.statChip} textStyle={styles.statText}>
          Avg G2: {formatNumber(totals.avgG2, 1)}
        </Chip>
      </ScrollView>

      <ScrollView style={styles.content}>
        {logs.map((log, index) => (
          <Card key={index} style={styles.logCard}>
            <Card.Content>
              <View style={styles.logHeader}>
                <Text variant="titleMedium" style={styles.logTitle}>Log #{index + 1}</Text>
                {logs.length > 1 && (
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => removeLog(index)}
                  />
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text variant="labelSmall" style={styles.inputLabel}>LE1 (cm)</Text>
                  <TextInput
                    value={log.le1}
                    onChangeText={(v) => updateLog(index, 'le1', v)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    dense
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="labelSmall" style={styles.inputLabel}>L (cm)</Text>
                  <TextInput
                    value={log.l}
                    onChangeText={(v) => updateLog(index, 'l', v)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    dense
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text variant="labelSmall" style={styles.inputLabel}>G1 (cm)</Text>
                  <TextInput
                    value={log.g1}
                    onChangeText={(v) => updateLog(index, 'g1', v)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    dense
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text variant="labelSmall" style={styles.inputLabel}>G2 (cm)</Text>
                  <TextInput
                    value={log.g2}
                    onChangeText={(v) => updateLog(index, 'g2', v)}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    dense
                    style={styles.input}
                  />
                </View>
              </View>

              {log.cbm1 && log.cbm2 && (
                <View style={styles.results}>
                  <Divider style={styles.divider} />
                  <View style={styles.resultRow}>
                    <Text variant="bodySmall" style={styles.resultLabel}>CBM1:</Text>
                    <Text variant="bodyMedium" style={styles.resultValue}>{formatNumber(log.cbm1, 6)} m³</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text variant="bodySmall" style={styles.resultLabel}>CBM2:</Text>
                    <Text variant="bodyMedium" style={styles.resultValue}>{formatNumber(log.cbm2, 6)} m³</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text variant="bodySmall" style={styles.resultLabel}>CFT1:</Text>
                    <Text variant="bodySmall" style={styles.resultValue}>{formatNumber(log.cft1, 3)} ft³</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text variant="bodySmall" style={styles.resultLabel}>CFT2:</Text>
                    <Text variant="bodySmall" style={styles.resultValue}>{formatNumber(log.cft2, 3)} ft³</Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="outlined"
          onPress={addLog}
          icon="plus"
          style={styles.addButton}
        >
          Add Log
        </Button>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => console.log('Save')}
          style={styles.saveButton}
          buttonColor={colors.primary}
          icon="content-save"
        >
          Save Measurements ({totals.pieces} logs)
        </Button>
      </View>
    </KeyboardAvoidingView>
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
  statsStrip: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statChip: {
    marginRight: spacing.xs,
    backgroundColor: colors.infoLight,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  logCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logTitle: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: 4,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
  },
  results: {
    marginTop: spacing.sm,
  },
  divider: {
    marginBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultLabel: {
    color: colors.textSecondary,
  },
  resultValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    marginVertical: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveButton: {
    height: 56,
  },
});