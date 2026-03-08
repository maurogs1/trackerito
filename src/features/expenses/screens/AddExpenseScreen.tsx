import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { FinancialType } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../../../shared/hooks/useToast';
import { CategoryPicker } from '../../../shared/components/CategoryPicker';

type AddExpenseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;


export default function AddExpenseScreen() {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const { addExpense, updateExpense, expenses, preferences, categories: allCategories, ensureDefaultCategories, spaces, activeSpaceId } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const expenseId = route.params?.expenseId;
  const isEditing = !!expenseId;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [financialType, setFinancialType] = useState<FinancialType>('unclassified');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(activeSpaceId);

  // Estado para cuotas en modo edición (read-only display)
  const [isPartOfInstallments, setIsPartOfInstallments] = useState(false);
  const [parentExpense, setParentExpense] = useState<any>(null);
  const [siblingInstallments, setSiblingInstallments] = useState<any[]>([]);


  useEffect(() => {
    ensureDefaultCategories();
  }, []);

  useEffect(() => {
    if (isEditing && expenseId) {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        setAmount(expense.amount.toString());
        setDescription(expense.description);
        setSelectedCategoryIds(expense.categoryIds || []);
        setFinancialType(expense.financialType || 'unclassified');
        setDate(new Date(expense.date));
        navigation.setOptions({ title: 'Editar Gasto' });

        // Verificar si es parte de cuotas
        if (expense.parentExpenseId) {
          // Es una cuota hija
          setIsPartOfInstallments(true);
          const parent = expenses.find(e => e.id === expense.parentExpenseId);
          setParentExpense(parent);
          // Buscar todas las cuotas hermanas
          const siblings = expenses
            .filter(e => e.parentExpenseId === expense.parentExpenseId)
            .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
          setSiblingInstallments(siblings);
        } else if (expense.isParent) {
          // Es el gasto padre
          setIsPartOfInstallments(true);
          setParentExpense(expense);
          const children = expenses
            .filter(e => e.parentExpenseId === expense.id)
            .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
          setSiblingInstallments(children);
        }
      }
    }
  }, [expenseId, isEditing, expenses]);

  useEffect(() => {
    if (route.params?.amount) {
      setAmount(formatCurrencyInput(route.params.amount.toString()));
    }
    if (route.params?.description) {
      setDescription(route.params.description);
    }
  }, [route.params]);



  const handleAmountChange = (text: string) => {
    const formatted = formatCurrencyInput(text);
    setAmount(formatted);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleWebDateChange = (event: any) => {
    const dateString = event.target.value;
    if (dateString) {
      // dateString is YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(Number);
      setDate(new Date(year, month - 1, day));
    }
  };

  const handleSave = async () => {
    if (!amount || !description) {
      showError('Por favor completa todos los campos');
      return;
    }

    const numAmount = parseCurrencyInput(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showError('Por favor ingresa un monto válido');
      return;
    }

    if (numAmount > 1000000000000) {
      showError('El monto ingresado es demasiado grande');
      return;
    }

    if (selectedCategoryIds.length === 0) {
      showError('Por favor selecciona al menos una categoría');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && expenseId) {
        await updateExpense(expenseId, {
          amount: numAmount,
          description,
          categoryIds: selectedCategoryIds,
          date: date.toISOString(),
          financialType: financialType,
        });
        showSuccess('Gasto actualizado correctamente');
      } else {
        await addExpense({
          amount: numAmount,
          description,
          categoryIds: selectedCategoryIds,
          date: date.toISOString(),
          financialType: financialType,
          paymentMethod: 'cash',
          spaceId: selectedSpaceId || undefined,
        });
        showSuccess('Gasto agregado correctamente');
      }
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: FinancialType) => {
    switch (type) {
      case 'needs': return '#4CAF50'; // Green
      case 'wants': return '#FF9800'; // Orange
      case 'savings': return '#2196F3'; // Blue
      default: return currentTheme.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
    },
    label: {
      ...typography.body,
      color: currentTheme.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    inputContainer: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      height: 50,
      justifyContent: 'center',
    },
    inputFocused: {
      borderColor: currentTheme.primary,
    },
    inputField: {
      color: currentTheme.text,
      paddingHorizontal: spacing.lg,
      fontSize: 16,
      height: '100%',
      ...Platform.select({
        web: {
          outlineStyle: 'none',
        }
      }),
      textAlignVertical: 'center',
    } as any,
    saveButton: {
      backgroundColor: currentTheme.primary,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xxxl,
      marginBottom: spacing.xxxl,
    },
    typeContainer: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.card,
    },
    typeButtonSelected: {
      borderWidth: 2,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    selectionItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedItem: {
      borderColor: currentTheme.text,
    },
    installmentCard: {
      marginTop: spacing.md,
      padding: spacing.lg,
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    installmentInfoCard: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      backgroundColor: currentTheme.primary + '10',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.primary + '30',
    },
    installmentChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      borderWidth: 1,
    },
    installmentPreview: {
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: currentTheme.primary + '10',
      borderRadius: spacing.sm,
    },
    groupChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    addGroupButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: currentTheme.surface,
      borderWidth: 1,
      borderColor: currentTheme.primary,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
            <>
                <Text style={styles.label}>Monto</Text>
                <View style={[styles.inputContainer, isAmountFocused && styles.inputFocused]}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="0,00"
                    placeholderTextColor={currentTheme.textSecondary}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                    onFocus={() => setIsAmountFocused(true)}
                    onBlur={() => setIsAmountFocused(false)}
                    autoFocus
                  />
                </View>

                <Text style={styles.label}>Descripción</Text>
                <View style={[styles.inputContainer, isDescriptionFocused && styles.inputFocused]}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="¿Qué compraste?"
                    placeholderTextColor={currentTheme.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setIsDescriptionFocused(true)}
                    onBlur={() => setIsDescriptionFocused(false)}
                  />
                </View>

                <Text style={styles.label}>Fecha</Text>
                <View style={styles.inputContainer}>
                  {Platform.OS === 'web' ? (
                    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
                      {/* @ts-ignore - React Native Web specific */}
                      {React.createElement('input', {
                        type: 'date',
                        value: format(date, 'yyyy-MM-dd'),
                        onChange: handleWebDateChange,
                        style: {
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: currentTheme.text,
                          fontSize: '16px',
                          fontFamily: 'System',
                          width: '100%',
                          height: '100%',
                          outline: 'none'
                        }
                      })}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[common.row, { paddingHorizontal: spacing.lg, height: '100%' }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: spacing.md }} />
                      <Text style={[typography.body, { color: currentTheme.text }]}>
                        {format(date, 'dd/MM/yyyy', { locale: es })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {Platform.OS !== 'web' && showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                {/* Info de Cuotas (solo en modo edición) */}
                {isEditing && isPartOfInstallments && siblingInstallments.length > 0 && (
                  <View style={styles.installmentInfoCard}>
                    <View style={[common.row, { marginBottom: spacing.md }]}>
                      <Ionicons name="layers" size={20} color={currentTheme.primary} />
                      <Text style={[typography.bodyBold, { color: currentTheme.text, marginLeft: spacing.sm }]}>
                        Pago en Cuotas
                      </Text>
                    </View>

                    {/* Info del gasto original */}
                    {parentExpense && (
                      <View style={{ marginBottom: spacing.md }}>
                        <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Compra original:</Text>
                        <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                          {parentExpense.description?.replace(/ - Cuota \d+\/\d+$/, '')}
                        </Text>
                        <Text style={[typography.bodyBold, { color: currentTheme.primary, fontSize: 16 }]}>
                          Total: ${parentExpense.totalAmount?.toLocaleString('es-AR') || (siblingInstallments.reduce((sum: number, e: any) => sum + e.amount, 0)).toLocaleString('es-AR')}
                        </Text>
                      </View>
                    )}

                    {/* Lista de cuotas */}
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                      Cuotas ({siblingInstallments.filter((e: any) => e.paymentStatus === 'paid').length}/{siblingInstallments.length} pagadas):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.sm }}>
                      <View style={[common.row, { gap: spacing.sm, paddingHorizontal: spacing.sm }]}>
                        {siblingInstallments.map((inst: any) => {
                          const isCurrent = inst.id === expenseId;
                          const isPaid = inst.paymentStatus === 'paid';
                          return (
                            <TouchableOpacity
                              key={inst.id}
                              style={[styles.installmentChip, {
                                backgroundColor: isCurrent ? currentTheme.primary : isPaid ? currentTheme.success + '20' : currentTheme.card,
                                borderColor: isCurrent ? currentTheme.primary : isPaid ? currentTheme.success : currentTheme.border,
                              }]}
                              onPress={() => {
                                if (!isCurrent) {
                                  navigation.setParams({ expenseId: inst.id });
                                }
                              }}
                            >
                              <Text style={[typography.caption, {
                                color: isCurrent ? '#FFFFFF' : isPaid ? currentTheme.success : currentTheme.text,
                                fontWeight: isCurrent ? 'bold' : 'normal',
                              }]}>
                                {inst.installmentNumber}/{siblingInstallments.length}
                              </Text>
                              <Text style={[typography.small, {
                                color: isCurrent ? 'rgba(255,255,255,0.8)' : currentTheme.textSecondary,
                              }]}>
                                ${inst.amount?.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                              </Text>
                              {isPaid && !isCurrent && (
                                <Ionicons name="checkmark-circle" size={12} color={currentTheme.success} style={{ position: 'absolute', top: 2, right: 2 }} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>

                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' }]}>
                      Toca una cuota para editarla
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: spacing.lg }}>
                  <CategoryPicker
                    selectedIds={selectedCategoryIds}
                    onSelectionChange={setSelectedCategoryIds}
                    onManageCategories={() => navigation.navigate('Categories')}
                    onCategorySelected={(categoryId) => {
                      const category = allCategories.find(c => c.id === categoryId);
                      if (category?.financialType && !selectedCategoryIds.includes(categoryId)) {
                        setFinancialType(category.financialType);
                      }
                    }}
                  />
                </View>

                <Text style={styles.label}>Clasificación Financiera</Text>
                <View style={styles.typeContainer}>
                  {(['needs', 'wants', 'savings'] as FinancialType[]).map((type) => {
                    const isSelected = financialType === type;
                    const color = getTypeColor(type);
                    const label = type === 'needs' ? 'Necesidad' : type === 'wants' ? 'Deseo' : 'Ahorro';
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          isSelected && styles.typeButtonSelected,
                          isSelected && { backgroundColor: color, borderColor: color }
                        ]}
                        onPress={() => setFinancialType(type)}
                      >
                        <Text style={[typography.bodyBold, { color: isSelected ? '#FFFFFF' : color }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {spaces.length > 1 && (
                  <>
                    <Text style={styles.label}>Espacio</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
                      {spaces.map((space) => {
                        const isSelected = selectedSpaceId === space.id;
                        return (
                          <TouchableOpacity
                            key={space.id}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full || 20, borderWidth: 1.5, borderColor: isSelected ? space.color : currentTheme.border, backgroundColor: isSelected ? space.color + '18' : currentTheme.surface }}
                            onPress={() => setSelectedSpaceId(space.id)}
                          >
                            <Ionicons name={space.icon as any} size={14} color={isSelected ? space.color : currentTheme.textSecondary} />
                            <Text style={[typography.bodyBold, { color: isSelected ? space.color : currentTheme.textSecondary, fontSize: 13 }]}>{space.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxxl, marginBottom: spacing.xxxl }}>
                    <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, marginTop: 0, marginBottom: 0, opacity: isSaving ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving
                          ? <ActivityIndicator color="#FFFFFF" size="small" />
                          : <Text style={[typography.button, { color: '#FFFFFF' }]}>{isEditing ? 'Actualizar' : 'Guardar'}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </>
      </ScrollView>

    </View>
  );
}
