import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { useToast } from '../../../shared/hooks/useToast';
import { IncomeType, RecurringFrequency, INCOME_TYPE_LABELS, INCOME_TYPE_ICONS, INCOME_TYPE_COLORS, FREQUENCY_LABELS } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type AddIncomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddIncome'>;
type AddIncomeRouteProp = RouteProp<RootStackParamList, 'AddIncome'>;

export default function AddIncomeScreen() {
  const navigation = useNavigation<AddIncomeNavigationProp>();
  const route = useRoute<AddIncomeRouteProp>();
  const { incomes, addIncome, updateIncome, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const incomeId = route.params?.incomeId;
  const isEditing = !!incomeId;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<IncomeType>('salary');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState('1');
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [isDayFocused, setIsDayFocused] = useState(false);

  useEffect(() => {
    if (isEditing && incomeId) {
      const income = incomes.find(i => i.id === incomeId);
      if (income) {
        setAmount(formatCurrencyInput(income.amount.toString()));
        setDescription(income.description);
        setSelectedType(income.type);
        setDate(new Date(income.date));
        setIsRecurring(income.isRecurring);
        setRecurringDay(income.recurringDay?.toString() || '1');
        setRecurringFrequency(income.recurringFrequency || 'monthly');
        navigation.setOptions({ title: 'Editar Ingreso' });
      }
    }
  }, [incomeId, isEditing, incomes]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleWebDateChange = (event: any) => {
    const dateString = event.target.value;
    if (dateString) {
      const [year, month, day] = dateString.split('-').map(Number);
      setDate(new Date(year, month - 1, day));
    }
  };

  const handleSave = async () => {
    const numAmount = parseCurrencyInput(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Ingresa una descripción');
      return;
    }

    try {
      if (isEditing && incomeId) {
        await updateIncome(incomeId, {
          amount: numAmount,
          description: description.trim(),
          type: selectedType,
          date: format(date, 'yyyy-MM-dd'),
          isRecurring,
          recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
        showSuccess('Ingreso actualizado correctamente');
      } else {
        await addIncome({
          amount: numAmount,
          description: description.trim(),
          type: selectedType,
          date: format(date, 'yyyy-MM-dd'),
          isRecurring,
          recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
          recurringFrequency: isRecurring ? recurringFrequency : undefined,
        });
        showSuccess('Ingreso agregado correctamente');
      }
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || 'Error al guardar');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
    },
    label: {
      ...typography.body,
      color: currentTheme.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    inputContainer: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      height: 50,
      justifyContent: 'center',
    },
    inputFocused: {
      borderColor: currentTheme.primary,
    },
    inputField: {
      color: currentTheme.text,
      paddingHorizontal: spacing.lg,
      fontSize: 16,
      height: '100%',
      ...Platform.select({
        web: {
          outlineStyle: 'none',
        }
      }),
      textAlignVertical: 'center',
    } as any,
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    typeButton: {
      flex: 1,
      minWidth: '30%',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.card,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    typeButtonSelected: {
      borderWidth: 2,
    },
    frequencyButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.card,
    },
    frequencyButtonSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    saveButton: {
      backgroundColor: currentTheme.primary,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xxxl,
      marginBottom: spacing.xxxl,
    },
    recurringCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Monto</Text>
        <View style={[styles.inputContainer, isAmountFocused && styles.inputFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="0,00"
            placeholderTextColor={currentTheme.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => setAmount(formatCurrencyInput(text))}
            onFocus={() => setIsAmountFocused(true)}
            onBlur={() => setIsAmountFocused(false)}
            autoFocus={!isEditing}
          />
        </View>

        <Text style={styles.label}>Descripción</Text>
        <View style={[styles.inputContainer, isDescriptionFocused && styles.inputFocused]}>
          <TextInput
            style={styles.inputField}
            placeholder="¿De qué fue el ingreso?"
            placeholderTextColor={currentTheme.textSecondary}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setIsDescriptionFocused(true)}
            onBlur={() => setIsDescriptionFocused(false)}
          />
        </View>

        <Text style={styles.label}>Tipo de ingreso</Text>
        <View style={styles.typeGrid}>
          {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map((type) => {
            const isSelected = selectedType === type;
            const color = INCOME_TYPE_COLORS[type];
            const icon = INCOME_TYPE_ICONS[type];
            const label = INCOME_TYPE_LABELS[type];
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  isSelected && styles.typeButtonSelected,
                  isSelected && { backgroundColor: color + '20', borderColor: color }
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons name={icon as any} size={20} color={isSelected ? color : currentTheme.textSecondary} />
                <Text style={[typography.body, { color: isSelected ? color : currentTheme.text, fontSize: 13 }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Fecha</Text>
        <View style={styles.inputContainer}>
          {Platform.OS === 'web' ? (
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
              {React.createElement('input', {
                type: 'date',
                value: format(date, 'yyyy-MM-dd'),
                onChange: handleWebDateChange,
                style: {
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: currentTheme.text,
                  fontSize: '16px',
                  fontFamily: 'System',
                  width: '100%',
                  height: '100%',
                  outline: 'none'
                }
              })}
            </View>
          ) : (
            <TouchableOpacity
              style={[common.row, { paddingHorizontal: spacing.lg, height: '100%' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: spacing.md }} />
              <Text style={[typography.body, { color: currentTheme.text }]}>
                {format(date, 'dd/MM/yyyy', { locale: es })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {Platform.OS !== 'web' && showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        {/* Recurrente toggle */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            backgroundColor: currentTheme.card,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: isRecurring ? currentTheme.primary : currentTheme.border,
            marginTop: spacing.xl,
          }}
          onPress={() => setIsRecurring(!isRecurring)}
        >
          <View style={[common.row, { gap: spacing.md }]}>
            <View style={[common.iconContainer, {
              backgroundColor: isRecurring ? currentTheme.primary + '20' : currentTheme.surface,
            }]}>
              <Ionicons
                name="repeat-outline"
                size={24}
                color={isRecurring ? currentTheme.primary : currentTheme.textSecondary}
              />
            </View>
            <View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                Ingreso recurrente
              </Text>
              <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                Se repite automáticamente
              </Text>
            </View>
          </View>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isRecurring ? currentTheme.primary : currentTheme.border,
            backgroundColor: isRecurring ? currentTheme.primary : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {isRecurring && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        {/* Configuración recurrente */}
        {isRecurring && (
          <View style={styles.recurringCard}>
            <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
              Frecuencia
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyButton,
                    recurringFrequency === freq && styles.frequencyButtonSelected,
                  ]}
                  onPress={() => setRecurringFrequency(freq)}
                >
                  <Text style={[typography.body, {
                    color: recurringFrequency === freq ? '#FFFFFF' : currentTheme.text,
                    fontWeight: recurringFrequency === freq ? 'bold' : 'normal',
                  }]}>
                    {FREQUENCY_LABELS[freq]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg }]}>
              Día del mes
            </Text>
            <View style={[styles.inputContainer, isDayFocused && styles.inputFocused]}>
              <TextInput
                style={styles.inputField}
                placeholder="1"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
                value={recurringDay}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (text === '' || (!isNaN(num) && num >= 1 && num <= 31)) {
                    setRecurringDay(text);
                  }
                }}
                onFocus={() => setIsDayFocused(true)}
                onBlur={() => setIsDayFocused(false)}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={[typography.button, { color: '#FFFFFF' }]}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
