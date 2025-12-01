import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../../../shared/utils/currency';
import { Ionicons } from '@expo/vector-icons';

type DebtsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Debts'>;

export default function DebtsScreen() {
    const navigation = useNavigation<DebtsScreenNavigationProp>();
    const { debts, loadDebts, isLoadingDebts, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    useEffect(() => {
        loadDebts();
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentTheme.background,
            padding: 20,
        },
        card: {
            backgroundColor: currentTheme.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: currentTheme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: currentTheme.text,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
        },
        statusText: {
            fontSize: 12,
            color: '#4CAF50',
            fontWeight: '600',
        },
        progressContainer: {
            height: 8,
            backgroundColor: currentTheme.surface,
            borderRadius: 4,
            marginBottom: 8,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            backgroundColor: currentTheme.primary,
            borderRadius: 4,
        },
        detailsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
        },
        detailText: {
            fontSize: 14,
            color: currentTheme.textSecondary,
        },
        amountText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentTheme.text,
        },
        fab: {
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: currentTheme.primary,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        }
    });

    const renderItem = ({ item }: { item: any }) => {
        const progress = item.totalInstallments > 0 ? item.currentInstallment / item.totalInstallments : 0;

        return (
            <TouchableOpacity style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{item.name}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status === 'active' ? 'ACTIVA' : 'PAGADA'}</Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                </View>

                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>Cuota {item.currentInstallment}/{item.totalInstallments}</Text>
                    <Text style={styles.amountText}>{formatCurrency(item.installmentAmount)}/mes</Text>
                </View>

                <View style={[styles.detailsRow, { marginTop: 4 }]}>
                    <Text style={styles.detailText}>Restante: {formatCurrency(item.totalAmount - (item.installmentAmount * item.currentInstallment))}</Text>
                    <Text style={[styles.detailText, { fontSize: 12 }]}>Total: {formatCurrency(item.totalAmount)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={debts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl refreshing={isLoadingDebts} onRefresh={loadDebts} tintColor={currentTheme.primary} />
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Text style={{ color: currentTheme.textSecondary }}>No tienes deudas registradas</Text>
                    </View>
                }
            />

            {/* Optional FAB to add debt manually without expense */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateDebt', {})}
            >
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}
