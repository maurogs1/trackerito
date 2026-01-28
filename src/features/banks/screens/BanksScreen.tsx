import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
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
  const common = createCommonStyles(currentTheme);
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
      padding: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    addButton: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    card: {
      backgroundColor: currentTheme.card,
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...shadows.md,
    },
    cardActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: currentTheme.text }]}>Mis Bancos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={[typography.buttonSmall, { color: '#FFFFFF' }]}>+ Agregar</Text>
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
              <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>{item.name}</Text>
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
          <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: 40 }]}>
            No tienes bancos configurados.
          </Text>
        }
      />

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={common.modalOverlay}>
          <View style={common.modalContent}>
            <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>Nuevo Banco</Text>
            <TextInput
              style={common.input}
              value={newBankName}
              onChangeText={setNewBankName}
              placeholder="Nombre del banco"
              placeholderTextColor={currentTheme.textSecondary}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.lg }}>
              <TouchableOpacity style={{ padding: spacing.md }} onPress={() => setShowAddModal(false)}>
                <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: spacing.md }} onPress={handleAddBank}>
                <Text style={[typography.buttonSmall, { color: currentTheme.primary }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
