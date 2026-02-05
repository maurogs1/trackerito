import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay, parseCurrencyInput, formatCurrencyInput } from '../../../shared/utils/currency';
import { useNavigation } from '@react-navigation/native';
import { Category, FinancialType } from '../../expenses/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type WizardStep = 'intro' | 'income' | 'classification' | 'dashboard';
type FinancialEducationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FinancialEducation'>;

interface Percentages {
  needs: number;
  wants: number;
  savings: number;
}

const DEFAULT_PERCENTAGES: Percentages = { needs: 50, wants: 30, savings: 20 };

export default function FinancialEducationScreen() {
  const navigation = useNavigation<FinancialEducationScreenNavigationProp>();
  const { preferences, categories, expenses, updateCategory } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);

  const [step, setStep] = useState<WizardStep>('intro');
  const [income, setIncome] = useState('');
  const [percentages, setPercentages] = useState<Percentages>(DEFAULT_PERCENTAGES);
  const [isEditingPercentages, setIsEditingPercentages] = useState(false);

  useEffect(() => {
    loadEducationState();
  }, []);

  const loadEducationState = async () => {
    try {
      const savedStep = await AsyncStorage.getItem('@trackerito_edu_step');
      const savedIncome = await AsyncStorage.getItem('@trackerito_edu_income');
      const savedPercentages = await AsyncStorage.getItem('@trackerito_edu_percentages');

      if (savedIncome) setIncome(savedIncome);
      if (savedStep) setStep(savedStep as WizardStep);
      if (savedPercentages) setPercentages(JSON.parse(savedPercentages));
    } catch (e) {
      console.error('Failed to load education state');
    }
  };

  const saveEducationState = async (newStep: WizardStep, newIncome?: string, newPercentages?: Percentages) => {
    try {
      await AsyncStorage.setItem('@trackerito_edu_step', newStep);
      if (newIncome) await AsyncStorage.setItem('@trackerito_edu_income', newIncome);
      if (newPercentages) await AsyncStorage.setItem('@trackerito_edu_percentages', JSON.stringify(newPercentages));

      setStep(newStep);
      if (newPercentages) setPercentages(newPercentages);
    } catch (e) {
      console.error('Failed to save education state');
    }
  };

  const numericIncome = parseCurrencyInput(income);
  const idealNeeds = numericIncome * (percentages.needs / 100);
  const idealWants = numericIncome * (percentages.wants / 100);
  const idealSavings = numericIncome * (percentages.savings / 100);

  const actualSpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthExpenses = expenses.filter(e =>
      isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
    );

    const spending = { needs: 0, wants: 0, savings: 0, unclassified: 0 };

    currentMonthExpenses.forEach(expense => {
      let type = expense.financialType;

      if (!type || type === 'unclassified') {
        const category = categories.find(c => c.name === expense.category);
        type = category?.financialType;
      }

      if (type && type !== 'unclassified') {
        spending[type] += expense.amount;
      } else {
        spending.unclassified += expense.amount;
      }
    });

    return spending;
  }, [expenses, categories]);

  const handleStart = () => saveEducationState('income');

  const handleIncomeNext = () => {
    if (numericIncome > 0) {
      const total = percentages.needs + percentages.wants + percentages.savings;
      if (total !== 100) {
        Alert.alert('Error', `Los porcentajes deben sumar 100% (Suman ${total}%)`);
        return;
      }
      saveEducationState('classification', income, percentages);
    } else {
      Alert.alert('Error', 'Por favor ingresa un ingreso válido');
    }
  };

  const handleClassificationComplete = () => saveEducationState('dashboard');

  const toggleCategoryType = (category: Category) => {
    const types: FinancialType[] = ['needs', 'wants', 'savings'];
    const currentIndex = types.indexOf(category.financialType as FinancialType);
    const nextType = types[(currentIndex + 1) % types.length];
    updateCategory({ ...category, financialType: nextType });
  };

  const handleResetPercentages = () => setPercentages(DEFAULT_PERCENTAGES);

  const getTypeColor = (type?: FinancialType) => {
    switch (type) {
      case 'needs': return currentTheme.success;
      case 'wants': return currentTheme.warning;
      case 'savings': return currentTheme.info;
      default: return currentTheme.textSecondary;
    }
  };

  const getTypeName = (type?: FinancialType) => {
    switch (type) {
      case 'needs': return 'Necesidad';
      case 'wants': return 'Deseo';
      case 'savings': return 'Ahorro';
      default: return 'Sin Clasificar';
    }
  };

  const renderProgressBar = (current: number, total: number, color: string) => {
    const percentage = Math.min(100, (current / total) * 100);
    const displayPercentage = ((current / numericIncome) * 100).toFixed(0);
    const isSmall = percentage < 15;

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.barContainer, { flex: 1 }]}>
          <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]}>
            {!isSmall && <Text style={styles.barLabel}>{displayPercentage}%</Text>}
          </View>
        </View>
        {isSmall && <Text style={[typography.captionBold, { color: currentTheme.text, marginLeft: spacing.sm }]}>{displayPercentage}%</Text>}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.xl,
      paddingBottom: 40,
    },
    header: {
      marginBottom: spacing.xxl,
      alignItems: 'center',
    },
    card: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg + 4,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      ...shadows.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: currentTheme.primary,
      paddingBottom: spacing.sm,
      marginVertical: spacing.xxl,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    typeBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      minWidth: 100,
      alignItems: 'center',
    },
    comparisonRow: {
      marginBottom: spacing.xxl,
    },
    comparisonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    barContainer: {
      height: 24,
      backgroundColor: currentTheme.border,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    barFill: {
      height: '100%',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    barLabel: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    alertCard: {
      flexDirection: 'row',
      backgroundColor: currentTheme.card,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      alignItems: 'center',
      borderLeftWidth: 4,
    },
    percentageInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    percentageInput: {
      backgroundColor: currentTheme.background,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
      width: 60,
      textAlign: 'center',
      color: currentTheme.text,
      fontWeight: 'bold',
    },
    projectionCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginRight: spacing.md,
      width: 160,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
  });

  // Render Steps
  if (step === 'intro') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.header, { marginTop: 40 }]}>
          <Ionicons name="school-outline" size={80} color={currentTheme.primary} style={{ marginBottom: spacing.xl }} />
          <Text style={[typography.title, { color: currentTheme.text, textAlign: 'center', marginBottom: spacing.sm }]}>
            Salud Financiera
          </Text>
          <Text style={[typography.subtitle, { color: currentTheme.textSecondary, textAlign: 'center', lineHeight: 24 }]}>
            Descubre si estás siguiendo la regla 50/30/20 comparando tus gastos reales con lo ideal.
          </Text>
        </View>
        <TouchableOpacity style={common.buttonPrimary} onPress={handleStart}>
          <Text style={common.buttonPrimaryText}>Comenzar Análisis</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'income') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={[typography.title, { color: currentTheme.text, textAlign: 'center', marginBottom: spacing.sm }]}>
          Tu Ingreso Mensual
        </Text>
        <Text style={[typography.subtitle, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
          Para calcular tus porcentajes ideales, necesitamos saber tu ingreso neto mensual.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[typography.title, { color: currentTheme.text, marginRight: spacing.sm }]}>$</Text>
          <TextInput
            style={[typography.title, { flex: 1, color: currentTheme.text }]}
            placeholder="0"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="numeric"
            value={income}
            onChangeText={(text) => setIncome(formatCurrencyInput(text))}
            autoFocus
          />
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[common.rowBetween, { marginBottom: isEditingPercentages ? spacing.lg : 0 }]}
            onPress={() => setIsEditingPercentages(!isEditingPercentages)}
          >
            <Text style={[typography.label, { color: currentTheme.textSecondary }]}>Configurar Regla (50/30/20)</Text>
            <Ionicons name={isEditingPercentages ? "chevron-up" : "chevron-down"} size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          {isEditingPercentages && (
            <View>
              <View style={styles.percentageInputContainer}>
                <Text style={[typography.body, { color: currentTheme.text }]}>Necesidades (%)</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={percentages.needs.toString()}
                  onChangeText={(t) => setPercentages(p => ({ ...p, needs: Number(t) }))}
                />
              </View>
              <View style={styles.percentageInputContainer}>
                <Text style={[typography.body, { color: currentTheme.text }]}>Deseos (%)</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={percentages.wants.toString()}
                  onChangeText={(t) => setPercentages(p => ({ ...p, wants: Number(t) }))}
                />
              </View>
              <View style={styles.percentageInputContainer}>
                <Text style={[typography.body, { color: currentTheme.text }]}>Ahorros (%)</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={percentages.savings.toString()}
                  onChangeText={(t) => setPercentages(p => ({ ...p, savings: Number(t) }))}
                />
              </View>

              <TouchableOpacity style={{ alignSelf: 'center', padding: spacing.md }} onPress={handleResetPercentages}>
                <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Reestablecer a 50/30/20</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={common.buttonPrimary} onPress={handleIncomeNext}>
          <Text style={common.buttonPrimaryText}>Siguiente</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'classification') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={[typography.title, { color: currentTheme.text, textAlign: 'center', marginBottom: spacing.sm }]}>
          Clasifica tus Gastos
        </Text>
        <Text style={[typography.subtitle, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
          Toca cada categoría para cambiar su tipo: Necesidad, Deseo o Ahorro.
        </Text>

        <View style={{ marginTop: spacing.xl }}>
          {categories.map(category => (
            <TouchableOpacity key={category.id} style={styles.categoryItem} onPress={() => toggleCategoryType(category)}>
              <Ionicons name={category.icon as any} size={24} color={category.color} />
              <Text style={[typography.body, { color: currentTheme.text, flex: 1, marginLeft: spacing.md }]}>{category.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(category.financialType) }]}>
                <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>{getTypeName(category.financialType)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[common.buttonPrimary, { marginTop: spacing.xl }]} onPress={handleClassificationComplete}>
          <Text style={common.buttonPrimaryText}>Ver Resultados</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Dashboard View
  const savingsPotential = [
    { name: 'Celular Nuevo', cost: 800, icon: 'phone-portrait-outline' },
    { name: 'Laptop', cost: 1500, icon: 'laptop-outline' },
    { name: 'Viaje', cost: 3000, icon: 'airplane-outline' },
    { name: 'Auto Usado', cost: 8000, icon: 'car-sport-outline' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: currentTheme.text, textAlign: 'center' }]}>Tu Realidad vs Ideal</Text>
        <Text style={[typography.subtitle, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
          Basado en tus gastos de este mes
        </Text>
      </View>

      {/* Comparison Bars */}
      <View style={styles.card}>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Necesidades ({percentages.needs}%)</Text>
            <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
              ${formatCurrencyDisplay(actualSpending.needs)} / ${formatCurrencyDisplay(idealNeeds)}
            </Text>
          </View>
          {renderProgressBar(actualSpending.needs, idealNeeds, getTypeColor('needs'))}
        </View>

        <View style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Deseos ({percentages.wants}%)</Text>
            <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
              ${formatCurrencyDisplay(actualSpending.wants)} / ${formatCurrencyDisplay(idealWants)}
            </Text>
          </View>
          {renderProgressBar(actualSpending.wants, idealWants, getTypeColor('wants'))}
        </View>

        <View style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Ahorros ({percentages.savings}%)</Text>
            <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
              ${formatCurrencyDisplay(actualSpending.savings)} / ${formatCurrencyDisplay(idealSavings)}
            </Text>
          </View>
          {renderProgressBar(actualSpending.savings, idealSavings, getTypeColor('savings'))}
        </View>
      </View>

      {/* Savings Potential */}
      <View style={{ marginBottom: spacing.xxl }}>
        <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.md }]}>
          El Poder de tu Ahorro
        </Text>
        <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.lg }]}>
          Si ahorras ${formatCurrencyDisplay(idealSavings)} al mes, podrías comprar:
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {savingsPotential.map((item, index) => {
            const months = Math.ceil(item.cost / Math.max(1, idealSavings));
            return (
              <View key={index} style={styles.projectionCard}>
                <Ionicons name={item.icon as any} size={32} color={currentTheme.primary} style={{ marginBottom: spacing.md }} />
                <Text style={[typography.bodyBold, { color: currentTheme.text, textAlign: 'center', marginBottom: spacing.xs }]}>{item.name}</Text>
                <Text style={[typography.sectionTitle, { color: currentTheme.primary }]}>{months} Meses</Text>
                <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>de ahorro</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Insights */}
      <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>Análisis</Text>

      {actualSpending.needs > idealNeeds && (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.error }]}>
          <Ionicons name="warning" size={24} color={currentTheme.error} />
          <Text style={[typography.body, { color: currentTheme.text, flex: 1, marginLeft: spacing.md }]}>
            Tus necesidades superan el {percentages.needs}% recomendado. Considera revisar gastos fijos como alquiler o servicios.
          </Text>
        </View>
      )}

      {actualSpending.wants > idealWants && (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.warning }]}>
          <Ionicons name="alert-circle" size={24} color={currentTheme.warning} />
          <Text style={[typography.body, { color: currentTheme.text, flex: 1, marginLeft: spacing.md }]}>
            Estás gastando más de lo ideal en deseos. Intenta reducir salidas o compras impulsivas.
          </Text>
        </View>
      )}

      {actualSpending.savings >= idealSavings ? (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.success }]}>
          <Ionicons name="checkmark-circle" size={24} color={currentTheme.success} />
          <Text style={[typography.body, { color: currentTheme.text, flex: 1, marginLeft: spacing.md }]}>
            ¡Excelente! Estás cumpliendo con tu meta de ahorro del {percentages.savings}%.
          </Text>
        </View>
      ) : (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.primary }]}>
          <Ionicons name="information-circle" size={24} color={currentTheme.primary} />
          <Text style={[typography.body, { color: currentTheme.text, flex: 1, marginLeft: spacing.md }]}>
            Aún no llegas al {percentages.savings}% de ahorro. Intenta destinar un poco más a tus metas financieras.
          </Text>
        </View>
      )}

      <TouchableOpacity style={[common.buttonPrimary, { marginTop: spacing.xxl }]} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={common.buttonPrimaryText}>Ver mi Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
