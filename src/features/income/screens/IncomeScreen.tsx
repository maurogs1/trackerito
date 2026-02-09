import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { Income, INCOME_TYPE_LABELS, INCOME_TYPE_ICONS, INCOME_TYPE_COLORS } from '../types';
import { format } from 'date-fns';
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
    preferences,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

  const balance = getBalance();
  const monthlyIncome = getMonthlyIncome();

  useEffect(() => {
    loadIncomes();
  }, []);

  const handleDelete = (income: Income) => {
    setIncomeToDelete(income);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!incomeToDelete) return;
    try {
      await removeIncome(incomeToDelete.id);
      showSuccess('Ingreso eliminado');
    } catch (error: any) {
      showError(error.message || 'Error al eliminar');
    }
    setShowDeleteModal(false);
    setIncomeToDelete(null);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      padding: spacing.xl,
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
      bottom: 30,
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
    deleteModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xxl,
      width: '85%',
      maxWidth: 400,
      alignItems: 'center',
    },
    deleteModalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
    },
    deleteModalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteModalButtonCancel: {
      backgroundColor: currentTheme.surface,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    deleteModalButtonConfirm: {
      backgroundColor: currentTheme.error,
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
        contentContainerStyle={{ paddingBottom: 100 }}
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
                    <View style={[styles.iconContainer, { backgroundColor: INCOME_TYPE_COLORS[income.type] + '20' }]}>
                      <Ionicons
                        name={INCOME_TYPE_ICONS[income.type] as any}
                        size={24}
                        color={INCOME_TYPE_COLORS[income.type]}
                      />
                    </View>
                    <View style={styles.incomeInfo}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{income.description}</Text>
                      <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                        {INCOME_TYPE_LABELS[income.type]}
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
        {incomes.filter(i => !i.isRecurring).length > 0 && (
          <>
            <Text style={[typography.sectionTitle, { color: currentTheme.text, marginTop: spacing.xxl, marginBottom: spacing.lg }]}>
              Ingresos Únicos
            </Text>
            {incomes
              .filter(i => !i.isRecurring)
              .map((income) => (
                <SwipeableRow key={income.id} onDelete={() => handleDelete(income)}>
                  <TouchableOpacity
                    style={styles.incomeCard}
                    onPress={() => navigation.navigate('AddIncome', { incomeId: income.id })}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: INCOME_TYPE_COLORS[income.type] + '20' }]}>
                      <Ionicons
                        name={INCOME_TYPE_ICONS[income.type] as any}
                        size={24}
                        color={INCOME_TYPE_COLORS[income.type]}
                      />
                    </View>
                    <View style={styles.incomeInfo}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{income.description}</Text>
                      <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                        {INCOME_TYPE_LABELS[income.type]} • {format(new Date(income.date), 'd MMM', { locale: es })}
                      </Text>
                    </View>
                    <Text style={[typography.sectionTitle, { color: currentTheme.success }]}>
                      +${formatCurrencyDisplay(income.amount)}
                    </Text>
                  </TouchableOpacity>
                </SwipeableRow>
              ))}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setIncomeToDelete(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowDeleteModal(false);
          setIncomeToDelete(null);
        }}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.deleteModalContent}>
                  <View style={{ marginBottom: spacing.lg }}>
                    <Ionicons name="alert-circle" size={48} color={currentTheme.error} />
                  </View>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.md, textAlign: 'center' }]}>
                    Eliminar Ingreso
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 20 }]}>
                    {`¿Estás seguro de que quieres eliminar "${incomeToDelete?.description}"? Esta acción no se puede deshacer.`}
                  </Text>
                  <View style={styles.deleteModalButtons}>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                      onPress={() => {
                        setShowDeleteModal(false);
                        setIncomeToDelete(null);
                      }}
                    >
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                      onPress={confirmDelete}
                    >
                      <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
