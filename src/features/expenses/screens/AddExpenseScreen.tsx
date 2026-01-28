import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
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

type AddExpenseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

const ICONS = [
  'cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness',
  'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle',
  'paw', 'book', 'briefcase', 'bus', 'call', 'camera', 'card', 'cash', 'desktop', 'gift',
  'globe', 'heart', 'key', 'laptop', 'map', 'musical-notes', 'pizza', 'shirt', 'train', 'wallet', 'wifi'
];
const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

export default function AddExpenseScreen() {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const route = useRoute<AddExpenseScreenRouteProp>();
  const { addExpense, addExpenseWithInstallments, updateExpense, expenses, preferences, getMostUsedCategories, addCategory, categories: allCategories, ensureDefaultCategories, paymentGroups, loadPaymentGroups, addPaymentGroup } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showSuccess } = useToast();

  const expenseId = route.params?.expenseId;
  const isEditing = !!expenseId;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Quick Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(ICONS[0]);
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);

  // Quick Add Payment Group Modal State
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('card');
  const [newGroupColor, setNewGroupColor] = useState('#9C27B0');

  // UI State
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const INITIAL_CATEGORY_COUNT = 6;
  const INITIAL_ICON_COUNT = 15;

  // Track newly added categories to show them at the top
  const [newlyAddedCategoryIds, setNewlyAddedCategoryIds] = useState<string[]>([]);

  const categories = getMostUsedCategories();

  // Sort categories: newly added first, then the rest
  const sortedCategories = useMemo(() => {
    const newCats = allCategories.filter((c: any) => newlyAddedCategoryIds.includes(c.id));
    // Filter out the new ones from the standard list to avoid duplicates if they appear there
    const standardCats = categories.filter((c: any) => !newlyAddedCategoryIds.includes(c.id));
    return [...newCats, ...standardCats];
  }, [categories, allCategories, newlyAddedCategoryIds]);

  const filteredCategories = sortedCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const showSearch = sortedCategories.length > 10;

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

  useEffect(() => {
    if (!isEditing && sortedCategories.length > 0 && selectedCategoryIds.length === 0) {
      // Optional: Select the first one by default, or leave empty
      // setSelectedCategoryIds([categories[0].id]);
    }
  }, [sortedCategories, isEditing, selectedCategoryIds.length]);

  // Update financial type when category changes
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });

    // Optional: Update financial type based on last selected?
    // Or just leave it manual since multiple categories might have conflicting types.
    const category = allCategories.find(c => c.id === categoryId);
    if (category?.financialType && !selectedCategoryIds.includes(categoryId)) {
      // Only update if we are adding a category
      setFinancialType(category.financialType);
    }
  };

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


  const handleQuickAddCategory = async () => {
    if (newCategoryName) {
      const newCategory = await addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });

      if (newCategory) {
        setNewlyAddedCategoryIds(prev => [newCategory.id, ...prev]);
        setSelectedCategoryIds(prev => [...prev, newCategory.id]);
        showSuccess(`Categoría "${newCategoryName}" creada`);
      }

      setModalVisible(false);
      setNewCategoryName('');
      setNewCategoryIcon(ICONS[0]);
      setNewCategoryColor(COLORS[0]);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    label: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginBottom: 8,
      marginTop: 16,
    },
    inputContainer: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
      height: 50, // Fixed height for consistency
      justifyContent: 'center',
    },
    inputFocused: {
      borderColor: currentTheme.primary,
    },
    inputField: {
      color: currentTheme.text,
      paddingHorizontal: 16,
      fontSize: 16,
      height: '100%',
      ...Platform.select({
        web: {
          outlineStyle: 'none',
        }
      }),
      textAlignVertical: 'center', // For Android Text centering

    } as any,
    input: {
      backgroundColor: currentTheme.card,
      color: currentTheme.text,
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      color: currentTheme.text,
      marginLeft: 8,
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.card,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryChipSelected: {
      borderWidth: 2,
    },
    categoryText: {
      color: currentTheme.text,
    },
    categoryTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    addCategoryButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.primary,
      borderStyle: 'dashed',
    },
    saveButton: {
      backgroundColor: currentTheme.primary,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    // Type Selector Styles
    typeContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.card,
    },
    typeButtonSelected: {
      borderWidth: 2,
    },
    typeText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.textSecondary,
    },
    typeTextSelected: {
      color: '#FFFFFF',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      padding: 20,
      borderRadius: 16,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: currentTheme.text,
    },
    sectionLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
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
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 16,
    },
    button: {
      padding: 10,
    },
    buttonText: {
      color: currentTheme.primary,
      fontWeight: 'bold',
    },
  });

  const getTypeColor = (type: FinancialType) => {
    switch (type) {
      case 'needs': return '#4CAF50'; // Green
      case 'wants': return '#FF9800'; // Orange
      case 'savings': return '#2196F3'; // Blue
      default: return currentTheme.textSecondary;
    }
  };

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
                    <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
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
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: '100%' }}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                      <Text style={{ color: currentTheme.text, fontSize: 16 }}>
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
                  <View style={{
                    marginTop: 16,
                    padding: 16,
                    backgroundColor: currentTheme.primary + '10',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: currentTheme.primary + '30',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="layers" size={20} color={currentTheme.primary} />
                      <Text style={{ color: currentTheme.text, fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
                        Pago en Cuotas
                      </Text>
                    </View>

                    {/* Info del gasto original */}
                    {parentExpense && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={{ color: currentTheme.textSecondary, fontSize: 12 }}>Compra original:</Text>
                        <Text style={{ color: currentTheme.text, fontSize: 14, fontWeight: '600' }}>
                          {parentExpense.description?.replace(/ - Cuota \d+\/\d+$/, '')}
                        </Text>
                        <Text style={{ color: currentTheme.primary, fontSize: 16, fontWeight: 'bold' }}>
                          Total: ${parentExpense.totalAmount?.toLocaleString('es-AR') || (siblingInstallments.reduce((sum: number, e: any) => sum + e.amount, 0)).toLocaleString('es-AR')}
                        </Text>
                      </View>
                    )}

                    {/* Lista de cuotas */}
                    <Text style={{ color: currentTheme.textSecondary, fontSize: 12, marginBottom: 8 }}>
                      Cuotas ({siblingInstallments.filter((e: any) => e.paymentStatus === 'paid').length}/{siblingInstallments.length} pagadas):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8 }}>
                      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 8 }}>
                        {siblingInstallments.map((inst: any) => {
                          const isCurrent = inst.id === expenseId;
                          const isPaid = inst.paymentStatus === 'paid';
                          return (
                            <TouchableOpacity
                              key={inst.id}
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 8,
                                backgroundColor: isCurrent ? currentTheme.primary : isPaid ? currentTheme.success + '20' : currentTheme.card,
                                borderWidth: 1,
                                borderColor: isCurrent ? currentTheme.primary : isPaid ? currentTheme.success : currentTheme.border,
                              }}
                              onPress={() => {
                                if (!isCurrent) {
                                  navigation.setParams({ expenseId: inst.id });
                                }
                              }}
                            >
                              <Text style={{
                                color: isCurrent ? '#FFFFFF' : isPaid ? currentTheme.success : currentTheme.text,
                                fontWeight: isCurrent ? 'bold' : 'normal',
                                fontSize: 12,
                              }}>
                                {inst.installmentNumber}/{siblingInstallments.length}
                              </Text>
                              <Text style={{
                                color: isCurrent ? 'rgba(255,255,255,0.8)' : currentTheme.textSecondary,
                                fontSize: 10,
                              }}>
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

                    <Text style={{ color: currentTheme.textSecondary, fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>
                      Toca una cuota para editarla
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, color: currentTheme.textSecondary }}>Categoría</Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: currentTheme.card,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    borderWidth: 1,
                    borderColor: isSearchFocused ? currentTheme.primary : currentTheme.border,
                    flex: 1,
                    marginLeft: 12,
                    height: 36
                  }}>
                    <Ionicons name="search" size={16} color={isSearchFocused ? currentTheme.primary : currentTheme.textSecondary} />
                    <TextInput
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        color: currentTheme.text,
                        paddingVertical: 0,
                        fontSize: 14,
                        height: '100%',
                        ...Platform.select({
                          web: {
                            outlineStyle: 'none'
                          }
                        })
                      } as any}
                      placeholder="Buscar..."
                      placeholderTextColor={currentTheme.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={currentTheme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.categoryContainer}>
                  {filteredCategories.slice(0, showAllCategories ? undefined : INITIAL_CATEGORY_COUNT).map((cat: any) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipSelected,
                          isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                        ]}
                        onPress={() => handleCategorySelect(cat.id)}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={16}
                          color={isSelected ? '#FFFFFF' : cat.color}
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            isSelected && styles.categoryTextSelected,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {filteredCategories.length > INITIAL_CATEGORY_COUNT && (
                    <TouchableOpacity
                      style={styles.categoryChip}
                      onPress={() => setShowAllCategories(!showAllCategories)}
                    >
                      <Text style={styles.categoryText}>
                        {showAllCategories ? 'Ver menos' : `Ver más (${filteredCategories.length - INITIAL_CATEGORY_COUNT})`}
                      </Text>
                      <Ionicons name={showAllCategories ? "chevron-up" : "chevron-down"} size={16} color={currentTheme.text} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.addCategoryButton}
                    onPress={() => setModalVisible(true)}
                  >
                    <Ionicons name="add" size={24} color={currentTheme.primary} />
                  </TouchableOpacity>
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
                        <Text style={[styles.typeText, isSelected && styles.typeTextSelected, !isSelected && { color }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Sección de Cuotas */}
                {!isEditing && (
                  <View style={{ marginTop: 24 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 16,
                        backgroundColor: currentTheme.card,
                        borderRadius: 12,
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: hasInstallments ? currentTheme.primary + '20' : currentTheme.surface,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Ionicons
                            name="layers-outline"
                            size={24}
                            color={hasInstallments ? currentTheme.primary : currentTheme.textSecondary}
                          />
                        </View>
                        <View>
                          <Text style={{ color: currentTheme.text, fontSize: 16, fontWeight: '600' }}>
                            Pagar en cuotas
                          </Text>
                          <Text style={{ color: currentTheme.textSecondary, fontSize: 12 }}>
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
                      <View style={{
                        marginTop: 12,
                        padding: 16,
                        backgroundColor: currentTheme.card,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: currentTheme.border,
                      }}>
                        <Text style={{ color: currentTheme.textSecondary, marginBottom: 8 }}>
                          Número total de cuotas
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {['2', '3', '6', '12', '18', '24'].map((num) => (
                            <TouchableOpacity
                              key={num}
                              style={{
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                borderRadius: 8,
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
                              <Text style={{
                                color: installments === num ? '#FFFFFF' : currentTheme.text,
                                fontWeight: installments === num ? 'bold' : 'normal',
                              }}>
                                {num}
                              </Text>
                            </TouchableOpacity>
                          ))}
                          {/* Input personalizado mejorado */}
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 8,
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
                              <Text style={{ color: currentTheme.text }}>Otro</Text>
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* Selector de cuota inicial */}
                        {parseInt(installments) > 1 && (
                          <View style={{ marginTop: 16 }}>
                            <Text style={{ color: currentTheme.textSecondary, marginBottom: 8 }}>
                              ¿Cuál cuota pagas hoy?
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={{ flexDirection: 'row', gap: 6 }}>
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
                                    <Text style={{
                                      color: startingInstallment === String(num) ? '#FFFFFF' : currentTheme.text,
                                      fontWeight: startingInstallment === String(num) ? 'bold' : 'normal',
                                      fontSize: 12,
                                    }}>
                                      {num}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </ScrollView>
                            {parseInt(startingInstallment) > 1 && (
                              <Text style={{ color: currentTheme.textSecondary, fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
                                Se crearán las cuotas 1-{parseInt(startingInstallment) - 1} como ya pagadas
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Preview de cuotas */}
                        {amount && parseInt(installments) > 1 && (
                          <View style={{
                            marginTop: 16,
                            padding: 12,
                            backgroundColor: currentTheme.primary + '10',
                            borderRadius: 8,
                          }}>
                            <Text style={{ color: currentTheme.text, fontSize: 14 }}>
                              <Text style={{ fontWeight: 'bold' }}>{installments} cuotas</Text> de{' '}
                              <Text style={{ fontWeight: 'bold', color: currentTheme.primary }}>
                                ${((parseCurrencyInput(amount) || 0) / parseInt(installments || '1')).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </Text>
                            </Text>
                            <Text style={{ color: currentTheme.textSecondary, fontSize: 12, marginTop: 4 }}>
                              {parseInt(startingInstallment) === 1
                                ? `Primera cuota: ${format(date, 'MMMM yyyy', { locale: es })}`
                                : `Pagando cuota ${startingInstallment}/${installments} en ${format(date, 'MMMM yyyy', { locale: es })}`
                              }
                            </Text>
                          </View>
                        )}

                        {/* Selector de Grupo de Pago (opcional) */}
                        {parseInt(installments) > 1 && (
                          <View style={{ marginTop: 16 }}>
                            <Text style={{ color: currentTheme.textSecondary, marginBottom: 8 }}>
                              Agrupar en (opcional)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                <TouchableOpacity
                                  style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: !selectedPaymentGroupId ? currentTheme.primary : currentTheme.surface,
                                    borderWidth: 1,
                                    borderColor: !selectedPaymentGroupId ? currentTheme.primary : currentTheme.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                  onPress={() => setSelectedPaymentGroupId(null)}
                                >
                                  <Ionicons
                                    name="close-circle-outline"
                                    size={16}
                                    color={!selectedPaymentGroupId ? '#FFFFFF' : currentTheme.textSecondary}
                                  />
                                  <Text style={{
                                    color: !selectedPaymentGroupId ? '#FFFFFF' : currentTheme.text,
                                    fontWeight: !selectedPaymentGroupId ? 'bold' : 'normal',
                                    fontSize: 13,
                                  }}>
                                    Sin grupo
                                  </Text>
                                </TouchableOpacity>
                                {paymentGroups.map((group) => (
                                  <TouchableOpacity
                                    key={group.id}
                                    style={{
                                      paddingHorizontal: 14,
                                      paddingVertical: 8,
                                      borderRadius: 20,
                                      backgroundColor: selectedPaymentGroupId === group.id ? group.color : currentTheme.surface,
                                      borderWidth: 1,
                                      borderColor: selectedPaymentGroupId === group.id ? group.color : currentTheme.border,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                    onPress={() => setSelectedPaymentGroupId(group.id)}
                                  >
                                    <Ionicons
                                      name={group.icon as any}
                                      size={16}
                                      color={selectedPaymentGroupId === group.id ? '#FFFFFF' : group.color}
                                    />
                                    <Text style={{
                                      color: selectedPaymentGroupId === group.id ? '#FFFFFF' : currentTheme.text,
                                      fontWeight: selectedPaymentGroupId === group.id ? 'bold' : 'normal',
                                      fontSize: 13,
                                    }}>
                                      {group.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                                {/* Botón + para crear grupo */}
                                <TouchableOpacity
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: currentTheme.surface,
                                    borderWidth: 1,
                                    borderColor: currentTheme.primary,
                                    borderStyle: 'dashed',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  }}
                                  onPress={() => setGroupModalVisible(true)}
                                >
                                  <Ionicons name="add" size={20} color={currentTheme.primary} />
                                </TouchableOpacity>
                              </View>
                            </ScrollView>
                            <Text style={{ color: currentTheme.textSecondary, fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
                              Agrupa cuotas para pagarlas juntas como "resumen"
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 40, marginBottom: 40 }}>
                    <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, marginTop: 0, marginBottom: 0 }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>
                          {isEditing ? 'Actualizar' : hasInstallments ? `Guardar en ${installments} cuotas` : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </>
      </ScrollView>

      {/* Quick Add Category Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nueva Categoría</Text>

                <Text style={styles.sectionLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Fútbol"
                  placeholderTextColor={currentTheme.textSecondary}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />

                <Text style={styles.sectionLabel}>Icono</Text>
                <View style={styles.grid}>
                  {ICONS.slice(0, showAllIcons ? undefined : INITIAL_ICON_COUNT).map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.selectionItem, newCategoryIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                      onPress={() => setNewCategoryIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.selectionItem, { backgroundColor: currentTheme.surface, width: 'auto', paddingHorizontal: 12 }]}
                    onPress={() => setShowAllIcons(!showAllIcons)}
                  >
                    <Text style={{ fontSize: 12, color: currentTheme.primary, fontWeight: 'bold' }}>
                      {showAllIcons ? 'Menos' : 'Ver más'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionLabel}>Color</Text>
                <View style={styles.grid}>
                  {COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.selectionItem, newCategoryColor === color && styles.selectedItem, { backgroundColor: color }]}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={handleQuickAddCategory}>
                    <Text style={styles.buttonText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Quick Add Payment Group Modal */}
      <Modal visible={groupModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setGroupModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nuevo Grupo de Pago</Text>

                <Text style={styles.sectionLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: TC Macro, Cuotas Tienda"
                  placeholderTextColor={currentTheme.textSecondary}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  autoFocus
                />

                <Text style={styles.sectionLabel}>Icono</Text>
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

                <Text style={styles.sectionLabel}>Color</Text>
                <View style={styles.grid}>
                  {COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.selectionItem, newGroupColor === color && styles.selectedItem, { backgroundColor: color }]}
                      onPress={() => setNewGroupColor(color)}
                    />
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.button} onPress={() => setGroupModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={handleQuickAddGroup}>
                    <Text style={styles.buttonText}>Crear</Text>
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
