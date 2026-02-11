import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Theme } from '../../../shared/theme';
import { MonthlyComparisonData } from '../hooks/useStatisticsData';

interface IncomeVsExpensesChartProps {
  data: MonthlyComparisonData[];
  currentTheme: Theme;
}

export default function IncomeVsExpensesChart({ data, currentTheme }: IncomeVsExpensesChartProps) {
  if (data.length === 0) return null;

  // Build grouped bar data: income + expense pairs per month
  const barData = data.flatMap((item) => [
    {
      value: item.incomeValue,
      label: item.label,
      frontColor: currentTheme.success,
      spacing: 2,
    },
    {
      value: item.expenseValue,
      frontColor: currentTheme.error,
      spacing: 16,
    },
  ]);

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
      <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>
        Ingresos vs Gastos
      </Text>

      <BarChart
        data={barData}
        barWidth={12}
        barBorderRadius={4}
        noOfSections={4}
        xAxisLabelTextStyle={{ color: currentTheme.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: currentTheme.textSecondary, fontSize: 9 }}
        xAxisColor={currentTheme.border}
        yAxisColor={'transparent'}
        rulesColor={currentTheme.border}
        backgroundColor={'transparent'}
        isAnimated
        animationDuration={600}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: currentTheme.success }]} />
          <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Ingresos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: currentTheme.error }]} />
          <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Gastos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
