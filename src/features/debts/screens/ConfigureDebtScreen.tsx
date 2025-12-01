import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../../shared/utils/currency';
import { Debt } from '../../expenses/types';

type ConfigureDebtScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ConfigureDebt'>;
type ConfigureDebtScreenRouteProp = RouteProp<RootStackParamList, 'ConfigureDebt'>;

export default function ConfigureDebtScreen() {
    const navigation = useNavigation<ConfigureDebtScreenNavigationProp>();
    const route = useRoute<ConfigureDebtScreenRouteProp>();
    const { debts, loadDebts, linkExpenseToDebt, expenses, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const expenseId = route.params?.expenseId;
    const expense = expenses.find(e => e.id === expenseId);

    const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
    const [amountToAssign, setAmountToAssign] = useState<number>(expense?.amount || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadDebts();
    }, []);

    const handleLinkDebt = async () => {
        if (!selectedDebtId || !expenseId) return;

        setIsSubmitting(true);
        try {
            await linkExpenseToDebt({
                expenseId,
                debtId: selectedDebtId,
                amount: amountToAssign
            });

            Alert.alert('Éxito', 'Gasto asociado a la deuda correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo asociar el gasto');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateNewDebt = () => {
        navigation.navigate('CreateDebt', { expenseId });
    };

    if (!expense) {
        return (
            <View style={[styles.container, { backgroundColor: currentTheme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: currentTheme.text }}>Gasto no encontrado</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: currentTheme.text }]}>Configurar Deuda</Text>
                <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>Asocia este gasto a una deuda existente o crea una nueva.</Text>
            </View>

            <View style={[styles.expenseInfo, { backgroundColor: currentTheme.card }]}>
                <Text style={{ color: currentTheme.textSecondary }}>Gasto a asociar</Text>
                <Text style={[styles.amount, { color: currentTheme.primary }]}>{formatCurrency(expense.amount)}</Text>
                <Text style={{ color: currentTheme.text, marginTop: 4 }}>{expense.description}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Seleccionar Deuda</Text>

            <ScrollView style={{ flex: 1 }}>
                {debts.filter(d => d.status === 'active').map((debt) => (
                    <TouchableOpacity
                        key={debt.id}
                        style={[
                            styles.debtCard,
                            { backgroundColor: currentTheme.card, borderColor: currentTheme.border },
                            selectedDebtId === debt.id && styles.debtCardSelected,
                            selectedDebtId === debt.id && { borderColor: currentTheme.primary, backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)' }
                        ]}
                        onPress={() => setSelectedDebtId(debt.id)}
                    >
                        <View>
                            <Text style={[styles.debtName, { color: currentTheme.text }]}>{debt.name}</Text>
                            <Text style={[styles.debtInfo, { color: currentTheme.textSecondary }]}>
                                Cuota {debt.currentInstallment + 1}/{debt.totalInstallments} • {formatCurrency(debt.installmentAmount)}
                            </Text>
                        </View>
                        {selectedDebtId === debt.id && (
                            <Ionicons name="checkmark-circle" size={24} color={currentTheme.primary} />
                        )}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={[styles.createButton, { borderColor: currentTheme.primary }]} onPress={handleCreateNewDebt}>
                    <Ionicons name="add-circle-outline" size={24} color={currentTheme.primary} />
                    <Text style={[styles.createButtonText, { color: currentTheme.primary }]}>Crear Nueva Deuda</Text>
                </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: currentTheme.primary }, !selectedDebtId && styles.confirmButtonDisabled]}
                onPress={handleLinkDebt}
                disabled={!selectedDebtId || isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.confirmButtonText}>Asociar a Deuda</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 12,
    },
    debtCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    debtCardSelected: {
        borderWidth: 2,
    },
    debtName: {
        fontSize: 16,
        fontWeight: '600',
    },
    debtInfo: {
        fontSize: 14,
        marginTop: 4,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 12,
    },
    createButtonText: {
        fontWeight: '600',
        marginLeft: 8,
    },
    confirmButton: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    expenseInfo: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    amount: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    }
});
