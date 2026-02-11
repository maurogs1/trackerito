import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Theme } from '../../../shared/theme';
import { DistributionData } from '../hooks/useStatisticsData';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';

interface DistributionChartProps {
  data: DistributionData[];
  totalExpenses: number;
  currentTheme: Theme;
}

export default function DistributionChart({ data, totalExpenses, currentTheme }: DistributionChartProps) {
  if (data.length === 0) return null;

  const pieData = data.map((item) => ({
    value: item.value,
    color: item.color,
    text: `${item.percentage.toFixed(0)}%`,
  }));

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
      <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>
        Distribución 50/30/20
      </Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          innerRadius={55}
          radius={85}
          innerCircleColor={currentTheme.card}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Total</Text>
              <Text style={[typography.bodyBold, { color: currentTheme.text, fontSize: 15 }]}>
                ${formatCurrencyDisplay(totalExpenses)}
              </Text>
            </View>
          )}
          isAnimated
        />
      </View>

      {/* Legend */}
      <View style={{ marginTop: spacing.lg }}>
        {data.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[typography.body, { color: currentTheme.text, flex: 1 }]}>{item.label}</Text>
            <View style={styles.legendRight}>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                {item.percentage.toFixed(0)}%
              </Text>
              {item.idealPercentage > 0 && (
                <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                  ideal: {item.idealPercentage}%
                </Text>
              )}
            </View>
            <Text style={[typography.caption, { color: currentTheme.textSecondary, width: 80, textAlign: 'right' }]}>
              ${formatCurrencyDisplay(item.amount)}
            </Text>
          </View>
        ))}
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
  chartContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  legendRight: {
    alignItems: 'flex-end',
    marginRight: spacing.md,
  },
});
