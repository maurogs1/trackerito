import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CreditCard } from '../../../types/creditCards';

type BankDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BankDetail'>;
type BankDetailScreenRouteProp = RouteProp<RootStackParamList, 'BankDetail'>;

export default function BankDetailScreen() {
    const navigation = useNavigation<BankDetailScreenNavigationProp>();
    const route = useRoute<BankDetailScreenRouteProp>();
    const { bankId, bankName } = route.params;
    const { creditCards, loadCreditCards, deleteCreditCard, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const bankCards = creditCards.filter(c => c.bank_id === bankId);

    useEffect(() => {
        loadCreditCards();
        navigation.setOptions({ title: bankName });
    }, []);

    const handleDeleteCard = (id: string, name: string) => {
        Alert.alert(
            'Eliminar Tarjeta',
            `¿Estás seguro de que quieres eliminar ${name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => deleteCreditCard(id) }
            ]
        );
    };

    const getCardColor = (color?: string) => {
        return color || currentTheme.primary;
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentTheme.background,
            padding: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentTheme.text,
            marginBottom: 16,
            marginTop: 10,
        },
        card: {
            height: 180,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
        },
        cardTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        cardName: {
            fontSize: 22,
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: 4,
        },
        bankLabel: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase',
        },
        cardNumber: {
            fontSize: 18,
            color: '#FFFFFF',
            letterSpacing: 2,
            marginTop: 20,
        },
        cardBottom: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
        },
        cardDateLabel: {
            fontSize: 10,
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
        },
        cardDateValue: {
            fontSize: 14,
            color: '#FFFFFF',
            fontWeight: '600',
        },
        addButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: currentTheme.card,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: currentTheme.border,
            borderStyle: 'dashed',
            marginTop: 10,
        },
        addButtonText: {
            color: currentTheme.textSecondary,
            fontSize: 16,
            marginLeft: 8,
        },
    });

    const renderCard = ({ item }: { item: CreditCard }) => (
        <TouchableOpacity 
            onPress={() => navigation.navigate('CreditCard', { cardId: item.id, cardName: item.name })}
            onLongPress={() => handleDeleteCard(item.id, item.name)}
        >
            <View style={[styles.card, { backgroundColor: getCardColor(item.color) }]}>
                <View style={styles.cardTop}>
                    <View>
                        <Text style={styles.bankLabel}>{bankName}</Text>
                        <Text style={styles.cardName}>{item.name}</Text>
                    </View>
                    <Ionicons name="card-outline" size={32} color="rgba(255,255,255,0.8)" />
                </View>
                
                <Text style={styles.cardNumber}>
                    •••• •••• •••• {item.last_four_digits || '0000'}
                </Text>
                
                <View style={styles.cardBottom}>
                    <View>
                        <Text style={styles.cardDateLabel}>Cierre</Text>
                        <Text style={styles.cardDateValue}>Día {item.closing_day}</Text>
                    </View>
                    <View>
                        <Text style={styles.cardDateLabel}>Vencimiento</Text>
                        <Text style={styles.cardDateValue}>Día {item.due_day}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Tarjetas Asociadas</Text>
            
            <FlatList
                data={bankCards}
                keyExtractor={(item) => item.id}
                renderItem={renderCard}
                ListFooterComponent={
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddCreditCard', { bankId })}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={currentTheme.textSecondary} />
                        <Text style={styles.addButtonText}>Agregar Tarjeta</Text>
                    </TouchableOpacity>
                }
            />
        </View>
    );
}
