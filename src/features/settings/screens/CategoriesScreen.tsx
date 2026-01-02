import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../shared/hooks/useToast';

const ICONS = ['cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness', 'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle'];
const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

export default function CategoriesScreen() {
  const { categories, addCategory, removeCategory, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showSuccess } = useToast();

  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAddCategory = async () => {
    if (!newName) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return;
    }
    const newCategory = await addCategory({
      name: newName,
      icon: selectedIcon,
      color: selectedColor,
    });
    if (newCategory) {
      showSuccess(`Categoría "${newName}" creada correctamente`);
    }
    setModalVisible(false);
    setNewName('');
    setSelectedIcon(ICONS[0]);
    setSelectedColor(COLORS[0]);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Estás seguro de que quieres eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            await removeCategory(id);
            showSuccess(`Categoría "${name}" eliminada`);
          }
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    addButton: {
      backgroundColor: currentTheme.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      justifyContent: 'space-between',
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    deleteButton: {
      padding: 8,
    },
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
    input: {
      backgroundColor: currentTheme.surface,
      color: currentTheme.text,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Categorías</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteCategory(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={20} color={currentTheme.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>
            
            <Text style={styles.sectionLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de Categoría"
              placeholderTextColor={currentTheme.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.sectionLabel}>Icono</Text>
            <View style={styles.grid}>
              {ICONS.map(icon => (
                <TouchableOpacity 
                  key={icon} 
                  style={[styles.selectionItem, selectedIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                  onPress={() => setSelectedIcon(icon)}
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
                  style={[styles.selectionItem, selectedColor === color && styles.selectedItem, { backgroundColor: color }]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleAddCategory}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
