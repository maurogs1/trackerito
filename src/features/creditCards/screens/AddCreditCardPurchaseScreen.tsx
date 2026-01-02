import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

type AddCreditCardPurchaseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddCreditCardPurchase'>;
type AddCreditCardPurchaseScreenRouteProp = RouteProp<RootStackParamList, 'AddCreditCardPurchase'>;

export default function AddCreditCardPurchaseScreen() {
    const navigation = useNavigation<AddCreditCardPurchaseScreenNavigationProp>();
    const route = useRoute<AddCreditCardPurchaseScreenRouteProp>();
    const { cardId } = route.params;
    const { addCreditCardPurchase, categories, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const [description, setDescription] = useState('');
    const [amountStr, setAmountStr] = useState('');
    const [installmentsStr, setInstallmentsStr] = useState('1');
    const [currentInstallmentStr, setCurrentInstallmentStr] = useState('1');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [isExistingPurchase, setIsExistingPurchase] = useState(false);

    const handleSave = async () => {
        if (!description || !amountStr || !installmentsStr) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const amount = parseCurrencyInput(amountStr);
        const installments = parseInt(installmentsStr);
        const currentInstallment = parseInt(currentInstallmentStr);

        if (amount <= 0) {
            Alert.alert('Error', 'El monto debe ser mayor a 0');
            return;
        }
        if (installments < 1) {
            Alert.alert('Error', 'Las cuotas deben ser al menos 1');
            return;
        }
        if (isExistingPurchase && (currentInstallment < 1 || currentInstallment > installments)) {
            Alert.alert('Error', `La cuota actual debe estar entre 1 y ${installments}`);
            return;
        }

        // Calculate first installment date based on current installment
        let firstDate = new Date(date);
        if (isExistingPurchase && currentInstallment > 1) {
            // If I'm paying installment 9 now, installment 1 was 8 months ago
            firstDate.setMonth(firstDate.getMonth() - (currentInstallment - 1));
        }

        const purchase = await addCreditCardPurchase({
            credit_card_id: cardId,
            description,
            total_amount: amount,
            installments,
            first_installment_date: firstDate.toISOString(),
            category_id: selectedCategoryId || undefined
        });

        if (purchase) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo registrar el consumo');
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
        categoryChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: currentTheme.border,
            marginRight: 8,
            backgroundColor: currentTheme.card,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        categoryChipSelected: {
            backgroundColor: currentTheme.primary,
            borderColor: currentTheme.primary,
        },
        categoryChipText: {
            color: currentTheme.text,
        },
        categoryChipTextSelected: {
            color: '#FFFFFF',
            fontWeight: 'bold',
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
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Ej: Supermercado"
                    placeholderTextColor={currentTheme.textSecondary}
                />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Monto Total</Text>
                        <TextInput
                            style={styles.input}
                            value={amountStr}
                            onChangeText={(t) => setAmountStr(formatCurrencyInput(t))}
                            keyboardType="numeric"
                            placeholder="0,00"
                            placeholderTextColor={currentTheme.textSecondary}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Cuotas</Text>
                        <TextInput
                            style={styles.input}
                            value={installmentsStr}
                            onChangeText={setInstallmentsStr}
                            keyboardType="numeric"
                            placeholder="1"
                            placeholderTextColor={currentTheme.textSecondary}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Fecha Primera Cuota</Text>
                <TouchableOpacity
                    style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color={currentTheme.textSecondary} style={{ marginRight: 10 }} />
                    <Text style={{ color: currentTheme.text, fontSize: 16 }}>
                        {format(date, 'dd/MM/yyyy', { locale: es })}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}

                <Text style={styles.label}>Categoría (Opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipSelected]}
                            onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                        >
                            <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                            <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextSelected]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Registrar Consumo</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
