import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyInput, parseCurrencyInput } from '../../../shared/utils/currency';
import { FinancialType } from '../types';

type AddExpenseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;

const ICONS = ['cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness', 'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle'];
const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

export default function AddExpenseScreen() {
  const navigation = useNavigation<AddExpenseScreenNavigationProp>();
  const { addExpense, preferences, getMostUsedCategories, addCategory, categories: allCategories } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [financialType, setFinancialType] = useState<FinancialType>('unclassified');
  
  // Quick Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(ICONS[0]);
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);

  const categories = getMostUsedCategories();
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const showSearch = categories.length > 10;

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryName) {
      const firstCat = categories[0];
      setSelectedCategoryName(firstCat.name);
      if (firstCat.financialType) {
        setFinancialType(firstCat.financialType);
      }
    }
  }, [categories]);

  // Update financial type when category changes
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategoryName(categoryName);
    const category = allCategories.find(c => c.name === categoryName);
    if (category?.financialType) {
      setFinancialType(category.financialType);
    }
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatCurrencyInput(text);
    setAmount(formatted);
  };

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const numAmount = parseCurrencyInput(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    await addExpense({
      amount: numAmount,
      description,
      category: selectedCategoryName,
      date: new Date().toISOString(),
      financialType: financialType,
    });

    navigation.goBack();
  };

  const handleQuickAddCategory = () => {
    if (newCategoryName) {
      addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      setSelectedCategoryName(newCategoryName);
      setModalVisible(false);
      setNewCategoryName('');
      setNewCategoryIcon(ICONS[0]);
      setNewCategoryColor(COLORS[0]);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      color: currentTheme.text,
      marginLeft: 8,
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.card,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryChipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    categoryText: {
      color: currentTheme.text,
    },
    categoryTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    addCategoryButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.primary,
      borderStyle: 'dashed',
    },
    saveButton: {
      backgroundColor: currentTheme.primary,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    // Type Selector Styles
    typeContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.card,
    },
    typeButtonSelected: {
      borderWidth: 2,
    },
    typeText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.textSecondary,
    },
    typeTextSelected: {
      color: '#FFFFFF',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      padding: 20,
      borderRadius: 16,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: currentTheme.text,
    },
    sectionLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 8,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    selectionItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedItem: {
      borderColor: currentTheme.text,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 16,
    },
    button: {
      padding: 10,
    },
    buttonText: {
      color: currentTheme.primary,
      fontWeight: 'bold',
    },
  });

  const getTypeColor = (type: FinancialType) => {
    switch (type) {
      case 'needs': return '#4CAF50'; // Green
      case 'wants': return '#FF9800'; // Orange
      case 'savings': return '#2196F3'; // Blue
      default: return currentTheme.textSecondary;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Monto</Text>
        <TextInput
          style={styles.input}
          placeholder="0,00"
          placeholderTextColor={currentTheme.textSecondary}
          keyboardType="numeric"
          value={amount}
          onChangeText={handleAmountChange}
          autoFocus
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.input}
          placeholder="¿Qué compraste?"
          placeholderTextColor={currentTheme.textSecondary}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Clasificación Financiera</Text>
        <View style={styles.typeContainer}>
          {(['needs', 'wants', 'savings'] as FinancialType[]).map((type) => {
            const isSelected = financialType === type;
            const color = getTypeColor(type);
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  isSelected && styles.typeButtonSelected,
                  isSelected && { backgroundColor: color, borderColor: color }
                ]}
                onPress={() => setFinancialType(type)}
              >
                <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>
                  {type === 'needs' ? 'Necesidad' : type === 'wants' ? 'Deseo' : 'Ahorro'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Categoría</Text>
        
        {showSearch && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={currentTheme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoría..."
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        <View style={styles.categoryContainer}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategoryName === cat.name && styles.categoryChipSelected,
              ]}
              onPress={() => handleCategorySelect(cat.name)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={16} 
                color={selectedCategoryName === cat.name ? '#FFFFFF' : cat.color} 
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategoryName === cat.name && styles.categoryTextSelected,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.addCategoryButton} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar Gasto</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Add Category Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>
            
            <Text style={styles.sectionLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Fútbol"
              placeholderTextColor={currentTheme.textSecondary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <Text style={styles.sectionLabel}>Icono</Text>
            <View style={styles.grid}>
              {ICONS.map(icon => (
                <TouchableOpacity 
                  key={icon} 
                  style={[styles.selectionItem, newCategoryIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                  onPress={() => setNewCategoryIcon(icon)}
                >
                  <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.grid}>
              {COLORS.map(color => (
                <TouchableOpacity 
                  key={color} 
                  style={[styles.selectionItem, newCategoryColor === color && styles.selectedItem, { backgroundColor: color }]}
                  onPress={() => setNewCategoryColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleQuickAddCategory}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
