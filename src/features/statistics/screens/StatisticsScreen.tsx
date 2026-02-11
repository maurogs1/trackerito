import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useStatisticsData, PeriodType, DateRange } from '../hooks/useStatisticsData';
import PeriodSelector from '../components/PeriodSelector';
import CategoryBarsChart from '../components/CategoryBarsChart';
import IncomeVsExpensesChart from '../components/IncomeVsExpensesChart';
import DistributionChart from '../components/DistributionChart';
import EmptyChartState from '../components/EmptyChartState';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';

export default function StatisticsScreen() {
  const { preferences, loadExpenses, loadIncomes } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);

  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [customStart, setCustomStart] = useState<Date>(startOfMonth(new Date()));
  const [customEnd, setCustomEnd] = useState<Date>(endOfMonth(new Date()));
  const [refreshing, setRefreshing] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const dateRange: DateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  }, [period, customStart, customEnd]);

  const stats = useStatisticsData(dateRange);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadExpenses(), loadIncomes()]);
    setRefreshing(false);
  }, []);

  const handleCustomRange = () => {
    setShowCustomModal(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    if (selectedDate) {
      if (showDatePicker === 'start') {
        setCustomStart(startOfMonth(selectedDate));
      } else if (showDatePicker === 'end') {
        setCustomEnd(endOfMonth(selectedDate));
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: 40,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
      padding: spacing.md,
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xxl,
      width: '85%',
      maxWidth: 400,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
    },
    datePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.primary]}
            tintColor={currentTheme.primary}
          />
        }
      >
        {/* Period Selector */}
        <PeriodSelector
          selected={period}
          onSelect={setPeriod}
          onCustomRange={handleCustomRange}
          currentTheme={currentTheme}
        />

        {/* Period Label */}
        <Text style={[typography.caption, { color: currentTheme.textSecondary, marginBottom: spacing.lg, textAlign: 'center' }]}>
          {stats.periodLabel}
        </Text>

        {!stats.hasData ? (
          <EmptyChartState currentTheme={currentTheme} />
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Total Gastos</Text>
                <Text style={[typography.bodyBold, { color: currentTheme.error, fontSize: 16 }]}>
                  ${formatCurrencyDisplay(stats.totalExpensesInPeriod)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Categorías</Text>
                <Text style={[typography.bodyBold, { color: currentTheme.primary, fontSize: 16 }]}>
                  {stats.categoryBars.length}
                </Text>
              </View>
            </View>

            {/* Chart 1: Category Bars */}
            <CategoryBarsChart
              data={stats.categoryBars}
              totalExpenses={stats.totalExpensesInPeriod}
              currentTheme={currentTheme}
            />

            {/* Chart 2: Income vs Expenses */}
            <IncomeVsExpensesChart
              data={stats.monthlyComparison}
              currentTheme={currentTheme}
            />

            {/* Chart 3: Distribution 50/30/20 */}
            <DistributionChart
              data={stats.distribution}
              totalExpenses={stats.totalExpensesInPeriod}
              currentTheme={currentTheme}
            />
          </>
        )}
      </ScrollView>

      {/* Custom Range Modal */}
      <Modal visible={showCustomModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowCustomModal(false)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg, textAlign: 'center' }]}>
                  Rango personalizado
                </Text>

                <TouchableOpacity
                  style={styles.datePickerRow}
                  onPress={() => setShowDatePicker('start')}
                  activeOpacity={0.7}
                >
                  <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Desde</Text>
                  <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                    {format(customStart, 'MMMM yyyy', { locale: es })}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePickerRow, { borderBottomWidth: 0 }]}
                  onPress={() => setShowDatePicker('end')}
                  activeOpacity={0.7}
                >
                  <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Hasta</Text>
                  <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                    {format(customEnd, 'MMMM yyyy', { locale: es })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={showDatePicker === 'start' ? customStart : customEnd}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.surface }]}
                    onPress={() => setShowCustomModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[typography.bodyBold, { color: currentTheme.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.primary }]}
                    onPress={() => {
                      setShowCustomModal(false);
                      setShowDatePicker(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[typography.bodyBold, { color: '#FFF' }]}>Aplicar</Text>
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
