import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useToast } from '../../../shared/hooks/useToast';

const ICONS = [
  'person', 'business', 'home', 'briefcase', 'storefront', 'car',
  'heart', 'star', 'globe', 'school', 'fitness', 'medical',
  'wallet', 'cash', 'card', 'trending-up', 'construct', 'laptop',
  'restaurant', 'cafe', 'cart', 'pricetag', 'gift', 'trophy',
];

const COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#795548', '#607D8B',
  '#FF5722', '#F44336', '#E91E63', '#3F51B5', '#FFC107', '#00BCD4',
];

type FormRouteProp = RouteProp<RootStackParamList, 'SpaceForm'>;
type FormNavProp = NativeStackNavigationProp<RootStackParamList, 'SpaceForm'>;

export default function SpaceFormScreen() {
  const navigation = useNavigation<FormNavProp>();
  const route = useRoute<FormRouteProp>();
  const { spaces, addSpace, updateSpace, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const spaceId = route.params?.spaceId;
  const isEditing = !!spaceId;
  const editing = isEditing ? spaces.find((s) => s.id === spaceId) : null;

  const [name, setName] = useState(editing?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState(editing?.icon ?? ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(editing?.color ?? COLORS[0]);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar Espacio' : 'Nuevo Espacio' });
  }, [isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Por favor ingresá un nombre');
      return;
    }
    if (isEditing && editing) {
      await updateSpace({ ...editing, name: name.trim(), icon: selectedIcon, color: selectedColor });
      showSuccess(`"${name.trim()}" actualizado`);
    } else {
      await addSpace({ name: name.trim(), icon: selectedIcon, color: selectedColor });
      showSuccess(`"${name.trim()}" creado`);
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
          placeholder="Nombre del espacio"
          placeholderTextColor={currentTheme.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xl }]}>
          Ícono
        </Text>
        <View style={styles.grid}>
          {ICONS.map((icon) => (
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
          {COLORS.map((color) => (
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
