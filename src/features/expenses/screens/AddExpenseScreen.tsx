import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { FinancialType, PaymentMethod } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../../../shared/hooks/useToast';
import { CategoryPicker } from '../../../shared/components/CategoryPicker';

type AddExpenseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

const GROUP_ICONS = ['card', 'wallet', 'cash', 'cart', 'pricetag', 'layers', 'albums', 'folder'];
const GROUP_COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

export default function AddExpenseScreen() {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const { addExpense, addExpenseWithInstallments, updateExpense, expenses, preferences, categories: allCategories, ensureDefaultCategories, paymentGroups, loadPaymentGroups, addPaymentGroup } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess } = useToast();

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

  // Payment Method State
  const [installments, setInstallments] = useState('1');
  const [currentStep, setCurrentStep] = useState(1);

  // Installments State (independiente de tarjeta)
  const [hasInstallments, setHasInstallments] = useState(false);
  const [startingInstallment, setStartingInstallment] = useState('1'); // Cuota desde la que empezamos
  const [selectedPaymentGroupId, setSelectedPaymentGroupId] = useState<string | null>(null);

  // Estado para cuotas en modo edición
  const [isPartOfInstallments, setIsPartOfInstallments] = useState(false);
  const [parentExpense, setParentExpense] = useState<any>(null);
  const [siblingInstallments, setSiblingInstallments] = useState<any[]>([]);


  // Quick Add Payment Group Modal State
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('card');
  const [newGroupColor, setNewGroupColor] = useState('#9C27B0');


  useEffect(() => {
    // Ensure we have default categories if the list is empty or small
    ensureDefaultCategories();
    // Load payment groups for installment selector
    loadPaymentGroups();
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
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const numAmount = parseCurrencyInput(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    // Validar que el monto no sea absurdamente grande (máximo 1 billón)
    if (numAmount > 1000000000000) {
      Alert.alert('Error', 'El monto ingresado es demasiado grande');
      return;
    }

    if (selectedCategoryIds.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos una categoría');
      return;
    }

    if (isEditing && expenseId) {
      await updateExpense(expenseId, {
        amount: numAmount,
        description,
        categoryIds: selectedCategoryIds,
        date: date.toISOString(),
        financialType: financialType,
      });
      showSuccess('Gasto actualizado correctamente');
      navigation.goBack();
    } else {
      // Gasto en cuotas
      if (hasInstallments && parseInt(installments) > 1) {
        const numInstallments = parseInt(installments);
        const startingInst = parseInt(startingInstallment) || 1;

        // Calcular la fecha de la primera cuota basándose en qué cuota estamos pagando
        let firstInstallmentDate = new Date(date);
        if (startingInst > 1) {
          // Si estamos pagando la cuota 6, la primera cuota fue hace 5 meses
          firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() - (startingInst - 1));
        }

        await addExpenseWithInstallments({
          amount: numAmount,
          description,
          categoryIds: selectedCategoryIds,
          date: firstInstallmentDate.toISOString(),
          financialType: financialType,
          paymentMethod: 'cash',
          installments: numInstallments,
          paymentGroupId: selectedPaymentGroupId || undefined,
        });
        showSuccess(`Gasto en ${numInstallments} cuotas registrado (pagando cuota ${startingInst})`);
        navigation.goBack();
      }
      // Gasto normal
      else {
        await addExpense({
          amount: numAmount,
          description,
          categoryIds: selectedCategoryIds,
          date: date.toISOString(),
          financialType: financialType,
          paymentMethod: 'cash',
        });
        showSuccess('Gasto agregado correctamente');
        navigation.goBack();
      }
    }
  };



  const handleQuickAddGroup = async () => {
    if (newGroupName) {
      const newGroup = await addPaymentGroup({
        name: newGroupName,
        icon: newGroupIcon,
        color: newGroupColor,
      });

      if (newGroup) {
        setSelectedPaymentGroupId(newGroup.id);
        showSuccess(`Grupo "${newGroupName}" creado`);
      }

      setGroupModalVisible(false);
      setNewGroupName('');
      setNewGroupIcon('card');
      setNewGroupColor('#9C27B0');
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

                {/* Sección de Cuotas */}
                {!isEditing && (
                  <View style={{ marginTop: spacing.xxl }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.lg,
                        backgroundColor: currentTheme.card,
                        borderRadius: borderRadius.md,
                        borderWidth: 1,
                        borderColor: hasInstallments ? currentTheme.primary : currentTheme.border,
                      }}
                      onPress={() => {
                        setHasInstallments(!hasInstallments);
                        if (!hasInstallments) {
                          setInstallments('2');
                          setStartingInstallment('1');
                        } else {
                          setInstallments('1');
                          setStartingInstallment('1');
                        }
                      }}
                    >
                      <View style={[common.row, { gap: spacing.md }]}>
                        <View style={[common.iconContainer, {
                          backgroundColor: hasInstallments ? currentTheme.primary + '20' : currentTheme.surface,
                        }]}>
                          <Ionicons
                            name="layers-outline"
                            size={24}
                            color={hasInstallments ? currentTheme.primary : currentTheme.textSecondary}
                          />
                        </View>
                        <View>
                          <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                            Pagar en cuotas
                          </Text>
                          <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                            Divide el pago en varios meses
                          </Text>
                        </View>
                      </View>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: hasInstallments ? currentTheme.primary : currentTheme.border,
                        backgroundColor: hasInstallments ? currentTheme.primary : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {hasInstallments && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {hasInstallments && (
                      <View style={styles.installmentCard}>
                        <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                          Número total de cuotas
                        </Text>
                        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
                          {['2', '3', '6', '12', '18', '24'].map((num) => (
                            <TouchableOpacity
                              key={num}
                              style={{
                                paddingHorizontal: spacing.lg,
                                paddingVertical: spacing.md,
                                borderRadius: spacing.sm,
                                backgroundColor: installments === num ? currentTheme.primary : currentTheme.surface,
                                borderWidth: 1,
                                borderColor: installments === num ? currentTheme.primary : currentTheme.border,
                                minWidth: 44,
                                alignItems: 'center',
                              }}
                              onPress={() => {
                                setInstallments(num);
                                // Reset starting installment si es mayor que el nuevo total
                                if (parseInt(startingInstallment) > parseInt(num)) {
                                  setStartingInstallment('1');
                                }
                              }}
                            >
                              <Text style={[typography.body, {
                                color: installments === num ? '#FFFFFF' : currentTheme.text,
                                fontWeight: installments === num ? 'bold' : 'normal',
                              }]}>
                                {num}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {/* Input personalizado mejorado */}
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.md,
                              borderRadius: spacing.sm,
                              backgroundColor: !['2', '3', '6', '12', '18', '24'].includes(installments) ? currentTheme.primary : currentTheme.surface,
                              borderWidth: 1,
                              borderColor: !['2', '3', '6', '12', '18', '24'].includes(installments) ? currentTheme.primary : currentTheme.border,
                              minWidth: 60,
                              alignItems: 'center',
                            }}
                            onPress={() => {
                              // Si ya está seleccionado "otro", no hacer nada
                              if (!['2', '3', '6', '12', '18', '24'].includes(installments)) return;
                              setInstallments('');
                            }}
                          >
                            {!['2', '3', '6', '12', '18', '24'].includes(installments) ? (
                              <TextInput
                                style={{
                                  color: '#FFFFFF',
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontSize: 14,
                                  minWidth: 36,
                                  padding: 0,
                                  margin: 0,
                                }}
                                value={installments}
                                onChangeText={(text) => {
                                  const num = text.replace(/[^0-9]/g, '');
                                  setInstallments(num);
                                  // Reset starting si es mayor
                                  if (parseInt(startingInstallment) > parseInt(num || '1')) {
                                    setStartingInstallment('1');
                                  }
                                }}
                                keyboardType="numeric"
                                placeholder="##"
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                autoFocus
                              />
                            ) : (
                              <Text style={[typography.body, { color: currentTheme.text }]}>Otro</Text>
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* Selector de cuota inicial */}
                        {parseInt(installments) > 1 && (
                          <View style={{ marginTop: spacing.lg }}>
                            <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                              ¿Cuál cuota pagas hoy?
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={[common.row, { gap: spacing.xs }]}>
                                {Array.from({ length: parseInt(installments) || 0 }, (_, i) => i + 1).map((num) => (
                                  <TouchableOpacity
                                    key={num}
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 20,
                                      backgroundColor: startingInstallment === String(num) ? currentTheme.primary : currentTheme.surface,
                                      borderWidth: 1,
                                      borderColor: startingInstallment === String(num) ? currentTheme.primary : currentTheme.border,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}
                                    onPress={() => setStartingInstallment(String(num))}
                                  >
                                    <Text style={[typography.caption, {
                                      color: startingInstallment === String(num) ? '#FFFFFF' : currentTheme.text,
                                      fontWeight: startingInstallment === String(num) ? 'bold' : 'normal',
                                    }]}>
                                      {num}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </ScrollView>
                            {parseInt(startingInstallment) > 1 && (
                              <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: spacing.xs, fontStyle: 'italic' }]}>
                                Se crearán las cuotas 1-{parseInt(startingInstallment) - 1} como ya pagadas
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Preview de cuotas */}
                        {amount && parseInt(installments) > 1 && (
                          <View style={styles.installmentPreview}>
                            <Text style={[typography.body, { color: currentTheme.text }]}>
                              <Text style={{ fontWeight: 'bold' }}>{installments} cuotas</Text> de{' '}
                              <Text style={{ fontWeight: 'bold', color: currentTheme.primary }}>
                                ${((parseCurrencyInput(amount) || 0) / parseInt(installments || '1')).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Text>
                            </Text>
                            <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.xs }]}>
                              {parseInt(startingInstallment) === 1
                                ? `Primera cuota: ${format(date, 'MMMM yyyy', { locale: es })}`
                                : `Pagando cuota ${startingInstallment}/${installments} en ${format(date, 'MMMM yyyy', { locale: es })}`
                              }
                            </Text>
                          </View>
                        )}

                        {/* Selector de Grupo de Pago (opcional) */}
                        {parseInt(installments) > 1 && (
                          <View style={{ marginTop: spacing.lg }}>
                            <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                              Agrupar en (opcional)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={[common.row, { gap: spacing.sm }]}>
                                <TouchableOpacity
                                  style={[styles.groupChip, {
                                    backgroundColor: !selectedPaymentGroupId ? currentTheme.primary : currentTheme.surface,
                                    borderColor: !selectedPaymentGroupId ? currentTheme.primary : currentTheme.border,
                                  }]}
                                  onPress={() => setSelectedPaymentGroupId(null)}
                                >
                                  <Ionicons
                                    name="close-circle-outline"
                                    size={16}
                                    color={!selectedPaymentGroupId ? '#FFFFFF' : currentTheme.textSecondary}
                                  />
                                  <Text style={[typography.caption, {
                                    color: !selectedPaymentGroupId ? '#FFFFFF' : currentTheme.text,
                                    fontWeight: !selectedPaymentGroupId ? 'bold' : 'normal',
                                  }]}>
                                    Sin grupo
                                  </Text>
                                </TouchableOpacity>
                                {paymentGroups.map((group) => (
                                  <TouchableOpacity
                                    key={group.id}
                                    style={[styles.groupChip, {
                                      backgroundColor: selectedPaymentGroupId === group.id ? group.color : currentTheme.surface,
                                      borderColor: selectedPaymentGroupId === group.id ? group.color : currentTheme.border,
                                    }]}
                                    onPress={() => setSelectedPaymentGroupId(group.id)}
                                  >
                                    <Ionicons
                                      name={group.icon as any}
                                      size={16}
                                      color={selectedPaymentGroupId === group.id ? '#FFFFFF' : group.color}
                                    />
                                    <Text style={[typography.caption, {
                                      color: selectedPaymentGroupId === group.id ? '#FFFFFF' : currentTheme.text,
                                      fontWeight: selectedPaymentGroupId === group.id ? 'bold' : 'normal',
                                    }]}>
                                      {group.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                                {/* Botón + para crear grupo */}
                                <TouchableOpacity
                                  style={styles.addGroupButton}
                                  onPress={() => setGroupModalVisible(true)}
                                >
                                  <Ionicons name="add" size={20} color={currentTheme.primary} />
                                </TouchableOpacity>
                              </View>
                            </ScrollView>
                            <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: spacing.xs, fontStyle: 'italic' }]}>
                              Agrupa cuotas para pagarlas juntas como "resumen"
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxxl, marginBottom: spacing.xxxl }}>
                    <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, marginTop: 0, marginBottom: 0 }]}
                        onPress={handleSave}
                    >
                        <Text style={[typography.button, { color: '#FFFFFF' }]}>
                          {isEditing ? 'Actualizar' : hasInstallments ? `Guardar en ${installments} cuotas` : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </>
      </ScrollView>

      {/* Category Quick Add Modal is now inside CategoryPicker */}
      {/* Quick Add Payment Group Modal */}
      <Modal visible={groupModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setGroupModalVisible(false)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={common.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>Nuevo Grupo de Pago</Text>

                <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>Nombre</Text>
                <TextInput
                  style={common.input}
                  placeholder="Ej: TC Macro, Cuotas Tienda"
                  placeholderTextColor={currentTheme.textSecondary}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  autoFocus
                />

                <Text style={[typography.label, { color: currentTheme.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Icono</Text>
                <View style={styles.grid}>
                  {['card', 'wallet', 'cash', 'cart', 'pricetag', 'layers', 'albums', 'folder'].map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.selectionItem, newGroupIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                      onPress={() => setNewGroupIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>Color</Text>
                <View style={styles.grid}>
                  {GROUP_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.selectionItem, newGroupColor === color && styles.selectedItem, { backgroundColor: color }]}
                      onPress={() => setNewGroupColor(color)}
                    />
                  ))}
                </View>

                <View style={[common.rowBetween, { marginTop: spacing.xl }]}>
                  <TouchableOpacity style={{ padding: spacing.md }} onPress={() => setGroupModalVisible(false)}>
                    <Text style={[typography.body, { color: currentTheme.primary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ padding: spacing.md }} onPress={handleQuickAddGroup}>
                    <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Crear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
