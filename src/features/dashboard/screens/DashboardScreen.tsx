import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, useWindowDimensions, PanResponder, Animated, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { format, parseISO, subMonths, endOfMonth as getEndOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DashboardSkeleton } from '../../../shared/components/Skeleton';
import MonthCloseModal from '../components/MonthCloseModal';
import { SwipeableRow } from '../../../shared/components/SwipeableRow';
import { SwipeTutorialOverlay, hasSeenSwipeTutorial, markSwipeTutorialSeen } from '../../../shared/components/SwipeTutorialOverlay';
import { useToast } from '../../../shared/hooks/useToast';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const GRID_GAP = 16;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const GRID_ITEM_WIDTH = (width - 32 - GRID_GAP) / 2 - 1;
  const { expenses, getCurrentExpenses, loadExpenses, getSummary, preferences, user, categories, getBalance, getMonthlyIncomeBreakdown, loadIncomes, loadRecurringServices, loadServicePayments, recurringServices, getServicePaymentStatus, toggleHideIncome, toggleHideExpenses, closeMonth, addExpense, removeExpense, deleteRecurringService, markServiceAsPaid } = useStore();
  const { showToast, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMonthCloseModal, setShowMonthCloseModal] = useState(false);
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [carouselPage, setCarouselPage] = useState(0);
  const carouselPageRef = useRef(0);
  const carouselFade = useRef(new Animated.Value(1)).current;
  const changePageFn = useRef<(page: number) => void>(() => {});

  const changePage = useCallback((page: number) => {
    Animated.timing(carouselFade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      carouselPageRef.current = page;
      setCarouselPage(page);
      Animated.timing(carouselFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [carouselFade]);

  // Keep ref in sync so panResponder can call the latest version
  changePageFn.current = changePage;

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo captura si el movimiento horizontal supera al vertical
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          changePageFn.current(1);
        } else if (gestureState.dx > 50) {
          changePageFn.current(0);
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
        changePageFn.current(carouselPageRef.current === 0 ? 1 : 0);
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
      const seen = await hasSeenSwipeTutorial();
      if (!seen) setShowSwipeTutorial(true);
    };
    loadData();
  }, []);

  const handleDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await removeExpense(expenseToDelete);
      showToast({ message: 'Gasto eliminado', type: 'success', duration: 3000 });
    } catch {
      showError('No se pudo eliminar el gasto');
    } finally {
      setExpenseToDelete(null);
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    setServiceToDelete({ id, name });
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteRecurringService(serviceToDelete.id);
      showToast({ message: `"${serviceToDelete.name}" eliminado`, type: 'success', duration: 3000 });
    } catch {
      showError('No se pudo eliminar el gasto fijo');
    } finally {
      setServiceToDelete(null);
    }
  };

  const handleMarkServicePaid = async (serviceId: string, amount: number) => {
    if (markingPaidId) return;
    setMarkingPaidId(serviceId);
    try {
      const now = new Date();
      await markServiceAsPaid(serviceId, now.getMonth() + 1, now.getFullYear(), amount);
      showToast({ message: 'Marcado como pagado', type: 'success', duration: 2500 });
    } catch {
      showError('No se pudo marcar como pagado');
    } finally {
      setMarkingPaidId(null);
    }
  };

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

    currentExpenses.forEach(e => {
      if (e.categoryIds && e.categoryIds.length > 0) {
        e.categoryIds.forEach(catId => {
          categoryTotals[catId] = (categoryTotals[catId] || 0) + e.amount;
        });
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

    // currentExpenses is already filtered by selectedMonth
    const monthExpenses = currentExpenses;

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
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.lg,
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
      bottom: 16,
      backgroundColor: currentTheme.primary,
      width: 54,
      height: 54,
      borderRadius: 27,
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

  const firstName = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Invitado').split(' ')[0];
  const avatarUri = user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    (user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}` : 'https://ui-avatars.com/api/?name=Invitado');

  const stickyHeader = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: currentTheme.background }]}>
      <View>
        <Text style={[typography.title, { color: currentTheme.text }]}>
          Hola, {firstName}
        </Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading && expenses.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
        {stickyHeader}
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}>
          <DashboardSkeleton isDark={isDark} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.background }}>
      {stickyHeader}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.primary]}
            tintColor={currentTheme.primary}
          />
        }
      >

        {/* Main Balance Card */}
        <TouchableOpacity
          style={[styles.mainCard, { backgroundColor: balance.balance >= 0 ? currentTheme.primary : currentTheme.error }]}
          onPress={() => navigation.navigate('Statistics')}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, opacity: 0.6 }}>
            <Ionicons name="stats-chart-outline" size={13} color="#FFFFFF" />
            <Text style={[typography.small, { color: '#FFFFFF', marginLeft: 4 }]}>Ver estadísticas</Text>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Insights Carousel */}
        <View>
          <Animated.View style={[styles.gridContainer, { opacity: carouselFade }]} {...panResponder.panHandlers}>
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
          </Animated.View>

          {/* Pagination Dots - Only when income > 0 */}
          {balance.totalIncome > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg, gap: spacing.xs }}>
              <TouchableOpacity onPress={() => changePage(0)} activeOpacity={0.7}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: carouselPage === 0 ? currentTheme.primary : currentTheme.border,
                }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changePage(1)} activeOpacity={0.7}>
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
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.md }}
          style={{ marginBottom: spacing.xxl }}
        >
          <TouchableOpacity style={styles.carouselCard} onPress={() => navigation.navigate('Statistics')}>
            <View style={[styles.carouselIcon, { backgroundColor: '#FF5722' }]}>
              <Ionicons name="stats-chart" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Estadísticas</Text>
              <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Gráficos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.carouselCard} onPress={() => navigation.navigate('MonthlyPayments')}>
            <View style={[styles.carouselIcon, { backgroundColor: '#F44336' }]}>
              <Ionicons name="flash" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Gastos Fijos</Text>
              <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Servicios y más</Text>
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

          <TouchableOpacity style={styles.carouselCard} onPress={() => navigation.navigate('WhatsApp')}>
            <View style={[styles.carouselIcon, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>WhatsApp</Text>
              <Text style={[typography.small, { color: currentTheme.textSecondary }]}>Bot y puntos</Text>
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
              nestedScrollEnabled
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
                <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: spacing.xxl }}>
              {pendingFixedExpenses.slice(0, 4).map((service) => {
                const today = new Date().getDate();
                const isOverdue = service.day_of_month < today;

                return (
                  <SwipeableRow key={service.id} onDelete={() => handleDeleteService(service.id, service.name)}>
                    <TouchableOpacity
                      style={[styles.expenseItem]}
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
                      <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                        <Text style={[typography.bodyBold, { color: isOverdue ? currentTheme.error : currentTheme.text }]}>
                          ${formatCurrencyDisplay(service.estimated_amount)}
                        </Text>
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation(); handleMarkServicePaid(service.id, service.estimated_amount); }}
                          disabled={markingPaidId === service.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 3,
                            backgroundColor: currentTheme.success + '20',
                            borderRadius: borderRadius.sm,
                            borderWidth: 1,
                            borderColor: currentTheme.success + '40',
                            opacity: markingPaidId === service.id ? 0.5 : 1,
                          }}
                        >
                          <Ionicons name="checkmark" size={12} color={currentTheme.success} />
                          <Text style={[typography.small, { color: currentTheme.success, fontWeight: '600' }]}>
                            {markingPaidId === service.id ? '...' : 'Pagar'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </SwipeableRow>
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
          {currentExpenses.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('AllExpenses')}>
              <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Ver Todo</Text>
            </TouchableOpacity>
          )}
        </View>
        {currentExpenses.slice(0, 5).map((expense) => {
          const primaryCatId = expense.categoryIds?.[0];
          const category = categories.find(c => c.id === primaryCatId) || { name: 'Desconocido', icon: 'pricetag', color: currentTheme.textSecondary };
          const categoryNames = expense.categoryIds?.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ');

          return (
            <View key={expense.id} style={{ marginBottom: spacing.sm }}>
              <SwipeableRow onDelete={() => handleDeleteExpense(expense.id)}>
                <TouchableOpacity style={[styles.expenseItem, { marginBottom: 0 }]} onPress={() => navigation.navigate('AddExpense', { expenseId: expense.id })} activeOpacity={0.7}>
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
                </TouchableOpacity>
              </SwipeableRow>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
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

      <SwipeTutorialOverlay
        visible={showSwipeTutorial}
        onDismiss={async () => {
          setShowSwipeTutorial(false);
          await markSwipeTutorialSeen();
        }}
      />

      {/* Modal confirmación eliminar gasto */}
      <Modal visible={!!expenseToDelete} transparent animationType="fade" onRequestClose={() => setExpenseToDelete(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }} activeOpacity={1} onPress={() => setExpenseToDelete(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: currentTheme.card, borderRadius: borderRadius.lg, padding: spacing.xl, width: 300, borderWidth: 1, borderColor: currentTheme.border, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: currentTheme.error + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
                <Ionicons name="alert-circle" size={32} color={currentTheme.error} />
              </View>
              <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.sm, textAlign: 'center' }]}>Eliminar gasto</Text>
              <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.xl, textAlign: 'center' }]}>¿Estás seguro de que querés eliminar este gasto? Esta acción no se puede revertir.</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                <TouchableOpacity style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: currentTheme.border, alignItems: 'center' }} onPress={() => setExpenseToDelete(null)}>
                  <Text style={[typography.body, { color: currentTheme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: currentTheme.error, alignItems: 'center' }} onPress={confirmDeleteExpense}>
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal confirmación eliminar gasto fijo */}
      <Modal visible={!!serviceToDelete} transparent animationType="fade" onRequestClose={() => setServiceToDelete(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }} activeOpacity={1} onPress={() => setServiceToDelete(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: currentTheme.card, borderRadius: borderRadius.lg, padding: spacing.xl, width: 300, borderWidth: 1, borderColor: currentTheme.border, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: currentTheme.error + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
                <Ionicons name="alert-circle" size={32} color={currentTheme.error} />
              </View>
              <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.sm, textAlign: 'center' }]}>Eliminar gasto fijo</Text>
              <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.xl, textAlign: 'center' }]}>¿Estás seguro de que querés eliminar "{serviceToDelete?.name}"? Esta acción no se puede revertir.</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                <TouchableOpacity style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: currentTheme.border, alignItems: 'center' }} onPress={() => setServiceToDelete(null)}>
                  <Text style={[typography.body, { color: currentTheme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: currentTheme.error, alignItems: 'center' }} onPress={confirmDeleteService}>
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
