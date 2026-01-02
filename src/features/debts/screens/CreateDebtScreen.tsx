import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
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
    const { addDebt, linkExpenseToDebt, expenses, preferences, banks, loadBanks, addBank } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const expenseId = route.params?.expenseId;
    const expense = expenses.find(e => e.id === expenseId);

    const [name, setName] = useState(expense?.description || '');
    const [installmentAmountStr, setInstallmentAmountStr] = useState('');
    const [installmentsStr, setInstallmentsStr] = useState('');
    const [currentInstallmentStr, setCurrentInstallmentStr] = useState('');
    const [totalAmountStr, setTotalAmountStr] = useState(expense ? formatCurrencyInput(expense.amount.toString()) : '');
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTotalManuallyEdited, setIsTotalManuallyEdited] = useState(false);
    
    // Bank creation modal state
    const [showAddBank, setShowAddBank] = useState(false);
    const [newBankName, setNewBankName] = useState('');

    useEffect(() => {
        loadBanks();
    }, []);

    // Auto-calculate Total Amount
    useEffect(() => {
        if (isTotalManuallyEdited) return;

        const instAmount = parseCurrencyInput(installmentAmountStr);
        const numInst = parseInt(installmentsStr);

        if (instAmount > 0 && numInst > 0) {
            const calculatedTotal = instAmount * numInst;
            setTotalAmountStr(formatCurrencyInput(calculatedTotal.toString()));
        }
    }, [installmentAmountStr, installmentsStr]);

    const handleSave = async () => {
        if (!name || !totalAmountStr || !installmentsStr || !installmentAmountStr || !currentInstallmentStr) {
            Alert.alert('Error', 'Por favor completa todos los campos requeridos');
            return;
        }

        setIsSubmitting(true);
        try {
            const totalAmount = parseCurrencyInput(totalAmountStr);
            const installmentAmount = parseCurrencyInput(installmentAmountStr);
            const totalInstallments = parseInt(installmentsStr);
            const currentInstallment = parseInt(currentInstallmentStr);

            const newDebt = await addDebt({
                name,
                totalAmount,
                currentInstallment,
                totalInstallments,
                installmentAmount,
                startDate: startDate.toISOString(),
                status: 'active',
                bankId: selectedBankId || undefined
            });

            if (newDebt && expenseId && expense) {
                await linkExpenseToDebt({
                    expenseId,
                    debtId: newDebt.id,
                    amount: expense.amount
                });
            }

            Alert.alert('Éxito', 'Deuda creada correctamente', [
                { text: 'OK', onPress: () => navigation.pop(2) }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear la deuda');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddBank = async () => {
        if (!newBankName.trim()) return;
        const bank = await addBank(newBankName);
        if (bank) {
            setSelectedBankId(bank.id);
            setShowAddBank(false);
            setNewBankName('');
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
        row: {
            flexDirection: 'row',
            gap: 12,
        },
        col: {
            flex: 1,
        },
        bankChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: currentTheme.border,
            marginRight: 8,
            backgroundColor: currentTheme.card,
        },
        bankChipSelected: {
            backgroundColor: currentTheme.primary,
            borderColor: currentTheme.primary,
        },
        bankChipText: {
            color: currentTheme.text,
        },
        bankChipTextSelected: {
            color: '#FFFFFF',
            fontWeight: 'bold',
        },
        addBankButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: currentTheme.primary,
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
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
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
        },
        modalContent: {
            backgroundColor: currentTheme.card,
            borderRadius: 16,
            padding: 20,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentTheme.text,
            marginBottom: 16,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 20,
            gap: 12,
        },
    });

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Nombre de la Deuda</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej: Televisor 50''"
                    placeholderTextColor={currentTheme.textSecondary}
                />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Valor Cuota</Text>
                        <TextInput
                            style={styles.input}
                            value={installmentAmountStr}
                            onChangeText={(t) => setInstallmentAmountStr(formatCurrencyInput(t))}
                            keyboardType="numeric"
                            placeholder="0,00"
                            placeholderTextColor={currentTheme.textSecondary}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Cant. Cuotas</Text>
                        <TextInput
                            style={styles.input}
                            value={installmentsStr}
                            onChangeText={setInstallmentsStr}
                            keyboardType="numeric"
                            placeholder="12"
                            placeholderTextColor={currentTheme.textSecondary}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Cuota Actual</Text>
                        <TextInput
                            style={styles.input}
                            value={currentInstallmentStr}
                            onChangeText={setCurrentInstallmentStr}
                            keyboardType="numeric"
                            placeholder="1"
                            placeholderTextColor={currentTheme.textSecondary}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Monto Total</Text>
                        <TextInput
                            style={styles.input}
                            value={totalAmountStr}
                            onChangeText={(t) => {
                                setTotalAmountStr(formatCurrencyInput(t));
                                setIsTotalManuallyEdited(true);
                            }}
                            keyboardType="numeric"
                            placeholder="0,00"
                            placeholderTextColor={currentTheme.textSecondary}
                        />
                    </View>
                </View>

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

                <Text style={styles.label}>Banco (Opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {banks.map(bank => (
                        <TouchableOpacity
                            key={bank.id}
                            style={[styles.bankChip, selectedBankId === bank.id && styles.bankChipSelected]}
                            onPress={() => setSelectedBankId(selectedBankId === bank.id ? null : bank.id)}
                        >
                            <Text style={[styles.bankChipText, selectedBankId === bank.id && styles.bankChipTextSelected]}>
                                {bank.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.addBankButton} onPress={() => setShowAddBank(true)}>
                        <Ionicons name="add" size={24} color={currentTheme.primary} />
                    </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSubmitting}>
                    <Text style={styles.saveButtonText}>Crear Deuda</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={showAddBank} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Agregar Banco</Text>
                        <TextInput
                            style={styles.input}
                            value={newBankName}
                            onChangeText={setNewBankName}
                            placeholder="Nombre del Banco"
                            placeholderTextColor={currentTheme.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowAddBank(false)}>
                                <Text style={{ color: currentTheme.textSecondary, fontSize: 16 }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddBank}>
                                <Text style={{ color: currentTheme.primary, fontSize: 16, fontWeight: 'bold' }}>Agregar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
