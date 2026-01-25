import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay, formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FinancialType, Debt } from '../../expenses/types';
import { RecurringService } from '../types';
import { useToast } from '../../../shared/hooks/useToast';

type MonthlyPaymentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MonthlyPayments'>;

export default function MonthlyPaymentsScreen() {
  const navigation = useNavigation<MonthlyPaymentsScreenNavigationProp>();
  const {
    preferences,
    creditCards,
    getMonthlyConsumption,
    getCreditCardPaymentStatus,
    expenses,
    loadExpenses,
    debts,
    banks,
    recurringServices,
    getServicePaymentStatus,
    getMonthlyServicesTotal,
    loadRecurringServices,
    loadServicePayments,
    markServiceAsPaid,
    addExpense,
    categories,
    getMostUsedCategories,
    addCategory,
    payDebtInstallment,
    loadDebts
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showSuccess, showError } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Modal de marcar como pagado (servicios)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedService, setSelectedService] = useState<RecurringService | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('pricetag');
  const [newCategoryColor, setNewCategoryColor] = useState('#607D8B');

  // Modal para pagar tarjeta de crédito
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardPaymentDate, setCardPaymentDate] = useState(new Date());
  const [showCardDatePicker, setShowCardDatePicker] = useState(false);

  // Modal para pagar deuda
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [debtPaymentDate, setDebtPaymentDate] = useState(new Date());
  const [showDebtDatePicker, setShowDebtDatePicker] = useState(false);

  // Estados para acordeones (todos cerrados por defecto)
  const [expandedAccordions, setExpandedAccordions] = useState({
    creditCards: false,
    services: false,
    debts: false,
  });

  const ICONS = [
    'cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness',
    'school', 'construct', 'airplane', 'home', 'flash', 'water', 'flame', 'wifi', 'tv'
  ];
  const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];
  
  const sortedCategories = useMemo(() => {
    return getMostUsedCategories();
  }, [categories]);

  // Filtrar categorías: solo UUIDs válidos (longitud > 10) y que coincidan con la búsqueda
  const filteredCategories = sortedCategories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
    // Solo incluir categorías con UUIDs válidos (longitud > 10 caracteres, no IDs numéricos)
    const isValidUUID = c.id && c.id.length > 10;
    return matchesSearch && isValidUUID;
  });

  useEffect(() => {
    // Load all data needed for this screen
    const { loadCreditCards, loadCreditCardPurchases, loadDebts } = useStore.getState();
    loadRecurringServices();
    loadServicePayments();
    loadExpenses();
    loadCreditCards();
    loadCreditCardPurchases();
    loadDebts();
  }, []);

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setCurrentDate(newDate);
  };

  const handleMarkAsPaid = (service: RecurringService) => {
    setSelectedService(service);
    setPaymentAmount(formatCurrencyInput(service.estimated_amount.toString()));
    // Fecha del día configurado del mes actual o fecha actual
    const paymentDay = service.day_of_month;
    const today = new Date();
    const paymentDateForMonth = new Date(currentYear, currentMonth, Math.min(paymentDay, new Date(currentYear, currentMonth + 1, 0).getDate()));
    setPaymentDate(paymentDateForMonth > today ? today : paymentDateForMonth);
    // Usar la categoría del servicio si existe
    if (service.category_id) {
      setSelectedCategoryIds([service.category_id]);
    } else {
      setSelectedCategoryIds([]);
    }
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (!selectedService || !paymentAmount.trim()) {
      Alert.alert('Error', 'Por favor completa el monto');
      return;
    }

    const amount = parseCurrencyInput(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    // Usar la categoría del servicio o las seleccionadas
    let categoryIds = selectedCategoryIds.length > 0 ? selectedCategoryIds : (selectedService.category_id ? [selectedService.category_id] : []);
    
    // Validar que todos los IDs de categorías sean UUIDs válidos (longitud > 10)
    categoryIds = categoryIds.filter(id => id && id.length > 10);

    try {
      // Crear el gasto
      await addExpense({
        amount,
        description: `Pago de ${selectedService.name}`,
        categoryIds,
        date: paymentDate.toISOString(),
        financialType: 'needs' as FinancialType,
        serviceId: selectedService.id,
      });

      // Buscar el expense recién creado para obtener su ID
      const { expenses } = useStore.getState();
      const createdExpense = expenses.find(
        e => e.description === `Pago de ${selectedService.name}` &&
        Math.abs(new Date(e.date).getTime() - paymentDate.getTime()) < 60000 // Dentro de 1 minuto
      );

      // Marcar el servicio como pagado
      await markServiceAsPaid(
        selectedService.id,
        currentMonth + 1,
        currentYear,
        amount,
        createdExpense?.id
      );

      // Recargar datos
      await loadExpenses();
      await loadServicePayments();
      await loadRecurringServices();

      showSuccess(`Pago de "${selectedService.name}" registrado correctamente`);
      setShowPaymentModal(false);
      setSelectedService(null);
      setPaymentAmount('');
      setSelectedCategoryIds([]);
    } catch (error) {
      console.error('Error al marcar servicio como pagado:', error);
      showError('No se pudo registrar el pago');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return;
    }

    const newCategory = await addCategory({
      name: newCategoryName,
      icon: newCategoryIcon,
      color: newCategoryColor,
    });

    if (newCategory) {
      setSelectedCategoryIds([newCategory.id]);
      showSuccess(`Categoría "${newCategoryName}" creada`);
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('pricetag');
      setNewCategoryColor('#607D8B');
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryIds([categoryId]); // Solo una categoría para servicios
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  // Calcular totales
  const creditCardsTotal = creditCards.reduce((sum, card) => {
    const summary = getMonthlyConsumption(card.id, currentMonth, currentYear);
    return sum + summary.totalAmount;
  }, 0);

  const debtsTotal = debts
    .filter(debt => debt.status === 'active')
    .reduce((sum, debt) => sum + debt.installmentAmount, 0);

  const servicesTotal = getMonthlyServicesTotal(currentMonth, currentYear);

  // Check which debts have been paid this month by looking at expenses with debtId
  const debtsPaidThisMonth = useMemo(() => {
    const paidDebtIds = new Set<string>();
    expenses.forEach(expense => {
      if (expense.debtId) {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
          paidDebtIds.add(expense.debtId);
        }
      }
    });
    return paidDebtIds;
  }, [expenses, currentMonth, currentYear]);

  const totalMonthly = creditCardsTotal + debtsTotal + servicesTotal;

  // Función para toggle de acordeón
  const toggleAccordion = (key: keyof typeof expandedAccordions) => {
    setExpandedAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    monthText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      textTransform: 'capitalize',
      minWidth: 150,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    sectionSubtotal: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.textSecondary,
    },
    card: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
      flex: 1,
    },
    cardAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    cardStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    statusText: {
      fontSize: 12,
      color: currentTheme.textSecondary,
    },
    accordion: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    accordionTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    accordionTotal: {
      fontSize: 15,
      fontWeight: '600',
    },
    accordionContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    totalCard: {
      backgroundColor: currentTheme.primary,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    totalLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 8,
    },
    totalAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: currentTheme.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    actionButton: {
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: currentTheme.primary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
      width: '100%',
      maxWidth: 500,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginBottom: 8,
      marginTop: 16,
    },
    modalInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
      color: currentTheme.text,
      fontSize: 16,
      minHeight: 50,
      justifyContent: 'center',
      ...Platform.select({
        web: {
          outlineStyle: 'none' as any,
        }
      }),
    } as any,
    categorySearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
      minHeight: 50,
    },
    categorySearchInput: {
      flex: 1,
      paddingVertical: 12,
      color: currentTheme.text,
      marginLeft: 8,
      fontSize: 16,
    },
    modalCategoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    modalCategoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.surface,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    modalCategoryChipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    modalCategoryText: {
      color: currentTheme.text,
      fontSize: 14,
    },
    modalCategoryTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    modalGridItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    modalGridItemSelected: {
      borderColor: currentTheme.primary,
      borderWidth: 2,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      padding: 10,
      borderRadius: 8,
    },
    modalButtonCancel: {
      backgroundColor: 'transparent',
    },
    modalButtonSave: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    modalButtonTextSave: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });

  // Componente Accordion
  const Accordion = ({ 
    title, 
    total, 
    isExpanded, 
    onToggle, 
    children, 
    icon, 
    color 
  }: { 
    title: string; 
    total: number; 
    isExpanded: boolean; 
    onToggle: () => void; 
    children: React.ReactNode;
    icon: string;
    color: string;
  }) => {
    return (
      <View style={[styles.accordion, { borderColor: currentTheme.border }]}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <Text style={[styles.accordionTitle, { color: currentTheme.text }]}>
              {title}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={[styles.accordionTotal, { color: currentTheme.textSecondary }]}>
              {formatCurrencyDisplay(total)}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={currentTheme.textSecondary}
            />
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.accordionContent}>
            {children}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      {/* Header con selector de mes */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {/* Acordeón: Tarjetas de Crédito */}
      <Accordion
        title="Tarjetas de Crédito"
        total={creditCardsTotal}
        isExpanded={expandedAccordions.creditCards}
        onToggle={() => toggleAccordion('creditCards')}
        icon="card"
        color="#1976D2"
      >
        {creditCards.length === 0 ? (
          <View style={[styles.card, { borderLeftColor: '#1976D2' }]}>
            <Text style={styles.emptyText}>
              No tienes tarjetas de crédito configuradas
            </Text>
          </View>
        ) : (
          creditCards.map(card => {
            const summary = getMonthlyConsumption(card.id, currentMonth, currentYear);
            const bank = banks.find(b => b.id === card.bank_id);
            const paymentStatus = getCreditCardPaymentStatus(card.id, currentMonth + 1, currentYear);
            const isPaid = paymentStatus?.isPaid || false;
            
            return (
              <View key={card.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: card.color || '#1976D2',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{card.name}</Text>
                    <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 2 }}>
                      {bank ? `${bank.name} • ` : ''}{summary.items.length > 0 ? `${summary.items.length} consumos` : 'Sin consumos este mes'} • {formatCurrencyDisplay(summary.totalAmount)}
                    </Text>
                  </View>
                  {isPaid ? (
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      backgroundColor: '#4CAF50' + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8
                    }}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={{ fontSize: 12, color: '#4CAF50', marginLeft: 4, fontWeight: '600' }}>
                        Pagado
                      </Text>
                    </View>
                  ) : summary.items.length > 0 ? (
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: currentTheme.primary,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onPress={() => {
                        setSelectedCardId(card.id);
                        setShowCardPaymentModal(true);
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
                        Pagar
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </Accordion>

      {/* Acordeón: Gastos Fijos (servicios, alquiler, etc.) */}
      <Accordion
        title="Gastos Fijos"
        total={servicesTotal}
        isExpanded={expandedAccordions.services}
        onToggle={() => toggleAccordion('services')}
        icon="flash"
        color="#F44336"
      >
        {recurringServices.length === 0 ? (
          <View style={[styles.card, { borderLeftColor: '#F44336' }]}>
            <Text style={styles.emptyText}>
              No tienes gastos fijos configurados (alquiler, servicios, suscripciones, etc.)
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('RecurringServices')}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Agregar Gasto Fijo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {recurringServices.map(service => {
              const payment = getServicePaymentStatus(service.id, currentMonth + 1, currentYear);
              const isPaid = payment?.status === 'paid';
              
              return (
                <View key={service.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 20, 
                      backgroundColor: service.color,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name={service.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{service.name}</Text>
                      <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 2 }}>
                        {formatCurrencyDisplay(service.estimated_amount)} - Día {service.day_of_month} de cada mes
                      </Text>
                    </View>
                    {isPaid ? (
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        backgroundColor: '#4CAF50' + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8
                      }}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={{ fontSize: 12, color: '#4CAF50', marginLeft: 4, fontWeight: '600' }}>
                          Pagado
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: currentTheme.primary,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onPress={() => handleMarkAsPaid(service)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
                          Pagar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('RecurringServices')}
            >
              <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Gestionar Gastos Fijos</Text>
            </TouchableOpacity>
          </>
        )}
      </Accordion>

      {/* Acordeón: Deudas */}
      <Accordion
        title="Deudas"
        total={debtsTotal}
        isExpanded={expandedAccordions.debts}
        onToggle={() => toggleAccordion('debts')}
        icon="card-outline"
        color="#FF9800"
      >
        {debts.filter(d => d.status === 'active').length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              No tienes deudas activas
            </Text>
          </View>
        ) : (
          debts
            .filter(debt => debt.status === 'active')
            .map(debt => {
              const isPaidThisMonth = debtsPaidThisMonth.has(debt.id);

              return (
                <View key={debt.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#FF9800',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{debt.name}</Text>
                      <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 2 }}>
                        {formatCurrencyDisplay(debt.installmentAmount)} - Cuota {debt.currentInstallment + 1}/{debt.totalInstallments}
                      </Text>
                    </View>
                    {isPaidThisMonth ? (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#4CAF50' + '20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8
                      }}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={{ fontSize: 12, color: '#4CAF50', marginLeft: 4, fontWeight: '600' }}>
                          Pagado
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: currentTheme.primary,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onPress={() => {
                          setSelectedDebtId(debt.id);
                          setShowDebtPaymentModal(true);
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
                          Pagar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
        )}
      </Accordion>

      {/* Total Mensual */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Pagos del Mes</Text>
        <Text style={styles.totalAmount}>
          {formatCurrencyDisplay(totalMonthly)}
        </Text>
      </View>
    </ScrollView>

    {/* Modal para marcar servicio como pagado */}
    <Modal visible={showPaymentModal} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Marcar como Pagado</Text>

              <Text style={styles.modalLabel}>Monto</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0,00"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={(text) => setPaymentAmount(formatCurrencyInput(text))}
              />

              <Text style={styles.modalLabel}>Fecha</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={{ color: currentTheme.text, fontSize: 16 }}>
                    {format(paymentDate, 'dd/MM/yyyy', { locale: es })}
                  </Text>
                </View>
              </TouchableOpacity>

              {Platform.OS !== 'web' && showDatePicker && (
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}

              {selectedService && selectedService.category_id && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: currentTheme.surface, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginBottom: 4 }}>
                    Categoría configurada:
                  </Text>
                  {(() => {
                    const category = categories.find(c => c.id === selectedService.category_id);
                    return category ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name={category.icon as any} size={16} color={category.color} />
                        <Text style={{ fontSize: 14, color: currentTheme.text, fontWeight: '600' }}>
                          {category.name}
                        </Text>
                      </View>
                    ) : null;
                  })()}
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSavePayment}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    {/* Modal para crear categoría */}
    <Modal visible={showCategoryModal} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Categoría</Text>

              <Text style={styles.modalLabel}>Nombre</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Servicios Públicos"
                placeholderTextColor={currentTheme.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />

              <Text style={styles.modalLabel}>Icono</Text>
              <View style={styles.modalGrid}>
                {ICONS.slice(0, 20).map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.modalGridItem,
                      newCategoryIcon === icon && styles.modalGridItemSelected,
                      { backgroundColor: currentTheme.surface }
                    ]}
                    onPress={() => setNewCategoryIcon(icon)}
                  >
                    <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Color</Text>
              <View style={styles.modalGrid}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.modalGridItem,
                      newCategoryColor === color && styles.modalGridItemSelected,
                      { backgroundColor: color }
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleAddCategory}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    {/* Modal para pagar tarjeta de crédito */}
    <Modal visible={showCardPaymentModal} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={() => setShowCardPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <ScrollView style={styles.modalContent}>
              {selectedCardId && (() => {
                const card = creditCards.find(c => c.id === selectedCardId);
                const summary = card ? getMonthlyConsumption(card.id, currentMonth, currentYear) : null;
                const paymentStatus = card ? getCreditCardPaymentStatus(card.id, currentMonth + 1, currentYear) : null;
                const isPaid = paymentStatus?.isPaid || false;
                
                if (!card || !summary) return null;

                return (
                  <>
                    <Text style={styles.modalTitle}>
                      {card.name} - {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </Text>

                    <View style={{
                      backgroundColor: currentTheme.primary + '15',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 14, color: currentTheme.textSecondary, marginBottom: 4 }}>
                        Total a Pagar
                      </Text>
                      <Text style={{ fontSize: 28, fontWeight: 'bold', color: currentTheme.text }}>
                        {formatCurrencyDisplay(summary.totalAmount)}
                      </Text>
                      {isPaid && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          marginTop: 8,
                          backgroundColor: '#4CAF50' + '20',
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 8
                        }}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={{ fontSize: 12, color: '#4CAF50', marginLeft: 6, fontWeight: '600' }}>
                            Ya pagado
                          </Text>
                        </View>
                      )}
                    </View>

                    {summary.items.length > 0 ? (
                      <>
                        <Text style={styles.modalLabel}>Desglose de Consumos</Text>
                        {summary.items.map((item, index) => (
                          <View key={index} style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            backgroundColor: currentTheme.surface,
                            borderRadius: 8,
                            marginBottom: 8,
                          }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: currentTheme.text }}>
                                {item.description}
                              </Text>
                              <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 2 }}>
                                Cuota {item.installmentNumber}/{item.totalInstallments}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: currentTheme.text }}>
                              {formatCurrencyDisplay(item.amount)}
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : (
                      <Text style={{ 
                        textAlign: 'center', 
                        color: currentTheme.textSecondary, 
                        marginVertical: 20,
                        fontStyle: 'italic'
                      }}>
                        No hay consumos este mes
                      </Text>
                    )}

                    {!isPaid && summary.totalAmount > 0 && (
                      <>
                        <Text style={styles.modalLabel}>Fecha de Pago</Text>
                        <TouchableOpacity
                          style={styles.modalInput}
                          onPress={() => setShowCardDatePicker(true)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                            <Text style={{ color: currentTheme.text, fontSize: 16 }}>
                              {format(cardPaymentDate, 'dd/MM/yyyy', { locale: es })}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {Platform.OS !== 'web' && showCardDatePicker && (
                          <DateTimePicker
                            value={cardPaymentDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                              if (Platform.OS !== 'web') {
                                setShowCardDatePicker(false);
                              }
                              if (selectedDate) {
                                setCardPaymentDate(selectedDate);
                              }
                            }}
                          />
                        )}

                        <TouchableOpacity
                          style={[styles.modalButton, styles.modalButtonSave, { marginTop: 20, width: '100%' }]}
                          onPress={async () => {
                            try {
                              // Crear el gasto
                              await addExpense({
                                amount: summary.totalAmount,
                                description: `Resumen ${card.name} - ${format(currentDate, 'MMMM yyyy', { locale: es })}`,
                                categoryIds: [],
                                date: cardPaymentDate.toISOString(),
                                financialType: 'needs' as FinancialType,
                                creditCardId: card.id,
                                isCreditCardPayment: true,
                              });

                              // Buscar el expense recién creado
                              const { expenses } = useStore.getState();
                              const createdExpense = expenses.find(
                                e => e.description === `Resumen ${card.name} - ${format(currentDate, 'MMMM yyyy', { locale: es })}` &&
                                Math.abs(new Date(e.date).getTime() - cardPaymentDate.getTime()) < 60000
                              );

                              // El gasto ya está creado con is_credit_card_payment = true
                              // Solo necesitamos recargar los gastos para actualizar el estado
                              await loadExpenses();

                              showSuccess(`Pago de "${card.name}" registrado correctamente`);
                              setShowCardPaymentModal(false);
                              setSelectedCardId(null);
                              setCardPaymentDate(new Date());
                            } catch (error) {
                              showError('No se pudo registrar el pago');
                            }
                          }}
                        >
                          <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                            Marcar como Pagado
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel]}
                        onPress={() => setShowCardPaymentModal(false)}
                      >
                        <Text style={styles.modalButtonText}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    {/* Modal para pagar deuda */}
    <Modal visible={showDebtPaymentModal} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={() => setShowDebtPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <ScrollView style={styles.modalContent}>
              {selectedDebtId && (() => {
                const debt = debts.find(d => d.id === selectedDebtId);
                if (!debt) return null;

                return (
                  <>
                    <Text style={styles.modalTitle}>Pagar Cuota - {debt.name}</Text>

                    <View style={{
                      backgroundColor: '#FF9800' + '15',
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 14, color: currentTheme.textSecondary, marginBottom: 4 }}>
                        Cuota {debt.currentInstallment + 1} de {debt.totalInstallments}
                      </Text>
                      <Text style={{ fontSize: 28, fontWeight: 'bold', color: currentTheme.text }}>
                        {formatCurrencyDisplay(debt.installmentAmount)}
                      </Text>
                      <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 8 }}>
                        Restante: {formatCurrencyDisplay(debt.totalAmount - (debt.currentInstallment * debt.installmentAmount))}
                      </Text>
                    </View>

                    <Text style={styles.modalLabel}>Fecha de Pago</Text>
                    <TouchableOpacity
                      style={styles.modalInput}
                      onPress={() => setShowDebtDatePicker(true)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                        <Text style={{ color: currentTheme.text, fontSize: 16 }}>
                          {format(debtPaymentDate, 'dd/MM/yyyy', { locale: es })}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {Platform.OS !== 'web' && showDebtDatePicker && (
                      <DateTimePicker
                        value={debtPaymentDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS !== 'web') {
                            setShowDebtDatePicker(false);
                          }
                          if (selectedDate) {
                            setDebtPaymentDate(selectedDate);
                          }
                        }}
                      />
                    )}

                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSave, { marginTop: 20, width: '100%' }]}
                      onPress={async () => {
                        try {
                          // Create expense for the debt payment
                          const expense = await addExpense({
                            amount: debt.installmentAmount,
                            description: `Cuota ${debt.currentInstallment + 1}/${debt.totalInstallments} - ${debt.name}`,
                            categoryIds: [],
                            date: debtPaymentDate.toISOString(),
                            financialType: 'needs' as FinancialType,
                            debtId: debt.id,
                          });

                          if (expense) {
                            // Update debt installment
                            await payDebtInstallment(debt.id, expense.id);
                            await loadExpenses();
                            await loadDebts();

                            showSuccess(`Cuota de "${debt.name}" registrada correctamente`);
                          }

                          setShowDebtPaymentModal(false);
                          setSelectedDebtId(null);
                          setDebtPaymentDate(new Date());
                        } catch (error) {
                          showError('No se pudo registrar el pago');
                        }
                      }}
                    >
                      <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                        Marcar como Pagado
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel]}
                        onPress={() => setShowDebtPaymentModal(false)}
                      >
                        <Text style={styles.modalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

  </View>
  );
}
