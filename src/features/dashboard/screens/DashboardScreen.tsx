import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, useWindowDimensions } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { BENEFITS, BANKS, formatBenefitDays } from '../../benefits/mockBenefits';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DashboardSkeleton } from '../../../shared/components/Skeleton';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const GRID_GAP = 16;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { width } = useWindowDimensions();
  const GRID_ITEM_WIDTH = (width - 32 - GRID_GAP) / 2 - 1;
  const { expenses, getCurrentExpenses, loadExpenses, getSummary, preferences, user, categories, userBanks, getBalance, loadIncomes, loadRecurringServices, loadServicePayments, recurringServices, getServicePaymentStatus, toggleHideIncome, toggleHideExpenses } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      marginBottom: spacing.xxl,
    },
    gridItem: {
      width: GRID_ITEM_WIDTH,
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      ...shadows.sm,
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
      ...shadows.sm,
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
    benefitCard: {
      width: 200,
      backgroundColor: currentTheme.card,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      ...shadows.sm,
    },
    emptyBenefits: {
      padding: spacing.xl,
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
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
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{displayIncome(balance.totalIncome)}</Text>
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

        {/* Insights Grid */}
        <View style={styles.gridContainer}>
          {balance.totalIncome > 0 ? (
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

        {/* Daily Benefits Section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Beneficios de Hoy</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Benefits')}>
            <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Configurar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: spacing.xxl }}>
          {(() => {
            const today = new Date().getDay();
            const allDailyBenefits = BENEFITS.filter(b => b.days.includes(today));
            const displayedBenefits = userBanks.length > 0
              ? allDailyBenefits.filter(b => userBanks.some(ub => ub.bankId === b.bankId))
              : allDailyBenefits;

            if (displayedBenefits.length === 0) {
              return (
                <View style={styles.emptyBenefits}>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                    {userBanks.length > 0
                      ? "No hay beneficios hoy para tus bancos."
                      : "No hay beneficios disponibles hoy."}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Benefits')}>
                    <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Configurar mis tarjetas</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}>
                {displayedBenefits.slice(0, 5).map(benefit => {
                  const bank = BANKS.find(bk => bk.id === benefit.bankId);
                  if (!bank) return null;
                  return (
                    <View key={benefit.id} style={styles.benefitCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                        <Text style={[typography.captionBold, { color: bank.color }]}>{bank.name}</Text>
                        <Text style={[typography.bodyBold, { color: currentTheme.success }]}>{benefit.discountPercentage}% OFF</Text>
                      </View>
                      <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.xs }]}>{benefit.description}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[typography.small, { color: currentTheme.textSecondary, textTransform: 'uppercase' }]}>{benefit.category}</Text>
                        <Text style={[typography.small, { color: currentTheme.textSecondary }]}>{formatBenefitDays(benefit.days)}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            );
          })()}
        </View>

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
    </View>
  );
}
