import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
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
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showSuccess, showError } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadRecurringServices();
    loadServicePayments();
    loadExpenses();
  }, []);

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment, 1);
    setCurrentDate(newDate);
  };

  const handleMarkAsPaid = async (service: RecurringService) => {
    const amount = service.estimated_amount;
    const message = `¿Marcar "${service.name}" como pagado?\n\nMonto: $${formatCurrencyDisplay(amount)}`;

    const confirmed = Platform.OS === 'web'
      ? window.confirm(message)
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
      ? window.confirm(message)
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
                    <TouchableOpacity
                      style={styles.paidBadge}
                      onPress={() => handleUnmarkPayment(service)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.paidText}>Pagado</Text>
                    </TouchableOpacity>
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
    </View>
  );
}
