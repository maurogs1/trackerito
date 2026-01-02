import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay, parseCurrencyInput, formatCurrencyInput } from '../../../shared/utils/currency';
import { Investment, InvestmentType } from '../types';
import { useToast } from '../../../shared/hooks/useToast';

export default function InvestmentsScreen() {
  const { investments, addInvestment, removeInvestment, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showSuccess } = useToast();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newInvestment, setNewInvestment] = useState<{ name: string; amount: string; type: InvestmentType }>({
    name: '',
    amount: '',
    type: 'other'
  });

  const totalValue = investments.reduce((sum, i) => sum + i.amount, 0);

  const handleAdd = async () => {
    if (!newInvestment.name || !newInvestment.amount) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    await addInvestment({
      name: newInvestment.name,
      amount: parseCurrencyInput(newInvestment.amount),
      type: newInvestment.type,
      currency: 'ARS', // Default for now
      date: new Date().toISOString()
    });

    showSuccess(`Inversión "${newInvestment.name}" agregada correctamente`);
    setIsModalVisible(false);
    setNewInvestment({ name: '', amount: '', type: 'other' });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Eliminar Inversión",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            await removeInvestment(id);
            showSuccess(`Inversión "${name}" eliminada`);
          }
        }
      ]
    );
  };

  const getIcon = (type: InvestmentType) => {
    switch (type) {
      case 'crypto': return 'logo-bitcoin';
      case 'stock': return 'trending-up';
      case 'fixed_income': return 'time';
      case 'real_estate': return 'home';
      default: return 'wallet';
    }
  };

  const getColor = (type: InvestmentType) => {
    switch (type) {
      case 'crypto': return '#F7931A';
      case 'stock': return '#2196F3';
      case 'fixed_income': return '#4CAF50';
      case 'real_estate': return '#795548';
      default: return '#607D8B';
    }
  };

  const getTypeLabel = (type: InvestmentType) => {
    switch (type) {
      case 'crypto': return 'Cripto';
      case 'stock': return 'Acciones/CEDEARs';
      case 'fixed_income': return 'Renta Fija';
      case 'real_estate': return 'Inmuebles';
      default: return 'Otro';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    headerCard: {
      backgroundColor: currentTheme.card,
      padding: 24,
      margin: 16,
      borderRadius: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    totalLabel: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginBottom: 8,
    },
    totalAmount: {
      fontSize: 40,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginLeft: 16,
      marginBottom: 12,
    },
    listContainer: {
      padding: 16,
      paddingTop: 0,
    },
    item: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    itemName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 4,
    },
    itemType: {
      fontSize: 12,
      color: currentTheme.textSecondary,
    },
    itemAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.success,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      backgroundColor: currentTheme.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      minHeight: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    inputLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
    },
    input: {
      backgroundColor: currentTheme.background,
      borderRadius: 12,
      padding: 16,
      color: currentTheme.text,
      fontSize: 16,
      marginBottom: 20,
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    typeChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    typeChipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    typeChipText: {
      color: currentTheme.text,
      fontSize: 12,
    },
    typeChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 'auto',
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: currentTheme.background,
    },
    saveButton: {
      backgroundColor: currentTheme.primary,
    },
    buttonText: {
      fontWeight: 'bold',
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.totalLabel}>Patrimonio Total</Text>
        <Text style={styles.totalAmount}>${formatCurrencyDisplay(totalValue)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Mis Activos</Text>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {investments.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.item}
            onLongPress={() => handleDelete(item.id, item.name)}
            delayLongPress={500}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + '20' }]}>
                <Ionicons name={getIcon(item.type) as any} size={24} color={getColor(item.type)} />
              </View>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemType}>{getTypeLabel(item.type)}</Text>
              </View>
            </View>
            <Text style={styles.itemAmount}>${formatCurrencyDisplay(item.amount)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Inversión</Text>

            <Text style={styles.inputLabel}>Nombre del Activo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Bitcoin, Apple, Plazo Fijo"
              placeholderTextColor={currentTheme.textSecondary}
              value={newInvestment.name}
              onChangeText={(t) => setNewInvestment(prev => ({ ...prev, name: t }))}
            />

            <Text style={styles.inputLabel}>Valor Actual</Text>
            <TextInput
              style={styles.input}
              placeholder="$0"
              placeholderTextColor={currentTheme.textSecondary}
              keyboardType="numeric"
              value={newInvestment.amount}
              onChangeText={(t) => setNewInvestment(prev => ({ ...prev, amount: formatCurrencyInput(t) }))}
            />

            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.typeContainer}>
              {(['crypto', 'stock', 'fixed_income', 'real_estate', 'other'] as InvestmentType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    newInvestment.type === type && styles.typeChipSelected
                  ]}
                  onPress={() => setNewInvestment(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeChipText,
                    newInvestment.type === type && styles.typeChipTextSelected
                  ]}>
                    {getTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.buttonText, { color: currentTheme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleAdd}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
