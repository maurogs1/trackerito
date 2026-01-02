import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useToast } from '../../../shared/hooks/useToast';

type BanksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Banks'>;

export default function BanksScreen() {
    const navigation = useNavigation<BanksScreenNavigationProp>();
    const { banks, loadBanks, addBank, deleteBank, preferences } = useStore();
    const isDark = preferences.theme === 'dark';
    const currentTheme = isDark ? theme.dark : theme.light;
    const { showSuccess } = useToast();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newBankName, setNewBankName] = useState('');

    useEffect(() => {
        loadBanks();
    }, []);

    const handleAddBank = async () => {
        if (!newBankName.trim()) return;
        const success = await addBank(newBankName);
        if (success) {
            showSuccess(`Banco "${newBankName}" agregado correctamente`);
            setNewBankName('');
            setShowAddModal(false);
        } else {
            Alert.alert('Error', 'No se pudo agregar el banco');
        }
    };

    const handleDeleteBank = (id: string, name: string) => {
        Alert.alert(
            'Eliminar Banco',
            `¿Estás seguro de que quieres eliminar ${name}? Se eliminarán también sus tarjetas asociadas.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive', 
                    onPress: async () => {
                        await deleteBank(id);
                        showSuccess(`Banco "${name}" eliminado`);
                    }
                }
            ]
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentTheme.background,
            padding: 20,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: currentTheme.text,
        },
        addButton: {
            backgroundColor: currentTheme.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
        },
        addButtonText: {
            color: '#FFFFFF',
            fontWeight: 'bold',
        },
        card: {
            backgroundColor: currentTheme.card,
            padding: 20,
            borderRadius: 16,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        bankName: {
            fontSize: 18,
            fontWeight: '600',
            color: currentTheme.text,
        },
        cardActions: {
            flexDirection: 'row',
            gap: 12,
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
        input: {
            backgroundColor: currentTheme.background,
            color: currentTheme.text,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: currentTheme.border,
            marginBottom: 20,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 12,
        },
        modalButton: {
            padding: 10,
        },
        modalButtonText: {
            fontSize: 16,
            color: currentTheme.textSecondary,
        },
        modalButtonPrimaryText: {
            fontSize: 16,
            color: currentTheme.primary,
            fontWeight: 'bold',
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mis Bancos</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addButtonText}>+ Agregar</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={banks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.card}
                        onPress={() => navigation.navigate('BankDetail', { bankId: item.id, bankName: item.name })}
                    >
                        <View>
                            <Text style={styles.bankName}>{item.name}</Text>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity onPress={() => handleDeleteBank(item.id, item.name)}>
                                <Ionicons name="trash-outline" size={20} color={currentTheme.error} />
                            </TouchableOpacity>
                            <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={{ color: currentTheme.textSecondary, textAlign: 'center', marginTop: 40 }}>
                        No tienes bancos configurados.
                    </Text>
                }
            />

            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nuevo Banco</Text>
                        <TextInput
                            style={styles.input}
                            value={newBankName}
                            onChangeText={setNewBankName}
                            placeholder="Nombre del banco"
                            placeholderTextColor={currentTheme.textSecondary}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowAddModal(false)}>
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handleAddBank}>
                                <Text style={styles.modalButtonPrimaryText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
