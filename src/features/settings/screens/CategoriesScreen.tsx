import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../shared/hooks/useToast';

const ICONS = ['cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness', 'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle'];
const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

export default function CategoriesScreen() {
  const { categories, addCategory, removeCategory, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
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
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xxl,
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
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      justifyContent: 'space-between',
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.lg,
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
      gap: spacing.md,
      marginTop: spacing.lg,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: currentTheme.text }]}>Mis Categorías</Text>
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
              <View style={[common.iconContainerSmall, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{item.name}</Text>
            </View>
            <TouchableOpacity
              style={{ padding: spacing.sm }}
              onPress={() => handleDeleteCategory(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={20} color={currentTheme.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={common.modalOverlay}>
          <View style={common.modalContent}>
            <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>
              Nueva Categoría
            </Text>

            <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
              Nombre
            </Text>
            <TextInput
              style={common.input}
              placeholder="Nombre de Categoría"
              placeholderTextColor={currentTheme.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg }]}>
              Icono
            </Text>
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

            <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>
              Color
            </Text>
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
              <TouchableOpacity style={{ padding: spacing.md }} onPress={() => setModalVisible(false)}>
                <Text style={[typography.buttonSmall, { color: currentTheme.primary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: spacing.md }} onPress={handleAddCategory}>
                <Text style={[typography.buttonSmall, { color: currentTheme.primary }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
