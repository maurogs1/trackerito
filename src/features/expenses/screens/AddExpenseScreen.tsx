import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
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
  const { addExpense, updateExpense, expenses, preferences, getMostUsedCategories, addCategory, categories: allCategories, ensureDefaultCategories, creditCards, banks, addCreditCardPurchase } = useStore();
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [installments, setInstallments] = useState('1');
  const [isExistingPurchase, setIsExistingPurchase] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Quick Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(ICONS[0]);
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);

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
      }
    }
  }, [expenseId, isEditing]);

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
      // Si viene desde "Pagos" para pagar el resumen de tarjeta
      if (route.params?.isCreditCardPayment && route.params?.creditCardId) {
        // Crear el gasto del pago del resumen
        await addExpense({
          amount: numAmount,
          description,
          categoryIds: selectedCategoryIds,
          date: date.toISOString(),
          financialType: financialType,
          creditCardId: route.params.creditCardId,
          isCreditCardPayment: true
        });
        showSuccess('Pago del resumen registrado correctamente');
        navigation.goBack();
      }
      // Si el usuario seleccionó tarjeta de crédito como método de pago
      else if (paymentMethod === 'credit_card' && selectedCardId) {
        // Verificar que tenga cuotas
        const numInstallments = parseInt(installments) || 1;
        
        // Calcular la fecha de la primera cuota
        let firstInstallmentDate = new Date(date);
        if (isExistingPurchase && parseInt(currentInstallment) > 1) {
          // Si está registrando una compra pasada, calcular la fecha de la primera cuota
          const currentInst = parseInt(currentInstallment) || 1;
          firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() - (currentInst - 1));
        }

        // Crear el consumo de tarjeta (NO un gasto)
        const purchaseData = {
          credit_card_id: selectedCardId,
          description,
          total_amount: numAmount,
          installments: numInstallments,
          first_installment_date: firstInstallmentDate.toISOString().split('T')[0], // Solo la fecha sin hora
          categoryIds: selectedCategoryIds, // Múltiples categorías
        };

        const purchase = await addCreditCardPurchase(purchaseData);

        if (purchase) {
          showSuccess('Consumo registrado. Aparecerá en el resumen mensual de la tarjeta');
          navigation.goBack();
        } else {
          Alert.alert('Error', 'No se pudo registrar el consumo');
        }
      }
      // Gasto normal (efectivo/débito)
      else {
        await addExpense({
          amount: numAmount,
          description,
          categoryIds: selectedCategoryIds,
          date: date.toISOString(),
          financialType: financialType,
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
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
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
        {currentStep === 1 ? (
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
                  {filteredCategories.slice(0, showAllCategories ? undefined : INITIAL_CATEGORY_COUNT).map((cat: any) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        selectedCategoryIds.includes(cat.id) && styles.categoryChipSelected,
                      ]}
                      onPress={() => handleCategorySelect(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={selectedCategoryIds.includes(cat.id) ? '#FFFFFF' : cat.color}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategoryIds.includes(cat.id) && styles.categoryTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}

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
                        <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>
                          {type === 'needs' ? 'Necesidad' : type === 'wants' ? 'Deseo' : 'Ahorro'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 40, marginBottom: 40 }}>
                    <TouchableOpacity 
                        style={[styles.saveButton, { flex: 1, marginTop: 0, marginBottom: 0, backgroundColor: 'transparent', borderWidth: 1, borderColor: currentTheme.border }]} 
                        onPress={() => setCurrentStep(2)}
                    >
                        <Text style={[styles.saveButtonText, { color: currentTheme.text }]}>Siguiente</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.saveButton, { flex: 1, marginTop: 0, marginBottom: 0 }]} 
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>{isEditing ? 'Actualizar' : 'Guardar'}</Text>
                    </TouchableOpacity>
                </View>
            </>
        ) : (
            <>
                <Text style={styles.label}>Método de Pago</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, paymentMethod === 'cash' && styles.typeButtonSelected, paymentMethod === 'cash' && { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary + '20' }]}
                        onPress={() => setPaymentMethod('cash')}
                    >
                        <Text style={[styles.typeText, paymentMethod === 'cash' && { color: currentTheme.primary }]}>Efectivo / Débito</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, paymentMethod === 'credit_card' && styles.typeButtonSelected, paymentMethod === 'credit_card' && { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary + '20' }]}
                        onPress={() => setPaymentMethod('credit_card')}
                    >
                        <Text style={[styles.typeText, paymentMethod === 'credit_card' && { color: currentTheme.primary }]}>Tarjeta de Crédito</Text>
                    </TouchableOpacity>
                </View>

                {paymentMethod === 'credit_card' && (
                    <View style={{ marginTop: 16, padding: 16, backgroundColor: currentTheme.card, borderRadius: 12, borderWidth: 1, borderColor: currentTheme.border }}>
                        <View style={{ 
                            backgroundColor: currentTheme.primary + '15', 
                            padding: 12, 
                            borderRadius: 8, 
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <Ionicons name="information-circle" size={20} color={currentTheme.primary} />
                            <Text style={{ color: currentTheme.text, fontSize: 13, flex: 1 }}>
                                Este consumo aparecerá en el resumen mensual de la tarjeta. El gasto se registrará cuando pagues el resumen.
                            </Text>
                        </View>
                        
                        <Text style={{ color: currentTheme.textSecondary, marginBottom: 8 }}>Seleccionar Tarjeta *</Text>
                        
                        <TouchableOpacity 
                            style={{ 
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                padding: 12, borderRadius: 8, borderWidth: 1, borderColor: currentTheme.border,
                                backgroundColor: currentTheme.background, marginBottom: 16
                            }}
                            onPress={() => {
                                setCardModalVisible(true);
                            }}
                        >
                            <Text style={{ color: selectedCardId ? currentTheme.text : currentTheme.textSecondary, fontSize: 16 }}>
                                {selectedCardId 
                                    ? (() => {
                                        const card = creditCards.find(c => c.id === selectedCardId);
                                        const bank = banks.find(b => b.id === card?.bank_id);
                                        return card ? `${bank?.name || 'Banco'} - ${card.name}` : 'Seleccionar Tarjeta';
                                    })()
                                    : 'Seleccionar Tarjeta'
                                }
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={currentTheme.textSecondary} />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: currentTheme.textSecondary, marginBottom: 4 }}>Cuotas Totales</Text>
                                <TextInput
                                    style={styles.input}
                                    value={installments}
                                    onChangeText={setInstallments}
                                    keyboardType="numeric"
                                    placeholder="1"
                                    placeholderTextColor={currentTheme.textSecondary}
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={{ marginTop: 16 }}
                            onPress={() => setIsExistingPurchase(!isExistingPurchase)}
                        >
                            <Text style={{ color: currentTheme.primary, fontSize: 14 }}>
                                {isExistingPurchase ? 'Ocultar opciones avanzadas' : 'Registrar compra de meses pasados'}
                            </Text>
                        </TouchableOpacity>

                        {isExistingPurchase && (
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: currentTheme.border }}>
                                <Text style={{ color: currentTheme.textSecondary, marginBottom: 4 }}>Cuota que pagas este mes</Text>
                                <TextInput
                                    style={styles.input}
                                    value={currentInstallment}
                                    onChangeText={setCurrentInstallment}
                                    keyboardType="numeric"
                                    placeholder="Ej: 6"
                                    placeholderTextColor={currentTheme.textSecondary}
                                />
                            </View>
                        )}

                        {/* Selector de categorías para consumos de tarjeta */}
                        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: currentTheme.border }}>
                            <Text style={{ color: currentTheme.textSecondary, marginBottom: 8 }}>Categorías (Opcional)</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {filteredCategories.slice(0, showAllCategories ? undefined : INITIAL_CATEGORY_COUNT).map((cat: any) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            selectedCategoryIds.includes(cat.id) && styles.categoryChipSelected,
                                        ]}
                                        onPress={() => handleCategorySelect(cat.id)}
                                    >
                                        <Ionicons
                                            name={cat.icon as any}
                                            size={16}
                                            color={selectedCategoryIds.includes(cat.id) ? '#FFFFFF' : cat.color}
                                        />
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                selectedCategoryIds.includes(cat.id) && styles.categoryTextSelected,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {filteredCategories.length > INITIAL_CATEGORY_COUNT && (
                                    <TouchableOpacity
                                        style={styles.categoryChip}
                                        onPress={() => setShowAllCategories(!showAllCategories)}
                                    >
                                        <Text style={styles.categoryText}>
                                            {showAllCategories ? 'Ver menos' : `Ver más`}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 40, marginBottom: 40 }}>
                    <TouchableOpacity 
                        style={[styles.saveButton, { flex: 1, marginTop: 0, marginBottom: 0, backgroundColor: 'transparent', borderWidth: 1, borderColor: currentTheme.border }]} 
                        onPress={() => setCurrentStep(1)}
                    >
                        <Text style={[styles.saveButtonText, { color: currentTheme.text }]}>Atrás</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[
                            styles.saveButton, 
                            { flex: 1, marginTop: 0, marginBottom: 0 },
                            paymentMethod === 'credit_card' && !selectedCardId && { opacity: 0.5 }
                        ]} 
                        onPress={handleSave}
                        disabled={paymentMethod === 'credit_card' && !selectedCardId}
                    >
                        <Text style={styles.saveButtonText}>
                            {isEditing ? 'Actualizar' : paymentMethod === 'credit_card' ? 'Registrar Consumo' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </>
        )}
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
      {/* Card Selection Modal */}
      <Modal visible={cardModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCardModalVisible(false)}>
            <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={() => { }}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Tarjeta</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {creditCards.map(card => {
                                const bank = banks.find(b => b.id === card.bank_id);
                                return (
                                    <TouchableOpacity
                                        key={card.id}
                                        style={{
                                            padding: 16,
                                            borderBottomWidth: 1,
                                            borderBottomColor: currentTheme.border,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onPress={() => {
                                            setSelectedCardId(card.id);
                                            setCardModalVisible(false);
                                        }}
                                    >
                                        <View>
                                            <Text style={{ color: currentTheme.text, fontSize: 16, fontWeight: 'bold' }}>
                                                {bank?.name || 'Banco'} - {card.name}
                                            </Text>
                                        </View>
                                        {selectedCardId === card.id && (
                                            <Ionicons name="checkmark" size={20} color={currentTheme.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity 
                            style={{ marginTop: 16, padding: 12, alignItems: 'center' }}
                            onPress={() => setCardModalVisible(false)}
                        >
                            <Text style={{ color: currentTheme.primary, fontSize: 16, fontWeight: 'bold' }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
