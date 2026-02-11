import { useMemo } from 'react';
import { useStore } from '../../../store/useStore';
import { isWithinInterval, parseISO, isSameMonth, subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Expense, Category } from '../../expenses/types';

export type PeriodType = 'this_month' | 'last_month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CategoryBarData {
  label: string;
  value: number;
  frontColor: string;
  icon: string;
  categoryId: string;
  percentage: number;
}

export interface MonthlyComparisonData {
  label: string;
  incomeValue: number;
  expenseValue: number;
}

export interface DistributionData {
  value: number;
  color: string;
  label: string;
  percentage: number;
  amount: number;
  idealPercentage: number;
}

export interface StatisticsData {
  categoryBars: CategoryBarData[];
  totalExpensesInPeriod: number;
  monthlyComparison: MonthlyComparisonData[];
  distribution: DistributionData[];
  hasData: boolean;
  periodLabel: string;
}

const FINANCIAL_TYPE_CONFIG: Record<string, { label: string; color: string; ideal: number }> = {
  needs: { label: 'Necesidades', color: '#2196F3', ideal: 50 },
  wants: { label: 'Gustos', color: '#FF9800', ideal: 30 },
  savings: { label: 'Ahorros', color: '#4CAF50', ideal: 20 },
  unclassified: { label: 'Sin clasificar', color: '#9E9E9E', ideal: 0 },
};

export function useStatisticsData(dateRange: DateRange): StatisticsData {
  const expenses = useStore((state) => state.expenses);
  const categories = useStore((state) => state.categories);
  const incomes = useStore((state) => state.incomes);
  const getCurrentExpenses = useStore((state) => state.getCurrentExpenses);
  const getMonthlyIncomeBreakdown = useStore((state) => state.getMonthlyIncomeBreakdown);

  return useMemo(() => {
    const allCurrentExpenses = getCurrentExpenses();

    // Filter expenses by date range
    const periodExpenses = allCurrentExpenses.filter((e) => {
      const expenseDate = parseISO(e.date);
      return isWithinInterval(expenseDate, { start: dateRange.start, end: dateRange.end });
    });

    const totalExpensesInPeriod = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // === Chart 1: Category Bars ===
    const categoryTotals: Record<string, number> = {};
    periodExpenses.forEach((expense) => {
      expense.categoryIds.forEach((catId) => {
        categoryTotals[catId] = (categoryTotals[catId] || 0) + expense.amount;
      });
    });

    const categoryBars: CategoryBarData[] = Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const category = categories.find((c) => c.id === catId);
        const name = category?.name || 'Sin categoría';
        return {
          label: name.length > 12 ? name.slice(0, 12) + '...' : name,
          value: amount,
          frontColor: category?.color || '#9E9E9E',
          icon: category?.icon || 'pricetag',
          categoryId: catId,
          percentage: totalExpensesInPeriod > 0 ? (amount / totalExpensesInPeriod) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // === Chart 2: Income vs Expenses (last 6 months) ===
    const now = new Date();
    const monthlyComparison: MonthlyComparisonData[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthExpenses = allCurrentExpenses
        .filter((e) => isSameMonth(parseISO(e.date), monthDate))
        .reduce((sum, e) => sum + e.amount, 0);

      const monthIncome = getMonthlyIncomeBreakdown(monthDate).total;

      monthlyComparison.push({
        label: format(monthDate, 'MMM', { locale: es }),
        incomeValue: monthIncome,
        expenseValue: monthExpenses,
      });
    }

    // === Chart 3: Financial Type Distribution ===
    const typeTotals: Record<string, number> = {};
    periodExpenses.forEach((expense) => {
      const type = expense.financialType || 'unclassified';
      typeTotals[type] = (typeTotals[type] || 0) + expense.amount;
    });

    const distribution: DistributionData[] = Object.entries(FINANCIAL_TYPE_CONFIG)
      .filter(([key]) => typeTotals[key] && typeTotals[key] > 0)
      .map(([key, config]) => {
        const amount = typeTotals[key] || 0;
        return {
          value: amount,
          color: config.color,
          label: config.label,
          percentage: totalExpensesInPeriod > 0 ? (amount / totalExpensesInPeriod) * 100 : 0,
          amount,
          idealPercentage: config.ideal,
        };
      });

    // Period label
    const startLabel = format(dateRange.start, 'MMMM yyyy', { locale: es });
    const endLabel = format(dateRange.end, 'MMMM yyyy', { locale: es });
    const periodLabel = startLabel === endLabel
      ? startLabel.charAt(0).toUpperCase() + startLabel.slice(1)
      : `${format(dateRange.start, 'MMM yyyy', { locale: es })} - ${format(dateRange.end, 'MMM yyyy', { locale: es })}`;

    return {
      categoryBars,
      totalExpensesInPeriod,
      monthlyComparison,
      distribution,
      hasData: totalExpensesInPeriod > 0,
      periodLabel,
    };
  }, [expenses, categories, incomes, dateRange.start.getTime(), dateRange.end.getTime()]);
}
