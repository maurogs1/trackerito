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
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay, formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { Income, IncomeType, INCOME_TYPE_LABELS, INCOME_TYPE_ICONS, INCOME_TYPE_COLORS } from '../types';
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
      padding: 20,
      backgroundColor: currentTheme.success,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 4,
    },
    headerAmount: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 8,
    },
    content: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 16,
    },
    incomeCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
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
      marginRight: 12,
    },
    incomeInfo: {
      flex: 1,
    },
    incomeDescription: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    incomeType: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    incomeAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.success,
    },
    recurringBadge: {
      backgroundColor: currentTheme.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginTop: 4,
    },
    recurringText: {
      fontSize: 10,
      color: currentTheme.primary,
      fontWeight: '600',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      backgroundColor: currentTheme.success,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: currentTheme.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: currentTheme.textSecondary,
      marginTop: 12,
      fontSize: 16,
    },
    emptySubtext: {
      color: currentTheme.textSecondary,
      marginTop: 4,
      fontSize: 14,
      textAlign: 'center',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '90%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    label: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: currentTheme.background,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: currentTheme.text,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.background,
      gap: 6,
    },
    typeButtonSelected: {
      borderWidth: 2,
    },
    typeText: {
      fontSize: 14,
      color: currentTheme.text,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    saveButton: {
      backgroundColor: currentTheme.success,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cancelButton: {
      padding: 16,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: currentTheme.textSecondary,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header con total */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ingresos del Mes</Text>
        <Text style={styles.headerAmount}>${formatCurrencyDisplay(monthlyIncome)}</Text>
        {balance.totalIncome > 0 && (
          <Text style={styles.headerSubtitle}>
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
            <Text style={styles.sectionTitle}>Ingresos Recurrentes</Text>
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
                    <Text style={styles.incomeDescription}>{income.description}</Text>
                    <Text style={styles.incomeType}>{INCOME_TYPE_LABELS[income.type]}</Text>
                    <View style={styles.recurringBadge}>
                      <Text style={styles.recurringText}>
                        Día {income.recurringDay} de cada mes
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.incomeAmount}>
                    +${formatCurrencyDisplay(income.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* Ingresos Únicos */}
        {incomes.filter(i => !i.isRecurring).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ingresos Únicos</Text>
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
                    <Text style={styles.incomeDescription}>{income.description}</Text>
                    <Text style={styles.incomeType}>
                      {INCOME_TYPE_LABELS[income.type]} • {format(new Date(income.date), 'd MMM', { locale: es })}
                    </Text>
                  </View>
                  <Text style={styles.incomeAmount}>
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
            <Text style={styles.emptyText}>No tienes ingresos registrados</Text>
            <Text style={styles.emptySubtext}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
              </Text>

              <Text style={styles.label}>Monto</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={(text) => setAmount(formatCurrencyInput(text))}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Sueldo mensual"
                placeholderTextColor={currentTheme.textSecondary}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Tipo</Text>
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
                    <Text style={[styles.typeText, selectedType === type && { color: INCOME_TYPE_COLORS[type] }]}>
                      {INCOME_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={{ color: currentTheme.text, fontSize: 16 }}>Ingreso Recurrente</Text>
                  <Text style={{ color: currentTheme.textSecondary, fontSize: 12 }}>
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
                  <Text style={styles.label}>Día del mes que se cobra</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1-31"
                    placeholderTextColor={currentTheme.textSecondary}
                    keyboardType="numeric"
                    value={recurringDay}
                    onChangeText={setRecurringDay}
                  />
                </>
              )}

              {!isRecurring && (
                <>
                  <Text style={styles.label}>Fecha</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: currentTheme.text, fontSize: 16 }}>
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

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingIncome ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
