import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay, parseCurrencyInput, formatCurrencyInput } from '../../../shared/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecurringService } from '../types';
import { useToast } from '../../../shared/hooks/useToast';

type MonthlyPaymentsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MonthlyPayments'>;

export default function MonthlyPaymentsScreen() {
  const navigation = useNavigation<MonthlyPaymentsScreenNavigationProp>();
  const {
    preferences,
    loadExpenses,
    recurringServices,
    getServicePaymentStatus,
    loadRecurringServices,
    loadServicePayments,
    markServiceAsPaid,
    unmarkServicePayment,
    addExpense,
    updateRecurringService,
    deleteRecurringService,
    categories,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<RecurringService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [serviceDay, setServiceDay] = useState('15');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const INITIAL_CATEGORY_COUNT = 6;

  useEffect(() => {
    loadRecurringServices();
    loadServicePayments();
    loadExpenses();
  }, []);

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setCurrentDate(newDate);
  };

  // ---- Edit handlers ----
  const resetEditForm = () => {
    setServiceName('');
    setServiceAmount('');
    setServiceDay('15');
    setSelectedCategoryId(undefined);
    setEditingService(null);
    setShowAllCategories(false);
  };

  const handleEditService = (service: RecurringService) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceAmount(formatCurrencyInput(service.estimated_amount.toString()));
    setServiceDay(service.day_of_month.toString());
    setSelectedCategoryId(service.category_id);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingService) return;
    if (!serviceName.trim() || !serviceAmount.trim() || !serviceDay.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const amount = parseCurrencyInput(serviceAmount);
    const day = parseInt(serviceDay);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    if (day < 1 || day > 31) {
      Alert.alert('Error', 'El día debe estar entre 1 y 31');
      return;
    }

    try {
      await updateRecurringService(editingService.id, {
        name: serviceName,
        estimated_amount: amount,
        day_of_month: day,
        category_id: selectedCategoryId,
        icon: editingService.icon,
        color: editingService.color,
        is_active: editingService.is_active,
      });
      showSuccess(`"${serviceName}" actualizado`);
      setShowEditModal(false);
      resetEditForm();
      loadRecurringServices();
    } catch (error) {
      showError('Error al actualizar');
    }
  };

  // ---- Delete handler ----
  const handleDeleteService = (service: RecurringService) => {
    Alert.alert(
      'Eliminar Gasto Fijo',
      `¿Estás seguro de que quieres eliminar "${service.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteRecurringService(service.id);
            showSuccess(`"${service.name}" eliminado`);
            loadRecurringServices();
          }
        },
      ]
    );
  };

  // ---- Payment handlers ----
  const handleMarkAsPaid = async (service: RecurringService) => {
    const amount = service.estimated_amount;
    const message = `¿Marcar "${service.name}" como pagado?\n\nMonto: $${formatCurrencyDisplay(amount)}`;

    const confirmed = Platform.OS === 'web'
      ? (globalThis as any).confirm?.(message) ?? true
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Confirmar pago',
            message,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmar', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirmed) {
      const categoryIds = service.category_id ? [service.category_id] : [];

      try {
        const expense = await addExpense({
          amount,
          description: service.name,
          categoryIds: categoryIds.filter(id => id && id.length > 10),
          date: new Date().toISOString(),
          financialType: 'needs',
          serviceId: service.id,
        });

        if (expense) {
          await markServiceAsPaid(service.id, currentMonth + 1, currentYear, amount, expense.id);
          await loadExpenses();
          showSuccess(`"${service.name}" marcado como pagado`);
        }
      } catch (error) {
        showError('No se pudo registrar el pago');
      }
    }
  };

  const handleUnmarkPayment = async (service: RecurringService) => {
    const message = `¿Querés marcar "${service.name}" como no pagado?\n\nEsto eliminará el registro de pago y el gasto asociado.`;

    const confirmed = Platform.OS === 'web'
      ? (globalThis as any).confirm?.(message) ?? true
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Deshacer pago',
            message,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Deshacer pago', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirmed) {
      try {
        await unmarkServicePayment(service.id, currentMonth + 1, currentYear, true);
        await loadExpenses();
        showSuccess(`"${service.name}" marcado como pendiente`);
      } catch (error) {
        showError('No se pudo deshacer el pago');
      }
    }
  };

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
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    summaryCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    serviceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    emptyCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.xxl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    paidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.success + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    payButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: currentTheme.primary,
      borderRadius: borderRadius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: 30,
      backgroundColor: currentTheme.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
      shadowColor: currentTheme.primary,
      shadowOpacity: 0.4,
    },
    categorySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: currentTheme.surface,
    },
    categoryChipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
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
          <Text style={[typography.sectionTitle, { color: currentTheme.text, textTransform: 'capitalize' }]}>
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <View style={common.rowBetween}>
            <View>
              <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Total Gastos Fijos</Text>
              <Text style={[typography.amountMedium, { color: currentTheme.text }]}>
                ${formatCurrencyDisplay(servicesTotal)}
              </Text>
            </View>
            <View style={[common.iconContainer, { backgroundColor: currentTheme.primary + '20' }]}>
              <Ionicons name="flash" size={28} color={currentTheme.primary} />
            </View>
          </View>
          <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>
            {paidCount} de {recurringServices.length} pagados este mes
          </Text>
          <View style={{ height: 6, backgroundColor: currentTheme.surface, borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' }}>
            <View style={{
              height: '100%',
              backgroundColor: currentTheme.success,
              borderRadius: 3,
              width: recurringServices.length > 0 ? `${(paidCount / recurringServices.length) * 100}%` : '0%',
            }} />
          </View>
        </View>

        {/* Lista de Gastos Fijos */}
        <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.md }]}>Mis Gastos Fijos</Text>

        {recurringServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="flash-outline" size={48} color={currentTheme.textSecondary} style={{ marginBottom: spacing.md }} />
            <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
              No tienes gastos fijos configurados.{'\n'}
              Usa el botón + para agregar.
            </Text>
          </View>
        ) : (
          recurringServices.map(service => {
            const payment = getServicePaymentStatus(service.id, currentMonth + 1, currentYear);
            const isPaid = payment?.status === 'paid';

            return (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleEditService(service)}
                activeOpacity={0.7}
              >
                <View style={common.row}>
                  <View style={[styles.iconContainer, { backgroundColor: service.color }]}>
                    <Ionicons name={service.icon as any} size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{service.name}</Text>
                    <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                      ${formatCurrencyDisplay(service.estimated_amount)} - Vence el {service.day_of_month}
                    </Text>
                  </View>
                  {isPaid ? (
                    <TouchableOpacity style={styles.paidBadge} onPress={(e) => { e.stopPropagation(); handleUnmarkPayment(service); }} activeOpacity={0.7}>
                      <Ionicons name="checkmark-circle" size={16} color={currentTheme.success} />
                      <Text style={[typography.caption, { color: currentTheme.success, marginLeft: spacing.xs, fontWeight: '600' }]}>
                        Pagado
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.payButton} onPress={(e) => { e.stopPropagation(); handleMarkAsPaid(service); }}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '600' }]}>Pagar</Text>
                    </TouchableOpacity>
                  )}
                 
                </View>
                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleDeleteService(service); }}
                    style={{ position: 'absolute', right: -5, top: -9 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color={currentTheme.error} />
                  </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('RecurringServices')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para editar gasto fijo */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => { setShowEditModal(false); resetEditForm(); }}>
          <View style={common.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView style={common.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.xl }]}>
                  Editar Gasto Fijo
                </Text>

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm }]}>Nombre *</Text>
                <TextInput
                  style={common.input}
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder="Nombre del gasto"
                  placeholderTextColor={currentTheme.textSecondary}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Monto Estimado *</Text>
                <TextInput
                  style={common.input}
                  value={serviceAmount}
                  onChangeText={(text) => setServiceAmount(formatCurrencyInput(text))}
                  placeholder="0,00"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="numeric"
                />

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Día del Mes *</Text>
                <TextInput
                  style={common.input}
                  value={serviceDay}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (text === '' || (!isNaN(num) && num >= 1 && num <= 31)) {
                      setServiceDay(text);
                    }
                  }}
                  placeholder="15"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginTop: spacing.lg }]}>Categoría (Opcional)</Text>

                <View style={styles.categorySelector}>
                  {(() => {
                    const displayedCategories = showAllCategories
                      ? categories
                      : categories.slice(0, INITIAL_CATEGORY_COUNT);

                    return (
                      <>
                        {displayedCategories.map(cat => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipSelected]}
                            onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id)}
                          >
                            <Ionicons
                              name={cat.icon as any}
                              size={16}
                              color={selectedCategoryId === cat.id ? '#FFFFFF' : cat.color}
                            />
                            <Text style={[typography.caption, { color: selectedCategoryId === cat.id ? '#FFFFFF' : currentTheme.text, fontWeight: selectedCategoryId === cat.id ? '600' : 'normal' }]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        {categories.length > INITIAL_CATEGORY_COUNT && (
                          <TouchableOpacity
                            style={styles.categoryChip}
                            onPress={() => setShowAllCategories(!showAllCategories)}
                          >
                            <Ionicons name={showAllCategories ? "chevron-up" : "chevron-down"} size={16} color={currentTheme.textSecondary} />
                            <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                              {showAllCategories ? 'Menos' : `+${categories.length - INITIAL_CATEGORY_COUNT}`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  })()}
                </View>

                <View style={[common.rowBetween, { marginTop: spacing.xxl }]}>
                  <TouchableOpacity style={{ padding: spacing.md }} onPress={() => { setShowEditModal(false); resetEditForm(); }}>
                    <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={common.buttonPrimary} onPress={handleSaveEdit}>
                    <Text style={common.buttonPrimaryText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
