import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { Income } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../../../shared/hooks/useToast';
import { SwipeableRow } from '../../../shared/components/SwipeableRow';

type IncomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Income'>;

export default function IncomeScreen() {
  const navigation = useNavigation<IncomeScreenNavigationProp>();
  const {
    incomes,
    loadIncomes,
    removeIncome,
    getMonthlyIncome,
    getBalance,
    isLoadingIncomes,
    incomeTypes,
    loadIncomeTypes,
    preferences,
  } = useStore();

  const getIncomeType = (typeId: string) => {
    const found = incomeTypes.find((t) => t.id === typeId);
    return found ?? { icon: 'cash', color: '#607D8B', name: 'Otro' };
  };
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showToast, showError } = useToast();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [showAllUniqueIncomes, setShowAllUniqueIncomes] = useState(false);

  const balance = getBalance();
  const monthlyIncome = getMonthlyIncome();

  const now = new Date();
  const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
  const currentMonthName = format(now, 'MMMM', { locale: es });

  const uniqueIncomes = incomes.filter(i => !i.isRecurring);
  const thisMonthUniqueIncomes = uniqueIncomes.filter(i =>
    isWithinInterval(parseISO(i.date), monthInterval)
  );
  const displayedUniqueIncomes = showAllUniqueIncomes ? uniqueIncomes : thisMonthUniqueIncomes;
  const hasOlderIncomes = uniqueIncomes.length > thisMonthUniqueIncomes.length;

  useEffect(() => {
    loadIncomes();
    loadIncomeTypes();
  }, []);

  const handleDelete = (income: Income) => {
    setIncomeToDelete(income);
  };

  const confirmDelete = async () => {
    if (!incomeToDelete) return;
    try {
      await removeIncome(incomeToDelete.id);
      showToast({ message: 'Ingreso eliminado', type: 'success', duration: 3000 });
    } catch (error: any) {
      showError(error.message || 'Error al eliminar');
    } finally {
      setIncomeToDelete(null);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      padding: spacing.xl,
      paddingTop: insets.top + spacing.xl,
      backgroundColor: currentTheme.success,
      borderBottomLeftRadius: borderRadius.lg + 8,
      borderBottomRightRadius: borderRadius.lg + 8,
    },
    content: {
      padding: spacing.xl,
    },
    incomeCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    incomeInfo: {
      flex: 1,
    },
    recurringBadge: {
      backgroundColor: currentTheme.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: 16,
      backgroundColor: currentTheme.success,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
      shadowColor: currentTheme.success,
      shadowOpacity: 0.4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.body, { color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs }]}>
          Ingresos del Mes
        </Text>
        <Text style={[typography.amountLarge, { color: '#FFFFFF' }]}>
          ${formatCurrencyDisplay(monthlyIncome)}
        </Text>
        {balance.totalIncome > 0 && (
          <Text style={[typography.body, { color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm }]}>
            Balance disponible: ${formatCurrencyDisplay(balance.balance)}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingIncomes}
            onRefresh={loadIncomes}
            tintColor={currentTheme.success}
          />
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}
      >
        {/* Ingresos Recurrentes */}
        {incomes.filter(i => i.isRecurring).length > 0 && (
          <>
            <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>
              Ingresos Recurrentes
            </Text>
            {incomes
              .filter(i => i.isRecurring)
              .map((income) => (
                <SwipeableRow key={income.id} onDelete={() => handleDelete(income)}>
                  <TouchableOpacity
                    style={styles.incomeCard}
                    onPress={() => navigation.navigate('AddIncome', { incomeId: income.id })}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: getIncomeType(income.type).color + '20' }]}>
                      <Ionicons
                        name={getIncomeType(income.type).icon as any}
                        size={24}
                        color={getIncomeType(income.type).color}
                      />
                    </View>
                    <View style={styles.incomeInfo}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{income.description}</Text>
                      <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                        {getIncomeType(income.type).name}
                      </Text>
                      <View style={styles.recurringBadge}>
                        <Text style={[typography.small, { color: currentTheme.primary, fontWeight: '600' }]}>
                          {income.recurringFrequency === 'weekly'
                            ? `Semanal desde día ${income.recurringDay}`
                            : income.recurringFrequency === 'biweekly'
                            ? `Quincenal - Día ${income.recurringDay}`
                            : `Día ${income.recurringDay} de cada mes`
                          }
                        </Text>
                      </View>
                    </View>
                    <Text style={[typography.sectionTitle, { color: currentTheme.success }]}>
                      +${formatCurrencyDisplay(income.amount)}
                    </Text>
                  </TouchableOpacity>
                </SwipeableRow>
              ))}
          </>
        )}

        {/* Ingresos Únicos */}
        {uniqueIncomes.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.lg }}>
              <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>
                {showAllUniqueIncomes ? 'Ingresos Únicos' : `Ingresos Únicos — ${currentMonthName}`}
              </Text>
              {hasOlderIncomes && (
                <TouchableOpacity onPress={() => setShowAllUniqueIncomes(!showAllUniqueIncomes)}>
                  <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>
                    {showAllUniqueIncomes ? 'Este mes' : 'Ver historial'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {displayedUniqueIncomes.length === 0 ? (
              <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }]}>
                No hay ingresos únicos este mes
              </Text>
            ) : (
              displayedUniqueIncomes.map((income) => (
                <SwipeableRow key={income.id} onDelete={() => handleDelete(income)}>
                  <TouchableOpacity
                    style={styles.incomeCard}
                    onPress={() => navigation.navigate('AddIncome', { incomeId: income.id })}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: getIncomeType(income.type).color + '20' }]}>
                      <Ionicons
                        name={getIncomeType(income.type).icon as any}
                        size={24}
                        color={getIncomeType(income.type).color}
                      />
                    </View>
                    <View style={styles.incomeInfo}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{income.description}</Text>
                      <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                        {getIncomeType(income.type).name} • {format(new Date(income.date), 'd MMM', { locale: es })}
                      </Text>
                    </View>
                    <Text style={[typography.sectionTitle, { color: currentTheme.success }]}>
                      +${formatCurrencyDisplay(income.amount)}
                    </Text>
                  </TouchableOpacity>
                </SwipeableRow>
              ))
            )}
          </>
        )}

        {/* Empty State */}
        {incomes.length === 0 && !isLoadingIncomes && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={currentTheme.textSecondary} />
            <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.md }]}>
              No tienes ingresos registrados
            </Text>
            <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
              Agrega tu sueldo o ingresos recurrentes{'\n'}para calcular tu balance real
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddIncome')}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal confirmación eliminar ingreso */}
      <Modal visible={!!incomeToDelete} transparent animationType="fade" onRequestClose={() => setIncomeToDelete(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }} activeOpacity={1} onPress={() => setIncomeToDelete(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: currentTheme.card, borderRadius: borderRadius.lg, padding: spacing.xl, width: 300, borderWidth: 1, borderColor: currentTheme.border, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: currentTheme.error + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
                <Ionicons name="alert-circle" size={32} color={currentTheme.error} />
              </View>
              <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.sm, textAlign: 'center' }]}>Eliminar ingreso</Text>
              <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.xl, textAlign: 'center' }]}>¿Estás seguro de que querés eliminar este ingreso? Esta acción no se puede revertir.</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                <TouchableOpacity style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: currentTheme.border, alignItems: 'center' }} onPress={() => setIncomeToDelete(null)}>
                  <Text style={[typography.body, { color: currentTheme.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: currentTheme.error, alignItems: 'center' }} onPress={confirmDelete}>
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
