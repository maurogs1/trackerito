import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, typography, spacing, borderRadius } from '../../../shared/theme';
import { createCommonStyles } from '../../../shared/theme/commonStyles';
import { formatCurrencyDisplay, formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';

interface MonthCloseModalProps {
  visible: boolean;
  isDark: boolean;
  remainingBalance: number;
  previousMonthName: string;
  onCarryOver: (amount: number) => void;
  onRegisterAsExpense: (expenseAmount: number, carryoverAmount: number) => void;
  onStartFresh: () => void;
}

type Step = 'options' | 'split';

export default function MonthCloseModal({
  visible,
  isDark,
  remainingBalance,
  previousMonthName,
  onCarryOver,
  onRegisterAsExpense,
  onStartFresh,
}: MonthCloseModalProps) {
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const isPositive = remainingBalance > 0;

  const [step, setStep] = useState<Step>('options');
  const [remainingInput, setRemainingInput] = useState('');

  const resetState = () => {
    setStep('options');
    setRemainingInput('');
  };

  // Cuanto realmente le queda al usuario
  const actualRemaining = parseCurrencyInput(remainingInput) || 0;
  // Lo que gastó sin anotar
  const unrecordedExpense = Math.max(0, remainingBalance - actualRemaining);

  const handleConfirmSplit = () => {
    onRegisterAsExpense(unrecordedExpense, actualRemaining);
    resetState();
  };

  const handleFullExpense = () => {
    onRegisterAsExpense(remainingBalance, 0);
    resetState();
  };

  const handleCarryOverAll = () => {
    onCarryOver(remainingBalance);
    resetState();
  };

  const handleStartFresh = () => {
    onStartFresh();
    resetState();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={common.modalOverlay}>
          <View style={[common.modalContent, { paddingBottom: spacing.xxxl }]}>
            {step === 'options' ? (
              <>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                  <View style={[styles.iconCircle, { backgroundColor: isPositive ? currentTheme.success + '20' : currentTheme.error + '20' }]}>
                    <Ionicons
                      name={isPositive ? 'wallet-outline' : 'alert-circle-outline'}
                      size={40}
                      color={isPositive ? currentTheme.success : currentTheme.error}
                    />
                  </View>
                  <Text style={[typography.title, { color: currentTheme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
                    Cierre de {previousMonthName}
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                    {isPositive
                      ? `Te sobraron $${formatCurrencyDisplay(remainingBalance)} del mes anterior`
                      : `Terminaste el mes con -$${formatCurrencyDisplay(Math.abs(remainingBalance))} de saldo`
                    }
                  </Text>
                </View>

                {/* Monto grande */}
                <View style={[styles.amountCard, { backgroundColor: currentTheme.surface }]}>
                  <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>Saldo restante</Text>
                  <Text style={[typography.amountLarge, {
                    color: isPositive ? currentTheme.success : currentTheme.error,
                    fontSize: 36,
                  }]}>
                    {isPositive ? '+' : '-'}${formatCurrencyDisplay(Math.abs(remainingBalance))}
                  </Text>
                </View>

                {/* Opciones */}
                {isPositive ? (
                  <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: currentTheme.primary }]}
                      onPress={handleCarryOverAll}
                    >
                      <Ionicons name="arrow-forward-circle-outline" size={24} color="#FFF" />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.bodyBold, { color: '#FFF' }]}>Arrastrar al nuevo mes</Text>
                        <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>
                          Se suma a tu ingreso de este mes
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }]}
                      onPress={() => setStep('split')}
                    >
                      <Ionicons name="receipt-outline" size={24} color={currentTheme.error} />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Gastos no registrados</Text>
                        <Text style={[typography.small, { color: currentTheme.textSecondary }]}>
                          Gasté parte o todo sin anotarlo
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }]}
                      onPress={handleStartFresh}
                    >
                      <Ionicons name="refresh-outline" size={24} color={currentTheme.textSecondary} />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Empezar de cero</Text>
                        <Text style={[typography.small, { color: currentTheme.textSecondary }]}>
                          Ignorar el sobrante y arrancar limpio
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: currentTheme.primary }]}
                      onPress={handleStartFresh}
                    >
                      <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.bodyBold, { color: '#FFF' }]}>Entendido, cerrar mes</Text>
                        <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>
                          Empezar el nuevo mes desde cero
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Step 2: Separar gastos no registrados */}
                <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                  <TouchableOpacity onPress={() => setStep('options')} style={{ alignSelf: 'flex-start', padding: spacing.sm }}>
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
                  </TouchableOpacity>
                  <Text style={[typography.title, { color: currentTheme.text, textAlign: 'center' }]}>
                    Ajustar saldo
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                    De los ${formatCurrencyDisplay(remainingBalance)} que sobraron, ¿cuánto te queda realmente?
                  </Text>
                </View>

                {/* Input de cuanto le queda */}
                <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
                  ¿Cuánto te queda en la cuenta?
                </Text>
                <TextInput
                  style={[common.input, { fontSize: 24, textAlign: 'center' }]}
                  placeholder="0"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="numeric"
                  value={remainingInput}
                  onChangeText={(text) => setRemainingInput(formatCurrencyInput(text))}
                  autoFocus
                />

                {/* Resumen visual */}
                {remainingInput.length > 0 && (
                  <View style={[styles.summaryCard, { backgroundColor: currentTheme.surface, marginTop: spacing.xl }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Sobrante del mes</Text>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>${formatCurrencyDisplay(remainingBalance)}</Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: currentTheme.border, paddingTop: spacing.sm }]}>
                      <Text style={[typography.body, { color: currentTheme.error }]}>Gastos no anotados</Text>
                      <Text style={[typography.bodyBold, { color: currentTheme.error }]}>-${formatCurrencyDisplay(unrecordedExpense)}</Text>
                    </View>
                    {actualRemaining > 0 && (
                      <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: currentTheme.border, paddingTop: spacing.sm }]}>
                        <Text style={[typography.body, { color: currentTheme.success }]}>Arrastra al nuevo mes</Text>
                        <Text style={[typography.bodyBold, { color: currentTheme.success }]}>+${formatCurrencyDisplay(actualRemaining)}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Botones */}
                <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
                  {remainingInput.length > 0 && unrecordedExpense > 0 && (
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: currentTheme.primary }]}
                      onPress={handleConfirmSplit}
                    >
                      <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={[typography.bodyBold, { color: '#FFF' }]}>Confirmar ajuste</Text>
                        <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>
                          Registra ${formatCurrencyDisplay(unrecordedExpense)} como gasto
                          {actualRemaining > 0 ? ` y arrastra $${formatCurrencyDisplay(actualRemaining)}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.optionButton, { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }]}
                    onPress={handleFullExpense}
                  >
                    <Ionicons name="trash-outline" size={24} color={currentTheme.error} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Todo fue gasto no anotado</Text>
                      <Text style={[typography.small, { color: currentTheme.textSecondary }]}>
                        Registrar ${formatCurrencyDisplay(remainingBalance)} como gasto
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  amountCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
