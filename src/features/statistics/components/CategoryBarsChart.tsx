import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Theme } from '../../../shared/theme';
import { CategoryBarData } from '../hooks/useStatisticsData';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';

const MAX_VISIBLE = 6;
const LEGEND_ITEM_HEIGHT = 44;

interface CategoryBarsChartProps {
  data: CategoryBarData[];
  totalExpenses: number;
  currentTheme: Theme;
}

export default function CategoryBarsChart({ data, totalExpenses, currentTheme }: CategoryBarsChartProps) {
  if (data.length === 0) return null;

  const pieData = data.map((item) => ({
    value: item.value,
    color: item.frontColor,
    text: `${item.percentage.toFixed(0)}%`,
  }));

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
      <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>
        Gastos por Categoría
      </Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          innerRadius={50}
          radius={80}
          innerCircleColor={currentTheme.card}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Total</Text>
              <Text style={[typography.bodyBold, { color: currentTheme.text, fontSize: 14 }]}>
                ${formatCurrencyDisplay(totalExpenses)}
              </Text>
            </View>
          )}
          isAnimated
        />
      </View>

      {/* Legend with details - max 6 visible, scroll if more */}
      <ScrollView
        style={{ marginTop: spacing.lg, maxHeight: MAX_VISIBLE * LEGEND_ITEM_HEIGHT }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={data.length > MAX_VISIBLE}
      >
        {data.map((item) => (
          <View key={item.categoryId} style={[styles.legendItem, { height: LEGEND_ITEM_HEIGHT }]}>
            <View style={[styles.iconContainer, { backgroundColor: item.frontColor + '20' }]}>
              <Ionicons name={item.icon as any} size={16} color={item.frontColor} />
            </View>
            <Text style={[typography.body, { color: currentTheme.text, flex: 1 }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[typography.caption, { color: currentTheme.textSecondary, marginRight: spacing.sm }]}>
              {item.percentage.toFixed(0)}%
            </Text>
            <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
              ${formatCurrencyDisplay(item.value)}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
});
