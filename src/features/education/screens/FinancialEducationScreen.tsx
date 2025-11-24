import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
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

  const [step, setStep] = useState<WizardStep>('intro');
  const [income, setIncome] = useState('');
  const [percentages, setPercentages] = useState<Percentages>(DEFAULT_PERCENTAGES);
  const [isEditingPercentages, setIsEditingPercentages] = useState(false);
  
  // Load saved state on mount
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

  // Calculate actual spending based on category types
  const actualSpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthExpenses = expenses.filter(e => 
      isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
    );

    const spending = {
      needs: 0,
      wants: 0,
      savings: 0,
      unclassified: 0
    };

    currentMonthExpenses.forEach(expense => {
      // Use the expense's specific financial type if available, otherwise fallback to category type
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

  const handleResetPercentages = () => {
    setPercentages(DEFAULT_PERCENTAGES);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    card: {
      backgroundColor: currentTheme.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    button: {
      backgroundColor: currentTheme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: currentTheme.primary,
      paddingBottom: 8,
      marginVertical: 24,
    },
    currencySymbol: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    categoryName: {
      fontSize: 16,
      color: currentTheme.text,
      flex: 1,
      marginLeft: 12,
    },
    typeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      minWidth: 100,
      alignItems: 'center',
    },
    typeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    comparisonRow: {
      marginBottom: 24,
    },
    comparisonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    comparisonTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    comparisonValues: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    barContainer: {
      height: 24,
      backgroundColor: currentTheme.border,
      borderRadius: 12,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    barFill: {
      height: '100%',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    barLabel: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    barLabelOutside: {
      fontSize: 12,
      color: currentTheme.text,
      fontWeight: 'bold',
      marginLeft: 8,
      alignSelf: 'center',
    },
    alertCard: {
      flexDirection: 'row',
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      alignItems: 'center',
      borderLeftWidth: 4,
    },
    alertText: {
      flex: 1,
      marginLeft: 12,
      color: currentTheme.text,
      fontSize: 14,
    },
    percentageInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    percentageLabel: {
      fontSize: 16,
      color: currentTheme.text,
      flex: 1,
    },
    percentageInput: {
      backgroundColor: currentTheme.background,
      borderRadius: 8,
      padding: 8,
      width: 60,
      textAlign: 'center',
      color: currentTheme.text,
      fontWeight: 'bold',
    },
    resetButton: {
      alignSelf: 'center',
      padding: 10,
    },
    resetButtonText: {
      color: currentTheme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    projectionScroll: {
      marginTop: 16,
    },
    projectionCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      marginRight: 12,
      width: 160,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    projectionIcon: {
      marginBottom: 12,
    },
    projectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    projectionMonths: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.primary,
      marginBottom: 4,
    },
    projectionLabel: {
      fontSize: 12,
      color: currentTheme.textSecondary,
    },
  });

  const getTypeColor = (type?: FinancialType) => {
    switch (type) {
      case 'needs': return '#4CAF50'; // Green
      case 'wants': return '#FF9800'; // Orange
      case 'savings': return '#2196F3'; // Blue
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
        {isSmall && <Text style={styles.barLabelOutside}>{displayPercentage}%</Text>}
      </View>
    );
  };

  // Render Steps
  if (step === 'intro') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.header, { marginTop: 40 }]}>
          <Ionicons name="school-outline" size={80} color={currentTheme.primary} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Salud Financiera</Text>
          <Text style={styles.subtitle}>
            Descubre si estás siguiendo la regla 50/30/20 comparando tus gastos reales con lo ideal.
          </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Comenzar Análisis</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'income') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tu Ingreso Mensual</Text>
        <Text style={styles.subtitle}>Para calcular tus porcentajes ideales, necesitamos saber tu ingreso neto mensual.</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.input}
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
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditingPercentages ? 16 : 0 }}
            onPress={() => setIsEditingPercentages(!isEditingPercentages)}
          >
            <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Configurar Regla (50/30/20)</Text>
            <Ionicons name={isEditingPercentages ? "chevron-up" : "chevron-down"} size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>

          {isEditingPercentages && (
            <View>
              <View style={styles.percentageInputContainer}>
                <Text style={styles.percentageLabel}>Necesidades (%)</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={percentages.needs.toString()}
                  onChangeText={(t) => setPercentages(p => ({ ...p, needs: Number(t) }))}
                />
              </View>
              <View style={styles.percentageInputContainer}>
                <Text style={styles.percentageLabel}>Deseos (%)</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={percentages.wants.toString()}
                  onChangeText={(t) => setPercentages(p => ({ ...p, wants: Number(t) }))}
                />
              </View>
              <View style={styles.percentageInputContainer}>
                <Text style={styles.percentageLabel}>Ahorros (%)</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={percentages.savings.toString()}
                  onChangeText={(t) => setPercentages(p => ({ ...p, savings: Number(t) }))}
                />
              </View>

              <TouchableOpacity style={styles.resetButton} onPress={handleResetPercentages}>
                <Text style={styles.resetButtonText}>Reestablecer a 50/30/20</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleIncomeNext}>
          <Text style={styles.buttonText}>Siguiente</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'classification') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Clasifica tus Gastos</Text>
        <Text style={styles.subtitle}>Toca cada categoría para cambiar su tipo: Necesidad, Deseo o Ahorro.</Text>
        
        <View style={{ marginTop: 20 }}>
          {categories.map(category => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryItem}
              onPress={() => toggleCategoryType(category)}
            >
              <Ionicons name={category.icon as any} size={24} color={category.color} />
              <Text style={styles.categoryName}>{category.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(category.financialType) }]}>
                <Text style={styles.typeText}>{getTypeName(category.financialType)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleClassificationComplete}>
          <Text style={styles.buttonText}>Ver Resultados</Text>
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
        <Text style={styles.title}>Tu Realidad vs Ideal</Text>
        <Text style={styles.subtitle}>Basado en tus gastos de este mes</Text>
      </View>

      {/* Comparison Bars */}
      <View style={styles.card}>
        {/* Needs */}
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>Necesidades ({percentages.needs}%)</Text>
            <Text style={styles.comparisonValues}>
              ${formatCurrencyDisplay(actualSpending.needs)} / ${formatCurrencyDisplay(idealNeeds)}
            </Text>
          </View>
          {renderProgressBar(actualSpending.needs, idealNeeds, getTypeColor('needs'))}
        </View>

        {/* Wants */}
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>Deseos ({percentages.wants}%)</Text>
            <Text style={styles.comparisonValues}>
              ${formatCurrencyDisplay(actualSpending.wants)} / ${formatCurrencyDisplay(idealWants)}
            </Text>
          </View>
          {renderProgressBar(actualSpending.wants, idealWants, getTypeColor('wants'))}
        </View>

        {/* Savings */}
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>Ahorros ({percentages.savings}%)</Text>
            <Text style={styles.comparisonValues}>
              ${formatCurrencyDisplay(actualSpending.savings)} / ${formatCurrencyDisplay(idealSavings)}
            </Text>
          </View>
          {renderProgressBar(actualSpending.savings, idealSavings, getTypeColor('savings'))}
        </View>
      </View>

      {/* Savings Potential Section */}
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.title, { fontSize: 20, alignSelf: 'flex-start', marginBottom: 12 }]}>
          El Poder de tu Ahorro
        </Text>
        <Text style={[styles.subtitle, { textAlign: 'left', marginBottom: 16 }]}>
          Si ahorras ${formatCurrencyDisplay(idealSavings)} al mes, podrías comprar:
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectionScroll}>
          {savingsPotential.map((item, index) => {
            const months = Math.ceil(item.cost / Math.max(1, idealSavings));
            return (
              <View key={index} style={styles.projectionCard}>
                <Ionicons name={item.icon as any} size={32} color={currentTheme.primary} style={styles.projectionIcon} />
                <Text style={styles.projectionTitle}>{item.name}</Text>
                <Text style={styles.projectionMonths}>{months} Meses</Text>
                <Text style={styles.projectionLabel}>de ahorro</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Insights / Alerts */}
      <Text style={[styles.title, { fontSize: 20, alignSelf: 'flex-start', marginBottom: 16 }]}>Análisis</Text>
      
      {actualSpending.needs > idealNeeds && (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.error }]}>
          <Ionicons name="warning" size={24} color={currentTheme.error} />
          <Text style={styles.alertText}>
            Tus necesidades superan el {percentages.needs}% recomendado. Considera revisar gastos fijos como alquiler o servicios.
          </Text>
        </View>
      )}

      {actualSpending.wants > idealWants && (
        <View style={[styles.alertCard, { borderLeftColor: '#FF9800' }]}>
          <Ionicons name="alert-circle" size={24} color="#FF9800" />
          <Text style={styles.alertText}>
            Estás gastando más de lo ideal en deseos. Intenta reducir salidas o compras impulsivas.
          </Text>
        </View>
      )}

      {actualSpending.savings >= idealSavings ? (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.success }]}>
          <Ionicons name="checkmark-circle" size={24} color={currentTheme.success} />
          <Text style={styles.alertText}>
            ¡Excelente! Estás cumpliendo con tu meta de ahorro del {percentages.savings}%.
          </Text>
        </View>
      ) : (
        <View style={[styles.alertCard, { borderLeftColor: currentTheme.primary }]}>
          <Ionicons name="information-circle" size={24} color={currentTheme.primary} />
          <Text style={styles.alertText}>
            Aún no llegas al {percentages.savings}% de ahorro. Intenta destinar un poco más a tus metas financieras.
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, { marginTop: 24 }]} 
        onPress={() => navigation.navigate('Budgets')}
      >
        <Text style={styles.buttonText}>Aplicar Presupuestos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
