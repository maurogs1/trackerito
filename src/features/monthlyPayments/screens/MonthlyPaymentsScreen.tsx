import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RecurringService } from '../types';
import { useToast } from '../../../shared/hooks/useToast';
import { SwipeableRow } from '../../../shared/components/SwipeableRow';

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
    deleteRecurringService,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<RecurringService | null>(null);


  useEffect(() => {
    loadRecurringServices();
    loadServicePayments();
    loadExpenses();
  }, []);

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setCurrentDate(newDate);
  };

  // ---- Delete handler ----
  const handleDeleteService = (service: RecurringService) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteRecurringService(serviceToDelete.id);
      showSuccess(`"${serviceToDelete.name}" eliminado`);
      loadRecurringServices();
    } catch (error) {
      showError('Error al eliminar');
    }
    setShowDeleteModal(false);
    setServiceToDelete(null);
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
    deleteModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xxl,
      width: '85%',
      maxWidth: 400,
      alignItems: 'center',
    },
    deleteModalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
    },
    deleteModalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteModalButtonCancel: {
      backgroundColor: currentTheme.surface,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    deleteModalButtonConfirm: {
      backgroundColor: currentTheme.error,
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
              <SwipeableRow
                key={service.id}
                onDelete={() => handleDeleteService(service)}
              >
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => navigation.navigate('AddRecurringService', { serviceId: service.id })}
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
                </TouchableOpacity>
              </SwipeableRow>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('RecurringServices')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setServiceToDelete(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowDeleteModal(false);
          setServiceToDelete(null);
        }}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.deleteModalContent}>
                  <View style={{ marginBottom: spacing.lg }}>
                    <Ionicons name="alert-circle" size={48} color={currentTheme.error} />
                  </View>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.md, textAlign: 'center' }]}>
                    Eliminar Gasto Fijo
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 20 }]}>
                    {`¿Estás seguro de que quieres eliminar "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
                  </Text>
                  <View style={styles.deleteModalButtons}>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                      onPress={() => {
                        setShowDeleteModal(false);
                        setServiceToDelete(null);
                      }}
                    >
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                      onPress={confirmDeleteService}
                    >
                      <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
