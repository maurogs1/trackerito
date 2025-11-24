import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay, parseCurrencyInput, formatCurrencyInput } from '../../../shared/utils/currency';
import { useNavigation } from '@react-navigation/native';
import { Category, FinancialType } from '../../expenses/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Percentages {
  needs: number;
  wants: number;
  savings: number;
}

export default function BudgetsScreen() {
  const navigation = useNavigation();
  const { preferences, categories, budgets, setCategoryBudget, expenses } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [income, setIncome] = useState(0);
  const [percentages, setPercentages] = useState<Percentages>({ needs: 50, wants: 30, savings: 20 });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState('');

  useEffect(() => {
    loadEducationState();
  }, []);

  const loadEducationState = async () => {
    try {
      const savedIncome = await AsyncStorage.getItem('@trackerito_edu_income');
      const savedPercentages = await AsyncStorage.getItem('@trackerito_edu_percentages');
      
      if (savedIncome) setIncome(parseCurrencyInput(savedIncome));
      if (savedPercentages) setPercentages(JSON.parse(savedPercentages));
    } catch (e) {
      console.error('Failed to load education state');
    }
  };

  const getBudgetForCategory = (categoryId: string) => {
    return budgets.find(b => b.categoryId === categoryId)?.limitAmount || 0;
  };

  const getSpentForCategory = (categoryName: string) => {
    const now = new Date();
    return expenses
      .filter(e => e.category === categoryName && new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear())
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const handleSaveLimit = (categoryId: string) => {
    const limit = parseCurrencyInput(tempLimit);
    setCategoryBudget(categoryId, limit);
    setEditingCategory(null);
    setTempLimit('');
  };

  const renderSection = (type: FinancialType, title: string, percentage: number) => {
    const typeCategories = categories.filter(c => c.financialType === type);
    const totalAvailable = income * (percentage / 100);
    const totalBudgeted = typeCategories.reduce((sum, c) => sum + getBudgetForCategory(c.id), 0);
    const remaining = totalAvailable - totalBudgeted;
    const isOverBudget = remaining < 0;

    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { borderLeftColor: getTypeColor(type) }]}>
          <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionSubtitle}>
              Disponible: ${formatCurrencyDisplay(totalAvailable)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={[styles.remainingText, isOverBudget ? { color: currentTheme.error } : { color: currentTheme.success }]}>
              {isOverBudget ? 'Te pasaste por:' : 'Te queda:'}
            </Text>
            <Text style={[styles.remainingAmount, isOverBudget ? { color: currentTheme.error } : { color: currentTheme.success }]}>
              ${formatCurrencyDisplay(Math.abs(remaining))}
            </Text>
          </View>
        </View>

        {typeCategories.length === 0 ? (
          <Text style={styles.emptyText}>No tienes categorías clasificadas como {title.toLowerCase()}.</Text>
        ) : (
          typeCategories.map(category => {
            const budget = getBudgetForCategory(category.id);
            const spent = getSpentForCategory(category.name);
            const isEditing = editingCategory === category.id;
            const progress = budget > 0 ? Math.min(1, spent / budget) : 0;

            return (
              <View key={category.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={16} color="#FFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: category.color }]} />
                    </View>
                    <Text style={styles.spentText}>
                      ${formatCurrencyDisplay(spent)} gastado
                    </Text>
                  </View>
                </View>

                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.limitInput}
                      value={tempLimit}
                      onChangeText={(text) => setTempLimit(formatCurrencyInput(text))}
                      placeholder="0"
                      placeholderTextColor={currentTheme.textSecondary}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => handleSaveLimit(category.id)}>
                      <Ionicons name="checkmark-circle" size={28} color={currentTheme.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.budgetDisplay} 
                    onPress={() => {
                      setEditingCategory(category.id);
                      setTempLimit(budget > 0 ? budget.toString() : '');
                    }}
                  >
                    <Text style={styles.budgetText}>
                      {budget > 0 ? `$${formatCurrencyDisplay(budget)}` : 'Sin límite'}
                    </Text>
                    <Ionicons name="pencil" size={14} color={currentTheme.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>
    );
  };

  const getTypeColor = (type: FinancialType) => {
    switch (type) {
      case 'needs': return '#4CAF50';
      case 'wants': return '#FF9800';
      case 'savings': return '#2196F3';
      default: return currentTheme.textSecondary;
    }
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
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    section: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      borderLeftWidth: 4,
      paddingLeft: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    remainingText: {
      fontSize: 12,
      fontWeight: '600',
    },
    remainingAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyText: {
      color: currentTheme.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginVertical: 10,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 4,
    },
    progressBarBg: {
      height: 4,
      backgroundColor: currentTheme.border,
      borderRadius: 2,
      width: '100%',
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    spentText: {
      fontSize: 10,
      color: currentTheme.textSecondary,
    },
    budgetDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    budgetText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    editContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    limitInput: {
      backgroundColor: currentTheme.background,
      borderWidth: 1,
      borderColor: currentTheme.primary,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      width: 80,
      color: currentTheme.text,
      marginRight: 8,
      textAlign: 'right',
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Presupuestos</Text>
        <Text style={styles.subtitle}>
          Distribuye tu ingreso según tus pilares financieros.
        </Text>
      </View>

      {renderSection('needs', 'Necesidades', percentages.needs)}
      {renderSection('wants', 'Deseos', percentages.wants)}
      {renderSection('savings', 'Ahorro', percentages.savings)}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
