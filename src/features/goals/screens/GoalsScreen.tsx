import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types';
import { INVESTMENTS, Investment } from '../mockInvestments';
import { BANKS } from '../../benefits/mockBenefits';
import { formatCurrencyDisplay, formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';

type RiskProfile = 'low' | 'medium' | 'high';

export default function GoalsScreen() {
  const { goals, addGoal, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('low');
  const [inflationAmount, setInflationAmount] = useState('100000');
  const [onlyMyBanks, setOnlyMyBanks] = useState(false);
  const { userBanks } = useStore();

  const handleAddGoal = () => {
    if (newGoalName && newGoalAmount) {
      addGoal({
        name: newGoalName,
        targetAmount: parseFloat(newGoalAmount),
        currentAmount: 0,
        deadline: new Date().toISOString(),
        icon: 'trophy-outline',
        color: '#FFD700',
      });
      setModalVisible(false);
      setNewGoalName('');
      setNewGoalAmount('');
    }
  };

  const getRecommendations = () => {
    return INVESTMENTS.filter(inv => {
      // Risk Filter
      let matchesRisk = false;
      if (riskProfile === 'low') matchesRisk = inv.risk === 'low';
      else if (riskProfile === 'medium') matchesRisk = inv.risk === 'low' || inv.risk === 'medium';
      else matchesRisk = true;

      // Bank Filter
      let matchesBank = true;
      if (onlyMyBanks) {
        // Mock logic: assume investment name contains bank name for simplicity in this mock
        // In a real app, Investment would have a bankId field
        const myBankNames = userBanks.map(ub => {
          const bank = BANKS.find(b => b.id === ub.bankId);
          return bank ? bank.name : '';
        });
        
        // If it's a generic investment (like SPY or Bitcoin), we might show it anyway or filter it out.
        // For this feature, let's say we only filter "Plazo Fijo" or bank-specific products.
        if (inv.type === 'fixed_term' || inv.type === 'fci') {
           matchesBank = myBankNames.some(name => inv.name.includes(name));
        }
      }

      return matchesRisk && matchesBank;
    });
  };

  const calculateInflationImpact = () => {
    const amount = parseCurrencyInput(inflationAmount);
    const inflationRate = 1.5; // 150% annual inflation mock
    const lostValue = amount / inflationRate;
    const investedValue = amount * 2.1; // Mock investment return (110% + compound)
    
    return { amount, lostValue, investedValue };
  };

  const inflationData = calculateInflationImpact();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: 20,
      paddingBottom: 100,
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
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginTop: 24,
      marginBottom: 16,
    },
    // Goal Card
    goalCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    goalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    goalAmount: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: currentTheme.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBar: {
      height: '100%',
      backgroundColor: currentTheme.primary,
    },
    projectionText: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      fontStyle: 'italic',
    },
    // Investment Card
    investCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    investHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    investTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    investReturn: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.success,
    },
    investDesc: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 8,
    },
    investBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: currentTheme.surface,
    },
    investBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: currentTheme.text,
    },
    // Simulator
    simCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    simInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      marginBottom: 20,
      width: '100%',
    },
    simInput: {
      flex: 1,
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
      textAlign: 'center',
      padding: 8,
    },
    simRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 12,
    },
    simLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    simValueBad: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.error,
    },
    simValueGood: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.success,
    },
    // Risk Toggle
    riskContainer: {
      flexDirection: 'row',
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    riskButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
    },
    riskButtonSelected: {
      backgroundColor: currentTheme.primary,
    },
    riskText: {
      fontSize: 12,
      fontWeight: '600',
      color: currentTheme.textSecondary,
    },
    riskTextSelected: {
      color: '#FFFFFF',
    },
    // Filter Toggle
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      backgroundColor: currentTheme.card,
      padding: 12,
      borderRadius: 12,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
    },
    // FAB
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      backgroundColor: currentTheme.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    // Modal
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      padding: 20,
      borderRadius: 16,
      width: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: currentTheme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: currentTheme.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: currentTheme.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    button: {
      padding: 10,
    },
    buttonText: {
      color: currentTheme.primary,
      fontWeight: 'bold',
    },
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return currentTheme.textSecondary;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Centro de Inversiones</Text>
          <Text style={styles.subtitle}>Haz que tu dinero trabaje para ti.</Text>
        </View>

        {/* Goals Section */}
        <Text style={styles.sectionTitle}>Mis Metas</Text>
        {goals.length === 0 ? (
          <Text style={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>No tienes metas activas.</Text>
        ) : (
          goals.map((goal) => {
            const progress = Math.min(1, goal.currentAmount / goal.targetAmount);
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={goal.icon as any} size={24} color={currentTheme.primary} />
                    <Text style={styles.goalTitle}>{goal.name}</Text>
                  </View>
                  <Text style={styles.goalAmount}>
                    ${formatCurrencyDisplay(goal.currentAmount)} / ${formatCurrencyDisplay(goal.targetAmount)}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.projectionText}>
                  {progress < 1 ? 'Sigue ahorrando para llegar a tu meta.' : '¡Meta completada!'}
                </Text>
              </View>
            );
          })
        )}

        {/* Inflation Simulator */}
        <Text style={styles.sectionTitle}>Ahorro vs Inflación (1 Año)</Text>
        <View style={styles.simCard}>
          <View style={styles.simInputContainer}>
            <Text style={{ fontSize: 24, color: currentTheme.text, fontWeight: 'bold' }}>$</Text>
            <TextInput
              style={styles.simInput}
              value={inflationAmount}
              onChangeText={(text) => setInflationAmount(formatCurrencyInput(text))}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.simRow}>
            <Text style={styles.simLabel}>Bajo el colchón:</Text>
            <Text style={styles.simValueBad}>${formatCurrencyDisplay(inflationData.lostValue)}</Text>
          </View>
          <View style={styles.simRow}>
            <Text style={styles.simLabel}>Invertido (Plazo Fijo):</Text>
            <Text style={styles.simValueGood}>${formatCurrencyDisplay(inflationData.investedValue)}</Text>
          </View>
          <Text style={{ color: currentTheme.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
            *Valores estimados con inflación del 150% anual.
          </Text>
        </View>

        {/* Investment Recommendations */}
        <Text style={styles.sectionTitle}>Oportunidades para Ti</Text>
        
        <View style={styles.riskContainer}>
          {(['low', 'medium', 'high'] as RiskProfile[]).map((risk) => (
            <TouchableOpacity
              key={risk}
              style={[styles.riskButton, riskProfile === risk && styles.riskButtonSelected]}
              onPress={() => setRiskProfile(risk)}
            >
              <Text style={[styles.riskText, riskProfile === risk && styles.riskTextSelected]}>
                {risk === 'low' ? 'Conservador' : risk === 'medium' ? 'Moderado' : 'Arriesgado'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.filterContainer} 
          onPress={() => setOnlyMyBanks(!onlyMyBanks)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="card" size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
            <Text style={styles.filterLabel}>Mostrar solo mis bancos</Text>
          </View>
          <Ionicons 
            name={onlyMyBanks ? "checkbox" : "square-outline"} 
            size={24} 
            color={currentTheme.primary} 
          />
        </TouchableOpacity>

        {getRecommendations().length === 0 ? (
          <Text style={{ color: currentTheme.textSecondary, textAlign: 'center', marginTop: 20 }}>
            No hay recomendaciones para este perfil y tus bancos configurados.
          </Text>
        ) : (
          getRecommendations().map((inv) => (
            <TouchableOpacity key={inv.id} style={[styles.investCard, { borderLeftColor: getRiskColor(inv.risk) }]}>
              <View style={styles.investHeader}>
                <Text style={styles.investTitle}>{inv.name}</Text>
                <Text style={styles.investReturn}>{inv.returnRate}% TNA</Text>
              </View>
              <Text style={styles.investDesc}>{inv.description}</Text>
              <View style={styles.investBadge}>
                <Text style={styles.investBadgeText}>Mínimo: {inv.minTerm} días</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la Meta"
              placeholderTextColor={currentTheme.textSecondary}
              value={newGoalName}
              onChangeText={setNewGoalName}
            />
            <TextInput
              style={styles.input}
              placeholder="Monto Objetivo"
              placeholderTextColor={currentTheme.textSecondary}
              keyboardType="numeric"
              value={newGoalAmount}
              onChangeText={setNewGoalAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleAddGoal}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
