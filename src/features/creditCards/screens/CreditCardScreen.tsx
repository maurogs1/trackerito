import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrency } from '../../../shared/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type CreditCardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreditCard'>;
type CreditCardScreenRouteProp = RouteProp<RootStackParamList, 'CreditCard'>;

export default function CreditCardScreen() {
    const navigation = useNavigation<CreditCardScreenNavigationProp>();
    const route = useRoute<CreditCardScreenRouteProp>();
    const { cardId, cardName } = route.params;
    const { getMonthlyConsumption, loadCreditCardPurchases, creditCardPurchases, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [summary, setSummary] = useState(getMonthlyConsumption(cardId, currentDate.getMonth(), currentDate.getFullYear()));

    useEffect(() => {
        loadCreditCardPurchases();
        navigation.setOptions({ title: cardName });
    }, []);

    useEffect(() => {
        // Refresh summary when purchases change or date changes
        setSummary(getMonthlyConsumption(cardId, currentDate.getMonth(), currentDate.getFullYear()));
    }, [creditCardPurchases, currentDate]);

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1);
        setCurrentDate(newDate);
    };

    const handlePayCard = () => {
        // Navigate to AddExpense with pre-filled data
        navigation.navigate('AddExpense', {
            amount: summary.totalAmount,
            description: `Resumen ${cardName} - ${format(currentDate, 'MMMM yyyy', { locale: es })}`,
            isCreditCardPayment: true,
            creditCardId: cardId
        });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentTheme.background,
        },
        header: {
            padding: 20,
            backgroundColor: currentTheme.card,
            borderBottomWidth: 1,
            borderBottomColor: currentTheme.border,
        },
        monthSelector: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        monthText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentTheme.text,
            textTransform: 'capitalize',
        },
        totalLabel: {
            fontSize: 14,
            color: currentTheme.textSecondary,
            textAlign: 'center',
            marginBottom: 4,
        },
        totalAmount: {
            fontSize: 32,
            fontWeight: 'bold',
            color: currentTheme.text,
            textAlign: 'center',
        },
        payButton: {
            backgroundColor: currentTheme.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16,
        },
        payButtonText: {
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 16,
        },
        listContent: {
            padding: 20,
        },
        itemCard: {
            backgroundColor: currentTheme.card,
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        itemDescription: {
            fontSize: 16,
            fontWeight: '600',
            color: currentTheme.text,
            marginBottom: 4,
        },
        itemInstallment: {
            fontSize: 14,
            color: currentTheme.textSecondary,
        },
        itemAmount: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentTheme.text,
        },
        fab: {
            position: 'absolute',
            right: 20,
            bottom: 20,
            backgroundColor: currentTheme.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}>
                        <Ionicons name="chevron-back" size={24} color={currentTheme.text} />
                    </TouchableOpacity>
                    <Text style={styles.monthText}>
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </Text>
                    <TouchableOpacity onPress={() => changeMonth(1)}>
                        <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.totalLabel}>Total a Pagar</Text>
                <Text style={styles.totalAmount}>{formatCurrency(summary.totalAmount)}</Text>

                <TouchableOpacity style={styles.payButton} onPress={handlePayCard}>
                    <Text style={styles.payButtonText}>Pagar Resumen</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={summary.items}
                keyExtractor={(item) => item.purchaseId + item.installmentNumber}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.itemCard}>
                        <View>
                            <Text style={styles.itemDescription}>{item.description}</Text>
                            <Text style={styles.itemInstallment}>
                                Cuota {item.installmentNumber}/{item.totalInstallments}
                            </Text>
                        </View>
                        <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: currentTheme.textSecondary, marginTop: 20 }}>
                        No hay consumos para este mes.
                    </Text>
                }
            />

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('AddCreditCardPurchase', { cardId })}
            >
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}
