import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type AddCreditCardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddCreditCard'>;
type AddCreditCardScreenRouteProp = RouteProp<RootStackParamList, 'AddCreditCard'>;

export default function AddCreditCardScreen() {
    const navigation = useNavigation<AddCreditCardScreenNavigationProp>();
    const route = useRoute<AddCreditCardScreenRouteProp>();
    const { bankId } = route.params;
    const { addCreditCard, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;

    const [name, setName] = useState('');
    const [color, setColor] = useState('#1E88E5'); // Default Blue

    const colors = ['#1E88E5', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#546E7A', '#000000'];

    const handleSave = async () => {
        if (!name) {
            Alert.alert('Error', 'Por favor ingresa el nombre de la tarjeta');
            return;
        }

        const newCard = await addCreditCard({
            bank_id: bankId,
            name,
            color
        });

        if (newCard) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'No se pudo crear la tarjeta');
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentTheme.background,
            padding: 20,
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
        colorContainer: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
        },
        colorCircle: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: 'transparent',
        },
        selectedColor: {
            borderColor: currentTheme.text,
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
            <Text style={styles.label}>Nombre de la Tarjeta</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Visa Gold"
                placeholderTextColor={currentTheme.textSecondary}
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorContainer}>
                {colors.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[
                            styles.colorCircle,
                            { backgroundColor: c },
                            color === c && styles.selectedColor
                        ]}
                        onPress={() => setColor(c)}
                    />
                ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Guardar Tarjeta</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
