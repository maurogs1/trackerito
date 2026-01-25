import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function UpcomingPayments() {
  const { getUpcomingExpenses, preferences, categories } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const upcomingExpenses = getUpcomingExpenses();

  // Agrupar por mes
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof upcomingExpenses> = {};

    upcomingExpenses.forEach((expense) => {
      const monthKey = format(new Date(expense.date), 'MMMM yyyy', { locale: es });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(expense);
    });

    return groups;
  }, [upcomingExpenses]);

  const months = Object.keys(groupedByMonth);

  if (upcomingExpenses.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.emptyState, { backgroundColor: currentTheme.card }]}>
          <Ionicons name="calendar-outline" size={48} color={currentTheme.textSecondary} />
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            No hay pagos programados
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={24} color={currentTheme.primary} />
        <Text style={[styles.title, { color: currentTheme.text }]}>
          Próximos Pagos
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {months.map((month) => {
          const expenses = groupedByMonth[month];
          const total = expenses.reduce((sum, e) => sum + e.amount, 0);

          return (
            <View key={month} style={[styles.monthCard, { backgroundColor: currentTheme.card }]}>
              <View style={styles.monthHeader}>
                <Text style={[styles.monthTitle, { color: currentTheme.text }]}>
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </Text>
                <View style={[styles.totalBadge, { backgroundColor: currentTheme.primary + '20' }]}>
                  <Text style={[styles.totalText, { color: currentTheme.primary }]}>
                    {formatCurrencyDisplay(total)}
                  </Text>
                </View>
              </View>

              <View style={styles.expensesList}>
                {expenses.map((expense) => {
                  const category = categories.find((c) => expense.categoryIds.includes(c.id));

                  return (
                    <View
                      key={expense.id}
                      style={[styles.expenseItem, { borderBottomColor: currentTheme.border }]}
                    >
                      <View style={styles.expenseLeft}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: category?.color || currentTheme.primary },
                          ]}
                        >
                          <Ionicons
                            name={(category?.icon as any) || 'pricetag'}
                            size={20}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={[styles.expenseDescription, { color: currentTheme.text }]}>
                            {expense.description}
                          </Text>
                          <View style={styles.badges}>
                            <Text style={[styles.dateText, { color: currentTheme.textSecondary }]}>
                              {format(new Date(expense.date), 'dd MMM', { locale: es })}
                            </Text>
                            {expense.installmentNumber && (
                              <View style={[styles.installmentBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                                <Text style={[styles.installmentText, { color: currentTheme.primary }]}>
                                  Cuota {expense.installmentNumber}/{expense.installments}
                                </Text>
                              </View>
                            )}
                            <View style={[styles.pendingBadge, { backgroundColor: currentTheme.warning + '15' }]}>
                              <Text style={[styles.pendingText, { color: currentTheme.warning }]}>
                                Pendiente
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.expenseAmount, { color: currentTheme.text }]}>
                        {formatCurrencyDisplay(expense.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  monthCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
  },
  installmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  installmentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
