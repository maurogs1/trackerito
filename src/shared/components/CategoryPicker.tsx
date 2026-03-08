import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView, Platform } from 'react-native';
import { useStore } from '../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../hooks/useToast';

const ICONS = [
  'cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness',
  'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle',
  'paw', 'book', 'briefcase', 'bus', 'call', 'camera', 'card', 'cash', 'desktop', 'gift',
  'globe', 'heart', 'key', 'laptop', 'map', 'musical-notes', 'pizza', 'shirt', 'train', 'wallet', 'wifi'
];
const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

const INITIAL_CATEGORY_COUNT = 6;
const INITIAL_ICON_COUNT = 15;

interface CategoryPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onCategorySelected?: (categoryId: string) => void;
  onManageCategories?: () => void;
  multiSelect?: boolean;
  label?: string;
}

export function CategoryPicker({
  selectedIds,
  onSelectionChange,
  onCategorySelected,
  multiSelect = true,
  label = 'Categoría',
}: CategoryPickerProps) {
  const { preferences, getMostUsedCategories, addCategory, categories: allCategories } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess } = useToast();

  const [showAllModal, setShowAllModal] = useState(false);
  const [allModalSearch, setAllModalSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState(ICONS[0]);
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [newlyAddedCategoryIds, setNewlyAddedCategoryIds] = useState<string[]>([]);

  const categories = getMostUsedCategories();

  const sortedCategories = useMemo(() => {
    // 1. Selected categories first (for edit mode)
    const selectedCats = allCategories.filter((c: any) => selectedIds.includes(c.id));
    // 2. Newly added categories (not selected)
    const newCats = allCategories.filter((c: any) =>
      newlyAddedCategoryIds.includes(c.id) && !selectedIds.includes(c.id)
    );
    // 3. Standard categories (not selected, not new)
    const standardCats = categories.filter((c: any) =>
      !newlyAddedCategoryIds.includes(c.id) && !selectedIds.includes(c.id)
    );
    return [...selectedCats, ...newCats, ...standardCats];
  }, [categories, allCategories, newlyAddedCategoryIds, selectedIds]);

  const handleCategorySelect = (categoryId: string) => {
    if (multiSelect) {
      const newIds = selectedIds.includes(categoryId)
        ? selectedIds.filter(id => id !== categoryId)
        : [...selectedIds, categoryId];
      onSelectionChange(newIds);
    } else {
      const newIds = selectedIds.includes(categoryId) ? [] : [categoryId];
      onSelectionChange(newIds);
    }
    onCategorySelected?.(categoryId);
  };

  const handleQuickAddCategory = async () => {
    if (newCategoryName) {
      const newCategory = await addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });

      if (newCategory) {
        setNewlyAddedCategoryIds(prev => [newCategory.id, ...prev]);
        if (multiSelect) {
          onSelectionChange([...selectedIds, newCategory.id]);
        } else {
          onSelectionChange([newCategory.id]);
        }
        showSuccess(`Categoría "${newCategoryName}" creada`);
      }

      setModalVisible(false);
      setNewCategoryName('');
      setNewCategoryIcon(ICONS[0]);
      setNewCategoryColor(COLORS[0]);
    }
  };

  const styles = StyleSheet.create({
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: currentTheme.card,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    categoryChipSelected: {
      borderWidth: 2,
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
  });

  const allModalFiltered = useMemo(() =>
    sortedCategories.filter(c => c.name.toLowerCase().includes(allModalSearch.toLowerCase())),
    [sortedCategories, allModalSearch]
  );

  return (
    <>
      {/* Label */}
      <Text style={[typography.body, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>{label}</Text>

      {/* Category Chips (top N) */}
      <View style={styles.categoryContainer}>
        {sortedCategories.slice(0, INITIAL_CATEGORY_COUNT).map((cat: any) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
                isSelected && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <Ionicons name={cat.icon as any} size={16} color={isSelected ? '#FFFFFF' : cat.color} />
              <Text style={[typography.body, { color: isSelected ? '#FFFFFF' : currentTheme.text }, isSelected && { fontWeight: 'bold' }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {sortedCategories.length > INITIAL_CATEGORY_COUNT && (
          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => { setAllModalSearch(''); setShowAllModal(true); }}
          >
            <Text style={[typography.body, { color: currentTheme.primary }]}>
              Ver más ({sortedCategories.length - INITIAL_CATEGORY_COUNT})
            </Text>
            <Ionicons name="chevron-down" size={16} color={currentTheme.primary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.addCategoryButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={currentTheme.primary} />
        </TouchableOpacity>
      </View>

      {/* Modal: todas las categorías para seleccionar */}
      <Modal visible={showAllModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowAllModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ backgroundColor: currentTheme.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingTop: spacing.lg, maxHeight: '80%' }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Todas las categorías</Text>
                  <TouchableOpacity onPress={() => setShowAllModal(false)}>
                    <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Listo</Text>
                  </TouchableOpacity>
                </View>

                {/* Buscador */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: currentTheme.card, borderRadius: spacing.sm, paddingHorizontal: spacing.md, marginHorizontal: spacing.xl, marginBottom: spacing.md, height: 40, borderWidth: 1, borderColor: currentTheme.border }}>
                  <Ionicons name="search" size={16} color={currentTheme.textSecondary} />
                  <TextInput
                    style={{ flex: 1, marginLeft: spacing.sm, color: currentTheme.text, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any}
                    placeholder="Buscar categoría..."
                    placeholderTextColor={currentTheme.textSecondary}
                    value={allModalSearch}
                    onChangeText={setAllModalSearch}
                    autoFocus
                  />
                  {allModalSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setAllModalSearch('')}>
                      <Ionicons name="close-circle" size={16} color={currentTheme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Lista */}
                <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                  {allModalFiltered.map((cat: any) => {
                    const isSelected = selectedIds.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, isSelected && styles.categoryChipSelected, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]}
                        onPress={() => handleCategorySelect(cat.id)}
                      >
                        <Ionicons name={cat.icon as any} size={16} color={isSelected ? '#FFFFFF' : cat.color} />
                        <Text style={[typography.body, { color: isSelected ? '#FFFFFF' : currentTheme.text }, isSelected && { fontWeight: 'bold' }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Quick Add Category Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={common.modalOverlayCentered}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{
                  backgroundColor: currentTheme.card,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  width: '90%',
                  maxWidth: 400,
                }}>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.lg }]}>Nueva Categoría</Text>

                  <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>Nombre</Text>
                  <TextInput
                    style={common.input}
                    placeholder="Ej: Fútbol"
                    placeholderTextColor={currentTheme.textSecondary}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                  />

                  <Text style={[typography.label, { color: currentTheme.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Icono</Text>
                  <View style={styles.grid}>
                    {ICONS.slice(0, showAllIcons ? undefined : INITIAL_ICON_COUNT).map(icon => (
                      <TouchableOpacity
                        key={icon}
                        style={[styles.selectionItem, newCategoryIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                        onPress={() => setNewCategoryIcon(icon)}
                      >
                        <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.selectionItem, { backgroundColor: currentTheme.surface, width: 'auto', paddingHorizontal: spacing.md }]}
                      onPress={() => setShowAllIcons(!showAllIcons)}
                    >
                      <Text style={[typography.caption, { color: currentTheme.primary, fontWeight: 'bold' }]}>
                        {showAllIcons ? 'Menos' : 'Ver más'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[typography.label, { color: currentTheme.textSecondary, marginBottom: spacing.sm }]}>Color</Text>
                  <View style={styles.grid}>
                    {COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[styles.selectionItem, newCategoryColor === color && styles.selectedItem, { backgroundColor: color }]}
                        onPress={() => setNewCategoryColor(color)}
                      />
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl }}>
                    <TouchableOpacity style={{ padding: spacing.md }} onPress={() => setModalVisible(false)}>
                      <Text style={[typography.body, { color: currentTheme.primary }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: spacing.md }} onPress={handleQuickAddCategory}>
                      <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

export default CategoryPicker;
