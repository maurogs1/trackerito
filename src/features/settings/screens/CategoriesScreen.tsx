import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../../shared/hooks/useToast';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { SwipeableRow } from '../../../shared/components/SwipeableRow';

type CategoriesNavProp = NativeStackNavigationProp<RootStackParamList, 'Categories'>;

interface CategoryToDelete {
  id: string;
  name: string;
  usageCount: number;
}

export default function CategoriesScreen() {
  const navigation = useNavigation<CategoriesNavProp>();
  const { categories, removeCategory, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryToDelete | null>(null);

  const handleDelete = (id: string, name: string, usageCount: number) => {
    setCategoryToDelete({ id, name, usageCount });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    await removeCategory(categoryToDelete.id);
    showSuccess(`Categoría "${categoryToDelete.name}" eliminada`);
    setShowDeleteModal(false);
    setCategoryToDelete(null);
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
      borderWidth: 1,
      borderColor: currentTheme.border,
      gap: spacing.md,
    },
    categoryMeta: {
      flex: 1,
    },
    usageCount: {
      fontSize: 11,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    deleteModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xxl,
      width: '85%',
      maxWidth: 400,
      alignItems: 'center',
    },
    deleteModalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
      marginTop: spacing.xl,
    },
    deleteModalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: currentTheme.text }]}>Mis Categorías</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CategoryForm')}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item.id, item.name, item.usageCount ?? 0)}>
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => navigation.navigate('CategoryForm', { categoryId: item.id })}
              activeOpacity={0.7}
            >
              <View style={[common.iconContainerSmall, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.categoryMeta}>
                <Text style={[typography.bodyBold, { color: currentTheme.text }]}>{item.name}</Text>
                <Text style={styles.usageCount}>
                  {(item.usageCount ?? 0) > 0
                    ? `${item.usageCount} ${item.usageCount === 1 ? 'gasto' : 'gastos'}`
                    : 'Sin usos'}
                </Text>
              </View>
            </TouchableOpacity>
          </SwipeableRow>
        )}
      />

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.deleteModalContent}>
                  <View style={{ marginBottom: spacing.lg }}>
                    <Ionicons name="alert-circle" size={48} color={currentTheme.error} />
                  </View>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, textAlign: 'center', marginBottom: spacing.md }]}>
                    Eliminar Categoría
                  </Text>
                  <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
                    {categoryToDelete && (categoryToDelete.usageCount > 0)
                      ? `Esta categoría se usa en ${categoryToDelete.usageCount} ${categoryToDelete.usageCount === 1 ? 'gasto' : 'gastos'}. Los gastos quedarán sin esta categoría.`
                      : `¿Querés eliminar "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
                  </Text>
                  <View style={styles.deleteModalButtons}>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }]}
                      onPress={() => setShowDeleteModal(false)}
                    >
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteModalButton, { backgroundColor: currentTheme.error }]}
                      onPress={confirmDelete}
                    >
                      <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
