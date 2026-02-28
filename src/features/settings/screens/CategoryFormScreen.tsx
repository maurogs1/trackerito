import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useToast } from '../../../shared/hooks/useToast';

const ICONS = [
  'cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness',
  'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle',
  'paw', 'book', 'briefcase', 'bus', 'call', 'camera', 'card', 'cash', 'desktop', 'gift',
  'globe', 'heart', 'key', 'laptop', 'map', 'musical-notes', 'pizza', 'shirt', 'train', 'wallet', 'wifi',
];
const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

type CategoryFormRouteProp = RouteProp<RootStackParamList, 'CategoryForm'>;
type CategoryFormNavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryForm'>;

export default function CategoryFormScreen() {
  const navigation = useNavigation<CategoryFormNavProp>();
  const route = useRoute<CategoryFormRouteProp>();
  const { categories, addCategory, updateCategory, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess } = useToast();

  const categoryId = route.params?.categoryId;
  const isEditing = !!categoryId;
  const editingCategory = isEditing ? categories.find(c => c.id === categoryId) : null;

  const [name, setName] = useState(editingCategory?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState(editingCategory?.icon ?? ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(editingCategory?.color ?? COLORS[0]);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar Categoría' : 'Nueva Categoría' });
  }, [isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresá un nombre');
      return;
    }

    if (isEditing && editingCategory) {
      await updateCategory({ ...editingCategory, name: name.trim(), icon: selectedIcon, color: selectedColor });
      showSuccess(`Categoría "${name.trim()}" actualizada`);
    } else {
      const newCat = await addCategory({ name: name.trim(), icon: selectedIcon, color: selectedColor });
      if (newCat) showSuccess(`Categoría "${name.trim()}" creada`);
    }
    navigation.goBack();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    selectionItem: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedItem: {
      borderColor: currentTheme.text,
    },
    saveButton: {
      backgroundColor: currentTheme.primary,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: spacing.xxxl,
      marginBottom: spacing.xxxl,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg }]}>
          Nombre
        </Text>
        <TextInput
          style={common.input}
          placeholder="Nombre de Categoría"
          placeholderTextColor={currentTheme.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xl }]}>
          Icono
        </Text>
        <View style={styles.grid}>
          {ICONS.map(icon => (
            <TouchableOpacity
              key={icon}
              style={[styles.selectionItem, selectedIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Ionicons
                name={icon as any}
                size={22}
                color={selectedIcon === icon ? selectedColor : currentTheme.text}
              />
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={[typography.button, { color: '#FFFFFF' }]}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
