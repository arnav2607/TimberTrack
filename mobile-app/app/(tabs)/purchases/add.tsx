import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton, Chip, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import { colors, spacing } from '@/theme/colors';
import { calculateAvgGirth, formatDateForInput } from '@/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toast } from 'sonner';

interface ContainerForm {
  containerNumber: string;
  cbmGross: string;
  cbmNet: string;
  pcsSupplier: string;
  lAvg: string;
  qualitySupplier: string;
}

export default function AddPurchaseScreen() {
  const router = useRouter();
  const { suppliers, countries, loadSuppliers, loadCountries, addSupplier, addCountry, createPurchase } = usePurchasesStore();
  
  const [blNumber, setBlNumber] = useState('');
  const [blDate, setBlDate] = useState(formatDateForInput());
  const [supplierName, setSupplierName] = useState('');
  const [country, setCountry] = useState('');
  const [remarks, setRemarks] = useState('');
  const [containers, setContainers] = useState<ContainerForm[]>([
    { containerNumber: '', cbmGross: '', cbmNet: '', pcsSupplier: '', lAvg: '', qualitySupplier: '' }
  ]);
  
  const [showSupplierInput, setShowSupplierInput] = useState(false);
  const [showCountryInput, setShowCountryInput] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadSuppliers();
    loadCountries();
  }, []);

  const addContainer = () => {
    setContainers([...containers, { containerNumber: '', cbmGross: '', cbmNet: '', pcsSupplier: '', lAvg: '', qualitySupplier: '' }]);
  };

  const removeContainer = (index: number) => {
    if (containers.length > 1) {
      setContainers(containers.filter((_, i) => i !== index));
    }
  };

  const updateContainer = (index: number, field: keyof ContainerForm, value: string) => {
    const updated = [...containers];
    updated[index][field] = value;
    setContainers(updated);
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return;
    try {
      await addSupplier(newSupplier.trim());
      setSupplierName(newSupplier.trim());
      setNewSupplier('');
      setShowSupplierInput(false);
    } catch (error) {
      console.error('Failed to add supplier:', error);
    }
  };

  const handleAddCountry = async () => {
    if (!newCountry.trim()) return;
    try {
      await addCountry(newCountry.trim());
      setCountry(newCountry.trim());
      setNewCountry('');
      setShowCountryInput(false);
    } catch (error) {
      console.error('Failed to add country:', error);
    }
  };

  const validate = () => {
    const errs: string[] = [];
    
    if (!blNumber.trim()) errs.push('BL Number is required');
    if (!blDate) errs.push('BL Date is required');
    if (!supplierName.trim()) errs.push('Supplier is required');
    if (!country.trim()) errs.push('Country is required');
    
    const validContainers = containers.filter(c => c.containerNumber.trim());
    if (validContainers.length === 0) errs.push('At least one container is required');
    
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const validContainers = containers
        .filter(c => c.containerNumber.trim())
        .map((c, index) => ({
          srNo: index + 1,
          containerNumber: c.containerNumber.trim(),
          cbmGross: parseFloat(c.cbmGross) || undefined,
          cbmNet: parseFloat(c.cbmNet) || undefined,
          pcsSupplier: parseInt(c.pcsSupplier) || undefined,
          lAvg: parseFloat(c.lAvg) || undefined,
          qualitySupplier: c.qualitySupplier.trim() || undefined,
        }));

      await createPurchase({
        blNumber: blNumber.trim(),
        blDate,
        supplierName: supplierName.trim(),
        country: country.trim(),
        remarks: remarks.trim(),
        containers: validContainers,
      });

      router.back();
    } catch (error: any) {
      setErrors([error.message || 'Failed to create purchase']);
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
        <IconButton
          icon="arrow-left"
          iconColor={colors.textInverse}
          size={24}
          onPress={() => router.back()}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>New Purchase (BL)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>BL Details</Text>
          
          <TextInput
            label="BL Number *"
            value={blNumber}
            onChangeText={setBlNumber}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="file-document" />}
          />

          <TextInput
            label="BL Date *"
            value={blDate}
            onChangeText={setBlDate}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="calendar" />}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.dropdownContainer}>
            <View style={{ flex: 1 }}>
              {suppliers.length > 0 && !showSupplierInput ? (
                <View style={styles.chipContainer}>
                  {suppliers.map(s => (
                    <Chip
                      key={s.id}
                      selected={supplierName === s.name}
                      onPress={() => setSupplierName(s.name)}
                      style={styles.chip}
                    >
                      {s.name}
                    </Chip>
                  ))}
                </View>
              ) : null}
              
              {showSupplierInput && (
                <TextInput
                  label="New Supplier"
                  value={newSupplier}
                  onChangeText={setNewSupplier}
                  mode="outlined"
                  style={styles.input}
                  right={
                    <TextInput.Icon 
                      icon="check" 
                      onPress={handleAddSupplier}
                    />
                  }
                />
              )}
            </View>
            <IconButton
              icon="plus"
              mode="contained"
              containerColor={colors.primary}
              iconColor={colors.textInverse}
              onPress={() => setShowSupplierInput(!showSupplierInput)}
            />
          </View>

          <View style={styles.dropdownContainer}>
            <View style={{ flex: 1 }}>
              {countries.length > 0 && !showCountryInput ? (
                <View style={styles.chipContainer}>
                  {countries.slice(0, 8).map(c => (
                    <Chip
                      key={c.id}
                      selected={country === c.name}
                      onPress={() => setCountry(c.name)}
                      style={styles.chip}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </View>
              ) : null}
              
              {showCountryInput && (
                <TextInput
                  label="New Country"
                  value={newCountry}
                  onChangeText={setNewCountry}
                  mode="outlined"
                  style={styles.input}
                  right={
                    <TextInput.Icon 
                      icon="check" 
                      onPress={handleAddCountry}
                    />
                  }
                />
              )}
            </View>
            <IconButton
              icon="plus"
              mode="contained"
              containerColor={colors.primary}
              iconColor={colors.textInverse}
              onPress={() => setShowCountryInput(!showCountryInput)}
            />
          </View>

          <TextInput
            label="Remarks (Optional)"
            value={remarks}
            onChangeText={setRemarks}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Containers</Text>
            <Button
              mode="outlined"
              onPress={addContainer}
              icon="plus"
              compact
            >
              Add Container
            </Button>
          </View>

          {containers.map((container, index) => {
            const avgGirthGross = container.cbmGross && container.pcsSupplier
              ? calculateAvgGirth(parseFloat(container.cbmGross), parseInt(container.pcsSupplier))
              : null;
            const avgGirthNet = container.cbmNet && container.pcsSupplier
              ? calculateAvgGirth(parseFloat(container.cbmNet), parseInt(container.pcsSupplier))
              : null;

            return (
              <View key={index} style={styles.containerCard}>
                <View style={styles.containerHeader}>
                  <Text variant="titleSmall" style={styles.containerTitle}>
                    Container #{index + 1}
                  </Text>
                  {containers.length > 1 && (
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removeContainer(index)}
                    />
                  )}
                </View>

                <TextInput
                  label="Container Number *"
                  value={container.containerNumber}
                  onChangeText={(v) => updateContainer(index, 'containerNumber', v)}
                  mode="outlined"
                  style={styles.input}
                  dense
                />

                <View style={styles.row}>
                  <TextInput
                    label="CBM Gross"
                    value={container.cbmGross}
                    onChangeText={(v) => updateContainer(index, 'cbmGross', v)}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="decimal-pad"
                    dense
                  />
                  <TextInput
                    label="CBM Net"
                    value={container.cbmNet}
                    onChangeText={(v) => updateContainer(index, 'cbmNet', v)}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="decimal-pad"
                    dense
                  />
                </View>

                <TextInput
                  label="PCS Supplier"
                  value={container.pcsSupplier}
                  onChangeText={(v) => updateContainer(index, 'pcsSupplier', v)}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="number-pad"
                  dense
                />

                {(avgGirthGross || avgGirthNet) && (
                  <View style={styles.calculatedChips}>
                    {avgGirthGross && (
                      <Chip icon="calculator" style={styles.greenChip} textStyle={{ color: colors.success }}>
                        Avg Girth Gross: {avgGirthGross}
                      </Chip>
                    )}
                    {avgGirthNet && (
                      <Chip icon="calculator" style={styles.blueChip} textStyle={{ color: colors.info }}>
                        Avg Girth Net: {avgGirthNet}
                      </Chip>
                    )}
                  </View>
                )}

                <View style={styles.row}>
                  <TextInput
                    label="L Avg"
                    value={container.lAvg}
                    onChangeText={(v) => updateContainer(index, 'lAvg', v)}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="decimal-pad"
                    dense
                  />
                  <TextInput
                    label="Quality"
                    value={container.qualitySupplier}
                    onChangeText={(v) => updateContainer(index, 'qualitySupplier', v)}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    dense
                  />
                </View>
              </View>
            );
          })}
        </View>

        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((err, i) => (
              <HelperText key={i} type="error" visible={true}>
                {err}
              </HelperText>
            ))}
          </View>
        )}

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
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          buttonColor={colors.primary}
        >
          Save Purchase
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
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 8,
    borderBottomColor: colors.surfaceVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  containerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  containerTitle: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  calculatedChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
  },
  greenChip: {
    backgroundColor: colors.successLight,
  },
  blueChip: {
    backgroundColor: colors.infoLight,
  },
  errorContainer: {
    padding: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});