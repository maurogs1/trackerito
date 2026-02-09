import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, useWindowDimensions, PanResponder } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { format, parseISO, subMonths, endOfMonth as getEndOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DashboardSkeleton } from '../../../shared/components/Skeleton';
import MonthCloseModal from '../components/MonthCloseModal';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const GRID_GAP = 16;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { width } = useWindowDimensions();
  const GRID_ITEM_WIDTH = (width - 32 - GRID_GAP) / 2 - 1;
  const { expenses, getCurrentExpenses, loadExpenses, getSummary, preferences, user, categories, getBalance, getMonthlyIncomeBreakdown, loadIncomes, loadRecurringServices, loadServicePayments, recurringServices, getServicePaymentStatus, toggleHideIncome, toggleHideExpenses, closeMonth, addExpense } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMonthCloseModal, setShowMonthCloseModal] = useState(false);
  const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
  const [carouselPage, setCarouselPage] = useState(0);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => balance.totalIncome > 0,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond if horizontal movement is greater than vertical
        return balance.totalIncome > 0 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        // Swipe left (negative dx) - next page
        if (gestureState.dx < -50) {
          setCarouselPage(1);
        }
        // Swipe right (positive dx) - previous page
        else if (gestureState.dx > 50) {
          setCarouselPage(0);
        }
      },
    })
  ).current;

  const summary = getSummary();
  const balance = getBalance();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const hideIncome = preferences.hideIncome ?? false;
  const hideExpenses = preferences.hideExpenses ?? false;

  const displayIncome = (amount: number, prefix: string = '$') => {
    if (hideIncome) return '••••••';
    return `${prefix}${formatCurrencyDisplay(amount)}`;
  };

  const displayExpense = (amount: number, prefix: string = '$') => {
    if (hideExpenses) return '••••••';
    return `${prefix}${formatCurrencyDisplay(amount)}`;
  };

  const currentExpenses = getCurrentExpenses();

  // Auto-advance carousel every 15 seconds
  useEffect(() => {
    if (balance.totalIncome > 0) {
      const interval = setInterval(() => {
        setCarouselPage((prev) => (prev === 0 ? 1 : 0));
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [balance.totalIncome]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadExpenses(),
        loadIncomes(),
        loadRecurringServices(),
        loadServicePayments(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Detectar si hay un mes sin cerrar
  useEffect(() => {
    if (isLoading) return;

    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');

    // Si ya cerramos este mes, no mostrar modal
    if (preferences.lastClosedMonth === currentMonthKey) return;

    // Calcular el saldo del mes anterior
    const prevMonth = subMonths(now, 1);
    const prevMonthIncome = getMonthlyIncomeBreakdown(prevMonth);
    const allExpenses = getCurrentExpenses();
    const prevMonthExpenses = allExpenses.filter((e: any) => {
      const expDate = new Date(e.date);
      return expDate.getMonth() === prevMonth.getMonth() &&
             expDate.getFullYear() === prevMonth.getFullYear();
    });
    const totalPrevExpenses = prevMonthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    // Solo incluir el carryover anterior si existía
    const prevCarryover = preferences.carryoverAmount || 0;
    const remaining = prevMonthIncome.total + prevCarryover - totalPrevExpenses;

    // Solo mostrar si hay ingresos configurados (usuario usa la feature de ingresos)
    if (prevMonthIncome.total > 0) {
      setPreviousMonthBalance(remaining);
      setShowMonthCloseModal(true);
    } else {
      // Si no tiene ingresos, cerrar automáticamente
      closeMonth(currentMonthKey, 0);
    }
  }, [isLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadExpenses(),
      loadIncomes(),
      loadRecurringServices(),
      loadServicePayments(),
    ]);
    setRefreshing(false);
  }, []);

  // Nombre del mes anterior para el modal
  const previousMonthName = format(subMonths(new Date(), 1), 'MMMM', { locale: es });

  // Handlers del modal de cierre de mes
  const handleCarryOver = (amount: number) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    closeMonth(currentMonthKey, amount);
    setShowMonthCloseModal(false);
  };

  const handleRegisterAsExpense = async (expenseAmount: number, carryoverAmount: number) => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');

    // Crear un gasto de ajuste en el último día del mes anterior
    if (expenseAmount > 0) {
      const prevMonth = subMonths(new Date(), 1);
      const lastDay = getEndOfMonth(prevMonth);

      try {
        await addExpense({
          amount: expenseAmount,
          description: 'Ajuste - gastos no registrados',
          date: format(lastDay, 'yyyy-MM-dd'),
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          financialType: 'needs',
          categoryIds: [],
        });
      } catch (e) {
        console.error('Error creando gasto de ajuste:', e);
      }
    }

    closeMonth(currentMonthKey, carryoverAmount);
    setShowMonthCloseModal(false);
  };

  const handleStartFresh = () => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    closeMonth(currentMonthKey, 0);
    setShowMonthCloseModal(false);
  };

  const topCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const currentMonth = new Date().getMonth();

    currentExpenses.forEach(e => {
      if (new Date(e.date).getMonth() === currentMonth) {
        if (e.categoryIds && e.categoryIds.length > 0) {
          e.categoryIds.forEach(catId => {
            categoryTotals[catId] = (categoryTotals[catId] || 0) + e.amount;
          });
        }
      }
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;

    const categoryId = sorted[0][0];
    const category = categories.find(c => c.id === categoryId);

    return {
      name: category?.name || 'Desconocido',
      amount: sorted[0][1],
      icon: category?.icon || 'pricetag',
      color: category?.color || currentTheme.text
    };
  }, [currentExpenses, categories]);

  const tips = useMemo(() => {
    const tipsList: { icon: string; title: string; description: string; color: string }[] = [];
    const currentMonth = new Date().getMonth();

    // Filter current month expenses
    const monthExpenses = currentExpenses.filter(e => new Date(e.date).getMonth() === currentMonth);

    if (monthExpenses.length === 0) {
      tipsList.push({
        icon: 'add-circle-outline',
        title: 'Empezá a registrar',
        description: 'Registrá tu primer gasto para ver insights personalizados',
        color: currentTheme.primary,
      });
    }

    if (balance.totalIncome === 0 && monthExpenses.length > 0) {
      tipsList.push({
        icon: 'wallet-outline',
        title: 'Configurá ingresos',
        description: 'Agregá tus ingresos para ver tu balance real y disponible por día',
        color: currentTheme.primary,
      });
    }

    // 50/30/20 analysis
    if (monthExpenses.length > 0 && balance.totalIncome > 0) {
      const needsTotal = monthExpenses.filter(e => e.financialType === 'needs').reduce((s, e) => s + e.amount, 0);
      const wantsTotal = monthExpenses.filter(e => e.financialType === 'wants').reduce((s, e) => s + e.amount, 0);
      const needsPercent = Math.round((needsTotal / balance.totalIncome) * 100);
      const wantsPercent = Math.round((wantsTotal / balance.totalIncome) * 100);

      if (needsPercent > 50) {
        tipsList.push({
          icon: 'alert-circle-outline',
          title: `Necesidades: ${needsPercent}%`,
          description: `La regla 50/30/20 sugiere máximo 50%. Revisá si podés reducir gastos esenciales`,
          color: currentTheme.warning,
        });
      } else if (wantsPercent > 30) {
        tipsList.push({
          icon: 'heart-outline',
          title: `Gustos: ${wantsPercent}%`,
          description: `La regla 50/30/20 sugiere máximo 30% en gustos. Estás un poco arriba`,
          color: currentTheme.warning,
        });
      }
    }

    // Top category insight
    if (topCategory && topCategory.amount > 0) {
      const savingsIfReduced = Math.round(topCategory.amount * 0.2);
      tipsList.push({
        icon: 'bulb-outline',
        title: `Top: ${topCategory.name}`,
        description: `Gastaste $${formatCurrencyDisplay(topCategory.amount)}. Reducirlo un 20% = $${formatCurrencyDisplay(savingsIfReduced)} de ahorro`,
        color: topCategory.color,
      });
    }

    // Fixed expenses ratio
    if (balance.totalIncome > 0) {
      const fixedTotal = summary.totalFixed + summary.pendingRecurring;
      const fixedPercent = Math.round((fixedTotal / balance.totalIncome) * 100);
      if (fixedPercent > 30) {
        tipsList.push({
          icon: 'flash-outline',
          title: `Fijos: ${fixedPercent}% del ingreso`,
          description: 'Lo recomendado es que no superen el 30% de tus ingresos',
          color: currentTheme.error,
        });
      }
    }

    // Projection warning
    if (balance.totalIncome > 0 && summary.projectedBalance > balance.totalIncome) {
      tipsList.push({
        icon: 'trending-up-outline',
        title: 'Proyección alta',
        description: `A este ritmo gastarías $${formatCurrencyDisplay(summary.projectedBalance)}, más que tu ingreso`,
        color: currentTheme.error,
      });
    }

    // Positive reinforcement
    if (balance.totalIncome > 0 && balance.balance > 0 && summary.projectedBalance <= balance.totalIncome) {
      const availablePercent = Math.round((balance.balance / balance.totalIncome) * 100);
      tipsList.push({
        icon: 'checkmark-circle-outline',
        title: 'Vas bien este mes',
        description: `Tenés el ${availablePercent}% de tu ingreso disponible. Seguí así`,
        color: currentTheme.success,
      });
    }

    // Spending trend vs previous month
    if (summary.previousMonthBalance > 0 && monthExpenses.length > 0) {
      const currentTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
      const dayOfMonth = new Date().getDate();
      const projectedCurrent = (currentTotal / dayOfMonth) * 30;
      const diff = Math.round(((projectedCurrent - summary.previousMonthBalance) / summary.previousMonthBalance) * 100);

      if (Math.abs(diff) > 10) {
        tipsList.push({
          icon: diff > 0 ? 'arrow-up-outline' : 'arrow-down-outline',
          title: diff > 0 ? `${diff}% más que el mes pasado` : `${Math.abs(diff)}% menos que el mes pasado`,
          description: diff > 0 ? 'Estás gastando más que el mes anterior a este ritmo' : 'Bien, estás gastando menos que el mes anterior',
          color: diff > 0 ? currentTheme.warning : currentTheme.success,
        });
      }
    }

    return tipsList.slice(0, 3);
  }, [currentExpenses, balance, summary, topCategory, categories]);

  const pendingFixedExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return recurringServices
      .filter(service => {
        const payment = getServicePaymentStatus(service.id, currentMonth, currentYear);
        return payment?.status !== 'paid';
      })
      .sort((a, b) => a.day_of_month - b.day_of_month);
  }, [recurringServices, getServicePaymentStatus]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xxl,
      marginTop: spacing.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: currentTheme.primary,
    },
    mainCard: {
      backgroundColor: currentTheme.primary,
      padding: spacing.xxl,
      borderRadius: borderRadius.lg + 8,
      marginBottom: spacing.xxl,
      alignItems: 'center',
      ...shadows.lg,
      shadowColor: currentTheme.primary,
      shadowOpacity: 0.3,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      
    },
    gridItem: {
      width: GRID_ITEM_WIDTH,
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    expenseItem: {
      backgroundColor: currentTheme.card,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: 30,
      backgroundColor: currentTheme.primary,
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
      shadowColor: currentTheme.primary,
      shadowOpacity: 0.4,
    },
    carouselCard: {
      width: 130,
      height: 120,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      justifyContent: 'space-between',
      backgroundColor: currentTheme.card,
      borderWidth: 1,
      borderColor: currentTheme.border,
      marginRight: spacing.xs,
    },
    carouselIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tipCard: {
      width: 260,
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
  });

  if (isLoading && expenses.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 10 }}>
          <View style={styles.header}>
            <View>
              <Text style={[typography.title, { color: currentTheme.text }]}>
                Hola, {(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Invitado').split(' ')[0]}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Image
                source={{
                  uri: user?.user_metadata?.avatar_url ||
                    user?.user_metadata?.picture ||
                    (user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}` : 'https://ui-avatars.com/api/?name=Invitado')
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
          <DashboardSkeleton isDark={isDark} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.primary]}
            tintColor={currentTheme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.title, { color: currentTheme.text }]}>
              Hola, {(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Invitado').split(' ')[0]}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Image
              source={{
                uri: user?.user_metadata?.avatar_url ||
                  user?.user_metadata?.picture ||
                  (user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}` : 'https://ui-avatars.com/api/?name=Invitado')
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        {/* Main Balance Card */}
        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: balance.balance >= 0 ? currentTheme.primary : currentTheme.error }]}
          onPress={() => navigation.navigate('Income')}
          activeOpacity={0.9}
        >
          <View style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ padding: 6, backgroundColor: hideIncome ? 'rgba(255,255,255,0.2)' : 'transparent', borderRadius: 16 }}
              onPress={(e) => { e.stopPropagation(); toggleHideIncome(); }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Ionicons name={hideIncome ? 'eye-off-outline' : 'eye-outline'} size={16} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 6, backgroundColor: hideExpenses ? 'rgba(255,255,255,0.2)' : 'transparent', borderRadius: 16 }}
              onPress={(e) => { e.stopPropagation(); toggleHideExpenses(); }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="card-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Ionicons name={hideExpenses ? 'eye-off-outline' : 'eye-outline'} size={16} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[typography.body, { color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm }]}>
            {balance.totalIncome > 0 ? 'Disponible' : 'Gastado este Mes'}
          </Text>
          <Text style={[typography.amountLarge, { color: '#FFFFFF', fontSize: 48 }]}>
            {balance.totalIncome > 0
              ? (hideIncome || hideExpenses ? '••••••' : `$${formatCurrencyDisplay(Math.abs(balance.balance))}`)
              : displayExpense(summary.totalBalance)
            }
          </Text>

          {balance.totalIncome > 0 && (
            <>
              {!hideIncome && (
                <View style={{ width: '100%', marginTop: spacing.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>
                      Gastado: {displayExpense(balance.totalExpenses)}
                    </Text>
                    <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>
                      de {displayIncome(balance.totalIncome)}
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 4,
                        width: hideExpenses ? '50%' : `${Math.min((balance.totalExpenses / balance.totalIncome) * 100, 100)}%`
                      }}
                    />
                  </View>
                  <Text style={[typography.small, { color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center' }]}>
                    {hideExpenses ? '••%' : `${Math.round((balance.totalExpenses / balance.totalIncome) * 100)}%`} del ingreso usado
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' }}>
                <View style={{ alignItems: 'center', minWidth: 70 }}>
                  <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>Ingresos</Text>
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{displayIncome(balance.confirmedIncome)}</Text>
                  {balance.pendingIncome > 0 && !hideIncome && (
                    <View style={{ backgroundColor: 'rgba(255,213,79,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2 }}>
                      <Text style={[typography.small, { color: '#FFD54F', fontSize: 10 }]}>
                        +${formatCurrencyDisplay(balance.pendingIncome)} pendiente
                      </Text>
                    </View>
                  )}
                  {balance.carryover > 0 && !hideIncome && (
                    <View style={{ backgroundColor: 'rgba(129,199,132,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2 }}>
                      <Text style={[typography.small, { color: '#81C784', fontSize: 10 }]}>
                        +${formatCurrencyDisplay(balance.carryover)} anterior
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'center', minWidth: 70 }}>
                  <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>Gastado</Text>
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{displayExpense(balance.totalExpenses)}</Text>
                </View>
                {balance.pendingRecurring > 0 && (
                  <View style={{ alignItems: 'center', minWidth: 70 }}>
                    <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>Por Pagar</Text>
                    <Text style={[typography.bodyBold, { color: '#FFD54F' }]}>{displayExpense(balance.pendingRecurring)}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {balance.totalIncome === 0 && (
            <TouchableOpacity
              style={{ marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}
              onPress={() => navigation.navigate('Income')}
            >
              <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>+ Agregar ingresos</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Insights Carousel */}
        <View>
          <View style={styles.gridContainer} {...panResponder.panHandlers}>
            {balance.totalIncome > 0 ? (
              // Show carousel with 2 pages
              carouselPage === 0 ? (
                // Page 1: Cards 1-4
                <>
                  <View style={styles.gridItem}>
                    <Ionicons name="today-outline" size={24} color={(hideIncome || hideExpenses) ? currentTheme.textSecondary : (balance.availableDaily > 0 ? currentTheme.success : currentTheme.error)} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Disponible/día</Text>
                    <Text style={[typography.sectionTitle, { color: (hideIncome || hideExpenses) ? currentTheme.text : (balance.availableDaily > 0 ? currentTheme.success : currentTheme.error), marginTop: spacing.xs }]}>
                      {(hideIncome || hideExpenses) ? '••••••' : `$${formatCurrencyDisplay(balance.availableDaily)}`}
                    </Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                      {balance.daysRemaining} días restantes
                    </Text>
                  </View>

                  <View style={styles.gridItem}>
                    <Ionicons
                      name={hideExpenses ? "analytics-outline" : (summary.projectedBalance <= balance.totalIncome ? "checkmark-circle-outline" : "warning-outline")}
                      size={24}
                      color={hideExpenses ? currentTheme.textSecondary : (summary.projectedBalance <= balance.totalIncome ? currentTheme.success : currentTheme.error)}
                    />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Proyección Mes</Text>
                    <Text style={[typography.sectionTitle, { color: hideExpenses ? currentTheme.text : (summary.projectedBalance <= balance.totalIncome ? currentTheme.success : currentTheme.error), marginTop: spacing.xs }]}>
                      {displayExpense(summary.projectedBalance)}
                    </Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                      {hideExpenses ? '••••' : (summary.projectedBalance <= balance.totalIncome ? 'Vas bien ✓' : 'Podrías excederte')}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('MonthlyPayments')} activeOpacity={0.7}>
                    <Ionicons name="flash-outline" size={24} color={currentTheme.primary} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Gastos Fijos</Text>
                    <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.totalFixed + summary.pendingRecurring)}</Text>
                    {summary.pendingRecurring > 0 && (
                      <Text style={[typography.small, { color: currentTheme.error, marginTop: 2 }]}>
                        {hideExpenses ? '••••' : `$${formatCurrencyDisplay(summary.pendingRecurring)} pendiente`}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.gridItem}>
                    <Ionicons name="shuffle-outline" size={24} color={currentTheme.secondary} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Gastos Variables</Text>
                    <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.totalVariable)}</Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                      {hideExpenses ? '••••' : `$${formatCurrencyDisplay(summary.totalVariable / Math.max(1, summary.daysPassed))}/día prom.`}
                    </Text>
                  </View>
                </>
              ) : (
                // Page 2: Cards 5-8
                <>
                  <View style={styles.gridItem}>
                    <Ionicons name="trending-down-outline" size={24} color={balance.balance > 0 ? currentTheme.success : currentTheme.error} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Balance Restante</Text>
                    <Text style={[typography.sectionTitle, { color: (hideIncome || hideExpenses) ? currentTheme.text : (balance.balance > 0 ? currentTheme.success : currentTheme.error), marginTop: spacing.xs }]}>
                      {(hideIncome || hideExpenses) ? '••••••' : `$${formatCurrencyDisplay(balance.balance)}`}
                    </Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                      Después de fijos
                    </Text>
                  </View>

                  <View style={styles.gridItem}>
                    <Ionicons name="calendar-outline" size={24} color={currentTheme.primary} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Promedio Semanal</Text>
                    <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.weeklyAverage)}</Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                      Últimas semanas
                    </Text>
                  </View>

                  <View style={styles.gridItem}>
                    <Ionicons name={topCategory?.icon as any || "pricetag-outline"} size={24} color={topCategory?.color || currentTheme.text} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Top Categoría</Text>
                    <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]} numberOfLines={1} adjustsFontSizeToFit>
                      {topCategory ? topCategory.name : '-'}
                    </Text>
                    {topCategory && (
                      <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                        ${formatCurrencyDisplay(topCategory.amount)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.gridItem}>
                    <Ionicons name="time-outline" size={24} color={currentTheme.warning} />
                    <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Mes Anterior</Text>
                    <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.previousMonthBalance)}</Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]}>
                      Total gastado
                    </Text>
                  </View>
                </>
              )
            ) : (
              // No income: show 4 cards
              <>
                <View style={styles.gridItem}>
                  <Ionicons name="calendar-outline" size={24} color={currentTheme.primary} />
                  <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Promedio Semanal</Text>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.weeklyAverage)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Ionicons name="trending-up-outline" size={24} color={currentTheme.secondary} />
                  <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Proyección Mes</Text>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.projectedBalance)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Ionicons name="time-outline" size={24} color={currentTheme.error} />
                  <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Mes Anterior</Text>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]}>{displayExpense(summary.previousMonthBalance)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Ionicons name={topCategory?.icon as any || "pricetag-outline"} size={24} color={topCategory?.color || currentTheme.text} />
                  <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.sm }]}>Top Categoría</Text>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xs }]} numberOfLines={1} adjustsFontSizeToFit>
                    {topCategory ? topCategory.name : '-'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Pagination Dots - Only when income > 0 */}
          {balance.totalIncome > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg, gap: spacing.xs }}>
              <TouchableOpacity onPress={() => setCarouselPage(0)} activeOpacity={0.7}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: carouselPage === 0 ? currentTheme.primary : currentTheme.border,
                }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCarouselPage(1)} activeOpacity={0.7}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: carouselPage === 1 ? currentTheme.primary : currentTheme.border,
                }} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Feature Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Accesos Rápidos</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.md }}
          style={{ marginBottom: spacing.xxl }}
        >
          <TouchableOpacity style={styles.carouselCard} onPress={() => navigation.navigate('MonthlyPayments')}>
            <View style={[styles.carouselIcon, { backgroundColor: '#F44336' }]}>
              <Ionicons name="flash" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Gastos Fijos</Text>
              <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Servicios y más</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.carouselCard} onPress={() => navigation.navigate('AllExpenses')}>
            <View style={[styles.carouselIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="list" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Mis Gastos</Text>
              <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Ver historial</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.carouselCard} onPress={() => navigation.navigate('FinancialEducation')}>
            <View style={[styles.carouselIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="school" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Educación</Text>
              <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Aprende más</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Tips Contextuales */}
        {tips.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Tips para vos</Text>
              <TouchableOpacity onPress={() => navigation.navigate('FinancialEducation')}>
                <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Aprender más</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
              style={{ marginBottom: spacing.xxl }}
            >
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={[styles.iconContainer, { backgroundColor: tip.color + '20', marginRight: 0 }]}>
                    <Ionicons name={tip.icon as any} size={24} color={tip.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text }]} numberOfLines={1}>{tip.title}</Text>
                    <Text style={[typography.small, { color: currentTheme.textSecondary, marginTop: 2 }]} numberOfLines={2}>{tip.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Gastos Fijos Pendientes */}
        {pendingFixedExpenses.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Gastos Fijos Pendientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MonthlyPayments')}>
                <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Ver Todos</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: spacing.xxl }}>
              {pendingFixedExpenses.slice(0, 4).map((service) => {
                const today = new Date().getDate();
                const isOverdue = service.day_of_month < today;

                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.expenseItem, isOverdue && { borderLeftWidth: 3, borderLeftColor: currentTheme.error }]}
                    onPress={() => navigation.navigate('MonthlyPayments')}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[styles.iconContainer, { backgroundColor: (service.color || '#607D8B') + '20' }]}>
                        <Ionicons name={(service.icon as any) || 'flash'} size={24} color={service.color || '#607D8B'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{service.name}</Text>
                        <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                          Vence el {service.day_of_month} {isOverdue && '• Vencido'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[typography.bodyBold, { color: isOverdue ? currentTheme.error : currentTheme.text }]}>
                        ${formatCurrencyDisplay(service.estimated_amount)}
                      </Text>
                      <View style={{
                        marginTop: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        backgroundColor: isOverdue ? currentTheme.error + '20' : currentTheme.primary + '20',
                        borderRadius: borderRadius.sm
                      }}>
                        <Text style={[typography.small, { color: isOverdue ? currentTheme.error : currentTheme.primary, fontWeight: '600' }]}>
                          Pendiente
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {pendingFixedExpenses.length > 4 && (
                <TouchableOpacity
                  style={{ alignItems: 'center', paddingVertical: spacing.sm }}
                  onPress={() => navigation.navigate('MonthlyPayments')}
                >
                  <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>
                    +{pendingFixedExpenses.length - 4} más pendientes
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Recent Expenses */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Actividad Reciente</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllExpenses')}>
            <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Ver Todo</Text>
          </TouchableOpacity>
        </View>
        {currentExpenses.slice(0, 5).map((expense) => {
          const primaryCatId = expense.categoryIds?.[0];
          const category = categories.find(c => c.id === primaryCatId) || { name: 'Desconocido', icon: 'pricetag', color: currentTheme.textSecondary };
          const categoryNames = expense.categoryIds?.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ');

          return (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.iconContainer, { backgroundColor: (category.color || '#999') + '20' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{expense.description}</Text>
                  <Text style={[typography.caption, { color: currentTheme.textSecondary }]} numberOfLines={1}>
                    {categoryNames || category.name}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.bodyBold, { color: currentTheme.error }]}>-${formatCurrencyDisplay(expense.amount)}</Text>
                <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.xs }]}>
                  {format(parseISO(expense.date), 'd MMM yyyy', { locale: es })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de cierre de mes */}
      <MonthCloseModal
        visible={showMonthCloseModal}
        isDark={isDark}
        remainingBalance={previousMonthBalance}
        previousMonthName={previousMonthName}
        onCarryOver={handleCarryOver}
        onRegisterAsExpense={handleRegisterAsExpense}
        onStartFresh={handleStartFresh}
      />
    </View>
  );
}
