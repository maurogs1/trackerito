import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { formatCurrencyInput, parseCurrencyInput, formatCurrency } from '../../../shared/utils/currency';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

type CreateDebtScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateDebt'>;
type CreateDebtScreenRouteProp = RouteProp<RootStackParamList, 'CreateDebt'>;

export default function CreateDebtScreen() {
    const navigation = useNavigation<CreateDebtScreenNavigationProp>();
    const route = useRoute<CreateDebtScreenRouteProp>();
    const { addDebt, linkExpenseToDebt, expenses, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const expenseId = route.params?.expenseId;
    const expense = expenses.find(e => e.id === expenseId);

    const [name, setName] = useState(expense?.description || '');
    const [totalAmount, setTotalAmount] = useState(expense ? expense.amount.toString() : '');
    const [installments, setInstallments] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate installment amount automatically
    const numTotal = parseCurrencyInput(totalAmount);
    const numInstallments = parseInt(installments) || 1;
    const installmentAmount = numTotal > 0 && numInstallments > 0 ? numTotal / numInstallments : 0;

    const handleSave = async () => {
        if (!name || !totalAmount || !installments) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (expenseId && !expense) {
            Alert.alert('Error', 'Gasto no encontrado');
            return;
        }

        setIsSubmitting(true);
        try {
            const newDebt = await addDebt({
                name,
                totalAmount: numTotal,
                currentInstallment: 1, // Start at 1 usually? Or 0? Let's assume 1 if it's just created from a payment
                totalInstallments: numInstallments,
                installmentAmount: installmentAmount,
                startDate: startDate.toISOString(),
                status: 'active'
            });

            if (newDebt && expenseId && expense) {
                await linkExpenseToDebt({
                    expenseId,
                    debtId: newDebt.id,
                    amount: expense.amount // Assign the full expense amount to this debt
                });
            }

            Alert.alert('Éxito', 'Deuda creada correctamente', [
                { text: 'OK', onPress: () => navigation.pop(2) } // Go back to Dashboard/Expenses
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear la deuda');
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: currentTheme.background,
        },
        label: {
            fontSize: 16,
            color: currentTheme.textSecondary,
            marginBottom: 8,
            marginTop: 16,
        },
        input: {
            backgroundColor: currentTheme.card,
            color: currentTheme.text,
            padding: 16,
            borderRadius: 12,
            fontSize: 16,
            borderWidth: 1,
            borderColor: currentTheme.border,
        },
        summaryCard: {
            backgroundColor: currentTheme.surface,
            padding: 16,
            borderRadius: 12,
            marginTop: 24,
            borderWidth: 1,
            borderColor: currentTheme.border,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        summaryLabel: {
            color: currentTheme.textSecondary,
        },
        summaryValue: {
            color: currentTheme.text,
            fontWeight: '600',
        },
        saveButton: {
            backgroundColor: currentTheme.primary,
            padding: 18,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 40,
        },
        saveButtonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 'bold',
        },
    });

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Nombre de la Deuda</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Televisor 50''"
                placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={styles.label}>Monto Total</Text>
            <TextInput
                style={styles.input}
                value={totalAmount}
                onChangeText={(text) => setTotalAmount(formatCurrencyInput(text))}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={styles.label}>Cantidad de Cuotas</Text>
            <TextInput
                style={styles.input}
                value={installments}
                onChangeText={setInstallments}
                keyboardType="numeric"
                placeholder="Ej: 12"
                placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={styles.label}>Fecha de Inicio</Text>
            <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                <Text style={{ color: currentTheme.text, fontSize: 16 }}>
                    {format(startDate, 'dd/MM/yyyy', { locale: es })}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setStartDate(date);
                    }}
                />
            )}

            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Monto por Cuota:</Text>
                    <Text style={styles.summaryValue}>
                        {formatCurrency(installmentAmount)}
                    </Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total a Pagar:</Text>
                    <Text style={styles.summaryValue}>
                        {formatCurrency(numTotal)}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSubmitting}>
                <Text style={styles.saveButtonText}>Crear Deuda</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
