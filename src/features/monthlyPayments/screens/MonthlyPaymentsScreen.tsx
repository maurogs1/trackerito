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
import { RecurringService } from '../types';
import { useToast } from '../../../shared/hooks/useToast';

type MonthlyPaymentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MonthlyPayments'>;

export default function MonthlyPaymentsScreen() {
  const navigation = useNavigation<MonthlyPaymentsScreenNavigationProp>();
  const {
    preferences,
    expenses,
    loadExpenses,
    recurringServices,
    getServicePaymentStatus,
    loadRecurringServices,
    loadServicePayments,
    markServiceAsPaid,
    addExpense,
    categories,
    getMostUsedCategories,
    addCategory,
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

  // Modal para crear categoría
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('pricetag');
  const [newCategoryColor, setNewCategoryColor] = useState('#607D8B');

  const ICONS = [
    'cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness',
    'school', 'construct', 'airplane', 'home', 'flash', 'water', 'flame', 'wifi', 'tv'
  ];
  const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

  const sortedCategories = useMemo(() => {
    return getMostUsedCategories();
  }, [categories]);

  useEffect(() => {
    loadRecurringServices();
    loadServicePayments();
    loadExpenses();
  }, []);

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setCurrentDate(newDate);
  };

  const handleMarkAsPaid = (service: RecurringService) => {
    setSelectedService(service);
    setPaymentAmount(formatCurrencyInput(service.estimated_amount.toString()));
    const paymentDay = service.day_of_month;
    const today = new Date();
    const paymentDateForMonth = new Date(currentYear, currentMonth, Math.min(paymentDay, new Date(currentYear, currentMonth + 1, 0).getDate()));
    setPaymentDate(paymentDateForMonth > today ? today : paymentDateForMonth);
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

    let categoryIds = selectedCategoryIds.length > 0 ? selectedCategoryIds : (selectedService.category_id ? [selectedService.category_id] : []);
    categoryIds = categoryIds.filter(id => id && id.length > 10);

    try {
      const expense = await addExpense({
        amount,
        description: selectedService.name,
        categoryIds,
        date: paymentDate.toISOString(),
        financialType: 'needs',
        serviceId: selectedService.id,
      });

      if (expense) {
        await markServiceAsPaid(selectedService.id, currentMonth + 1, currentYear, amount, expense.id);
        await loadExpenses();
        showSuccess(`"${selectedService.name}" marcado como pagado`);
      }
    } catch (error) {
      showError('No se pudo registrar el pago');
    }

    setShowPaymentModal(false);
    setSelectedService(null);
    setPaymentAmount('');
    setSelectedCategoryIds([]);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la categoría');
      return;
    }

    const newCategory = await addCategory({
      name: newCategoryName,
      icon: newCategoryIcon,
      color: newCategoryColor,
    });

    if (newCategory) {
      setSelectedCategoryIds([...selectedCategoryIds, newCategory.id]);
      showSuccess(`Categoría "${newCategoryName}" creada`);
    }

    setShowCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryIcon('pricetag');
    setNewCategoryColor('#607D8B');
  };

  // Calcular totales
  const servicesTotal = recurringServices.reduce((sum, service) => {
    const payment = getServicePaymentStatus(service.id, currentMonth + 1, currentYear);
    return sum + (payment?.amount || service.estimated_amount);
  }, 0);

  const paidCount = recurringServices.filter(service => {
    const payment = getServicePaymentStatus(service.id, currentMonth + 1, currentYear);
    return payment?.status === 'paid';
  }).length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    monthText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      textTransform: 'capitalize',
    },
    summaryCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    summaryAmount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    progressText: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 12,
      marginTop: 8,
    },
    serviceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    emptyCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    emptyText: {
      color: currentTheme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 16,
    },
    actionButton: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    serviceDetail: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    paidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF50' + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    paidText: {
      fontSize: 12,
      color: '#4CAF50',
      marginLeft: 4,
      fontWeight: '600',
    },
    payButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: currentTheme.primary,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    payButtonText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 8,
      marginTop: 12,
    },
    modalInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: 8,
      padding: 14,
      color: currentTheme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    modalButtonCancel: {
      backgroundColor: currentTheme.surface,
    },
    modalButtonSave: {
      backgroundColor: currentTheme.primary,
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
    },
    modalButtonTextSave: {
      color: '#FFFFFF',
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
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
      borderColor: currentTheme.text,
    },
  });

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

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Gastos Fijos</Text>
              <Text style={styles.summaryAmount}>${formatCurrencyDisplay(servicesTotal)}</Text>
            </View>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: currentTheme.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="flash" size={28} color={currentTheme.primary} />
            </View>
          </View>
          <Text style={styles.progressText}>
            {paidCount} de {recurringServices.length} pagados este mes
          </Text>
          {/* Barra de progreso */}
          <View style={{
            height: 6,
            backgroundColor: currentTheme.surface,
            borderRadius: 3,
            marginTop: 8,
            overflow: 'hidden'
          }}>
            <View style={{
              height: '100%',
              backgroundColor: '#4CAF50',
              borderRadius: 3,
              width: recurringServices.length > 0 ? `${(paidCount / recurringServices.length) * 100}%` : '0%',
            }} />
          </View>
        </View>

        {/* Lista de Gastos Fijos */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Mis Gastos Fijos</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => navigation.navigate('RecurringServices')}
          >
            <Ionicons name="settings-outline" size={18} color={currentTheme.primary} />
            <Text style={{ color: currentTheme.primary, fontSize: 14, fontWeight: '600' }}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        {recurringServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="flash-outline" size={48} color={currentTheme.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
              No tienes gastos fijos configurados.{'\n'}
              Agrega alquiler, servicios, suscripciones, etc.
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
          recurringServices.map(service => {
            const payment = getServicePaymentStatus(service.id, currentMonth + 1, currentYear);
            const isPaid = payment?.status === 'paid';

            return (
              <View key={service.id} style={styles.serviceCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: service.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons name={service.icon as any} size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDetail}>
                      ${formatCurrencyDisplay(service.estimated_amount)} - Vence el {service.day_of_month}
                    </Text>
                  </View>
                  {isPaid ? (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.paidText}>Pagado</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => handleMarkAsPaid(service)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.payButtonText}>Pagar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal para marcar servicio como pagado */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowPaymentModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Marcar como Pagado</Text>

                {selectedService && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: currentTheme.surface,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: selectedService.color,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons name={selectedService.icon as any} size={18} color="#FFFFFF" />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: currentTheme.text }}>
                      {selectedService.name}
                    </Text>
                  </View>
                )}

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

                {selectedService?.category_id && (
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
              </View>
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
                  {ICONS.slice(0, 17).map(icon => (
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
    </View>
  );
}
