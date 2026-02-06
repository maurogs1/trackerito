import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay, formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { Income, IncomeType, RecurringFrequency, INCOME_TYPE_LABELS, INCOME_TYPE_ICONS, INCOME_TYPE_COLORS, FREQUENCY_LABELS, FREQUENCY_DESCRIPTIONS } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '../../../shared/hooks/useToast';

export default function IncomeScreen() {
  const {
    incomes,
    loadIncomes,
    addIncome,
    updateIncome,
    removeIncome,
    getMonthlyIncome,
    getBalance,
    isLoadingIncomes,
    preferences,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<IncomeType>('salary');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState('1');
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');

  const balance = getBalance();
  const monthlyIncome = getMonthlyIncome();

  useEffect(() => {
    loadIncomes();
  }, []);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedType('salary');
    setDate(new Date());
    setIsRecurring(false);
    setRecurringDay('1');
    setRecurringFrequency('monthly');
    setEditingIncome(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (income: Income) => {
    setEditingIncome(income);
    setAmount(formatCurrencyInput(income.amount.toString()));
    setDescription(income.description);
    setSelectedType(income.type);
    setDate(new Date(income.date));
    setIsRecurring(income.isRecurring);
    setRecurringDay(income.recurringDay?.toString() || '1');
    setRecurringFrequency(income.recurringFrequency || 'monthly');
    setShowModal(true);
  };

  const handleSave = async () => {
    const numAmount = parseCurrencyInput(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Ingresa una descripción');
      return;
    }

    try {
      if (editingIncome) {
        await updateIncome(editingIncome.id, {
          amount: numAmount,
          description: description.trim(),
          type: selectedType,
          date: format(date, 'yyyy-MM-dd'),
          isRecurring,
          recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
        showSuccess('Ingreso actualizado');
      } else {
        await addIncome({
          amount: numAmount,
          description: description.trim(),
          type: selectedType,
          date: format(date, 'yyyy-MM-dd'),
          isRecurring,
          recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
        showSuccess('Ingreso agregado');
      }
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      showError(error.message || 'Error al guardar');
    }
  };

  const handleDelete = (income: Income) => {
    Alert.alert(
      'Eliminar Ingreso',
      `¿Eliminar "${income.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeIncome(income.id);
              showSuccess('Ingreso eliminado');
            } catch (error: any) {
              showError(error.message || 'Error al eliminar');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      padding: spacing.xl,
      backgroundColor: currentTheme.success,
      borderBottomLeftRadius: borderRadius.lg + 8,
      borderBottomRightRadius: borderRadius.lg + 8,
    },
    content: {
      padding: spacing.xl,
    },
    incomeCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    incomeInfo: {
      flex: 1,
    },
    recurringBadge: {
      backgroundColor: currentTheme.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: 30,
      backgroundColor: currentTheme.success,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
      shadowColor: currentTheme.success,
      shadowOpacity: 0.4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.background,
      gap: spacing.sm,
    },
    typeButtonSelected: {
      borderWidth: 2,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.body, { color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs }]}>
          Ingresos del Mes
        </Text>
        <Text style={[typography.amountLarge, { color: '#FFFFFF' }]}>
          ${formatCurrencyDisplay(monthlyIncome)}
        </Text>
        {balance.totalIncome > 0 && (
          <Text style={[typography.body, { color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm }]}>
            Balance disponible: ${formatCurrencyDisplay(balance.balance)}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingIncomes}
            onRefresh={loadIncomes}
            tintColor={currentTheme.success}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Ingresos Recurrentes */}
        {incomes.filter(i => i.isRecurring).length > 0 && (
          <>
            <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>
              Ingresos Recurrentes
            </Text>
            {incomes
              .filter(i => i.isRecurring)
              .map((income) => (
                <TouchableOpacity
                  key={income.id}
                  style={styles.incomeCard}
                  onPress={() => openEditModal(income)}
                  onLongPress={() => handleDelete(income)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: INCOME_TYPE_COLORS[income.type] + '20' }]}>
                    <Ionicons
                      name={INCOME_TYPE_ICONS[income.type] as any}
                      size={24}
                      color={INCOME_TYPE_COLORS[income.type]}
                    />
                  </View>
                  <View style={styles.incomeInfo}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{income.description}</Text>
                    <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                      {INCOME_TYPE_LABELS[income.type]}
                    </Text>
                    <View style={styles.recurringBadge}>
                      <Text style={[typography.small, { color: currentTheme.primary, fontWeight: '600' }]}>
                        {income.recurringFrequency === 'weekly'
                          ? `Semanal desde día ${income.recurringDay}`
                          : income.recurringFrequency === 'biweekly'
                          ? `Quincenal - Día ${income.recurringDay}`
                          : `Día ${income.recurringDay} de cada mes`
                        }
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.sectionTitle, { color: currentTheme.success }]}>
                    +${formatCurrencyDisplay(income.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* Ingresos Únicos */}
        {incomes.filter(i => !i.isRecurring).length > 0 && (
          <>
            <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xxl, marginBottom: spacing.lg }]}>
              Ingresos Únicos
            </Text>
            {incomes
              .filter(i => !i.isRecurring)
              .map((income) => (
                <TouchableOpacity
                  key={income.id}
                  style={styles.incomeCard}
                  onPress={() => openEditModal(income)}
                  onLongPress={() => handleDelete(income)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: INCOME_TYPE_COLORS[income.type] + '20' }]}>
                    <Ionicons
                      name={INCOME_TYPE_ICONS[income.type] as any}
                      size={24}
                      color={INCOME_TYPE_COLORS[income.type]}
                    />
                  </View>
                  <View style={styles.incomeInfo}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{income.description}</Text>
                    <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                      {INCOME_TYPE_LABELS[income.type]} • {format(new Date(income.date), 'd MMM', { locale: es })}
                    </Text>
                  </View>
                  <Text style={[typography.sectionTitle, { color: currentTheme.success }]}>
                    +${formatCurrencyDisplay(income.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* Empty State */}
        {incomes.length === 0 && !isLoadingIncomes && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.md }]}>
              No tienes ingresos registrados
            </Text>
            <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
              Agrega tu sueldo o ingresos recurrentes{'\n'}para calcular tu balance real
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={common.modalOverlay}>
          <View style={common.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.xl, textAlign: 'center' }]}>
                {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
              </Text>

              <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>Monto</Text>
              <TextInput
                style={common.input}
                placeholder="0,00"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={(text) => setAmount(formatCurrencyInput(text))}
              />

              <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Descripción</Text>
              <TextInput
                style={common.input}
                placeholder="Ej: Sueldo mensual"
                placeholderTextColor={currentTheme.textSecondary}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Tipo</Text>
              <View style={styles.typeContainer}>
                {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      selectedType === type && [
                        styles.typeButtonSelected,
                        { borderColor: INCOME_TYPE_COLORS[type], backgroundColor: INCOME_TYPE_COLORS[type] + '20' },
                      ],
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Ionicons
                      name={INCOME_TYPE_ICONS[type] as any}
                      size={16}
                      color={selectedType === type ? INCOME_TYPE_COLORS[type] : currentTheme.textSecondary}
                    />
                    <Text style={[typography.body, { color: selectedType === type ? INCOME_TYPE_COLORS[type] : currentTheme.text }]}>
                      {INCOME_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={[typography.body, { color: currentTheme.text }]}>Ingreso Recurrente</Text>
                  <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                    Se repite todos los meses
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: isRecurring ? currentTheme.success : currentTheme.border,
                    justifyContent: 'center',
                    padding: 2,
                  }}
                  onPress={() => setIsRecurring(!isRecurring)}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: '#FFFFFF',
                      alignSelf: isRecurring ? 'flex-end' : 'flex-start',
                    }}
                  />
                </TouchableOpacity>
              </View>

              {isRecurring && (
                <>
                  <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                    Frecuencia
                  </Text>
                  <View style={[styles.typeContainer, { marginBottom: spacing.lg }]}>
                    {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.typeButton,
                          recurringFrequency === freq && [
                            styles.typeButtonSelected,
                            { borderColor: currentTheme.success, backgroundColor: currentTheme.success + '20' },
                          ],
                        ]}
                        onPress={() => setRecurringFrequency(freq)}
                      >
                        <Text style={[typography.body, { color: recurringFrequency === freq ? currentTheme.success : currentTheme.text }]}>
                          {FREQUENCY_LABELS[freq]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                    {recurringFrequency === 'weekly' ? 'Día del mes del primer cobro' : 'Día del mes que se cobra'}
                  </Text>
                  <TextInput
                    style={common.input}
                    placeholder="1-31"
                    placeholderTextColor={currentTheme.textSecondary}
                    keyboardType="numeric"
                    value={recurringDay}
                    onChangeText={setRecurringDay}
                  />
                  <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: spacing.xs }]}>
                    {recurringFrequency === 'monthly' && `Se cobra 1 vez al mes (día ${recurringDay || '?'})`}
                    {recurringFrequency === 'biweekly' && `Se cobra 2 veces al mes (día ${recurringDay || '?'} y ${parseInt(recurringDay || '1') + 15 > 31 ? parseInt(recurringDay || '1') + 15 - 31 : parseInt(recurringDay || '1') + 15})`}
                    {recurringFrequency === 'weekly' && `Se cobra cada 7 días desde el día ${recurringDay || '?'}`}
                  </Text>
                </>
              )}

              {!isRecurring && (
                <>
                  <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Fecha</Text>
                  <TouchableOpacity style={common.input} onPress={() => setShowDatePicker(true)}>
                    <Text style={[typography.body, { color: currentTheme.text }]}>
                      {format(date, 'dd/MM/yyyy', { locale: es })}
                    </Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'web' && showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}
                </>
              )}

              <TouchableOpacity
                style={[common.buttonPrimary, { backgroundColor: currentTheme.success, marginTop: spacing.xxl }]}
                onPress={handleSave}
              >
                <Text style={common.buttonPrimaryText}>
                  {editingIncome ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: spacing.lg, alignItems: 'center' }}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
