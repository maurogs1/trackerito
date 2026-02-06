import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Modal, Alert, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { formatCurrencyDisplay, parseCurrencyInput, formatCurrencyInput } from '../../../shared/utils/currency';
import { PREDEFINED_SERVICES, searchServices, SERVICE_CATEGORIES, getServicesByCategory } from '../mockServices';
import { PredefinedService, RecurringService } from '../types';
import { useToast } from '../../../shared/hooks/useToast';

type RecurringServicesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecurringServices'>;

export default function RecurringServicesScreen() {
  const navigation = useNavigation<RecurringServicesScreenNavigationProp>();
  const {
    recurringServices,
    loadRecurringServices,
    addRecurringService,
    updateRecurringService,
    deleteRecurringService,
    categories,
    addCategory,
    preferences
  } = useStore();
  const { showSuccess, showError } = useToast();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPredefinedService, setSelectedPredefinedService] = useState<PredefinedService | null>(null);
  const [editingService, setEditingService] = useState<RecurringService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [serviceDay, setServiceDay] = useState('15');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('pricetag');
  const [newCategoryColor, setNewCategoryColor] = useState('#607D8B');

  const [categorySearch, setCategorySearch] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const INITIAL_CATEGORY_COUNT = 6;

  const ICONS = [
    'cart', 'game-controller', 'car', 'medical', 'pricetag', 'restaurant', 'cafe', 'fitness',
    'school', 'construct', 'airplane', 'home', 'football', 'basketball', 'bicycle',
    'paw', 'book', 'briefcase', 'bus', 'call', 'camera', 'card', 'cash', 'desktop', 'gift',
    'globe', 'heart', 'key', 'laptop', 'map', 'musical-notes', 'pizza', 'shirt', 'train', 'wallet', 'wifi',
    'flash', 'water', 'flame', 'tv', 'phone-portrait', 'film', 'musical-notes', 'logo-youtube'
  ];
  const COLORS = ['#FF5722', '#9C27B0', '#2196F3', '#F44336', '#607D8B', '#4CAF50', '#FFC107', '#E91E63', '#795548', '#3F51B5'];

  useEffect(() => {
    loadRecurringServices();
  }, []);

  const filteredServices = searchQuery ? searchServices(searchQuery) : PREDEFINED_SERVICES;

  const handleSelectPredefinedService = (service: PredefinedService) => {
    setSelectedPredefinedService(service);

    if (service.name === 'Agregar Personalizado' || service.name === 'Otros') {
      setServiceName('');
      setServiceAmount('');
      setServiceDay('15');
      setSelectedCategoryId(undefined);
    } else {
      setServiceName(service.name);
      setServiceAmount(service.commonAmount ? formatCurrencyInput(service.commonAmount.toString()) : '');
      setServiceDay((service.commonDay || 15).toString());

      const matchingCategory = categories.find(c =>
        c.name.toLowerCase() === service.category.toLowerCase() ||
        service.category.toLowerCase().includes(c.name.toLowerCase())
      );
      setSelectedCategoryId(matchingCategory?.id);
    }

    setShowAddModal(true);
  };

  const handleSaveService = async () => {
    if (!serviceName.trim() || !serviceAmount.trim() || !serviceDay.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const amount = parseCurrencyInput(serviceAmount);
    const day = parseInt(serviceDay);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    if (day < 1 || day > 31) {
      Alert.alert('Error', 'El día debe estar entre 1 y 31');
      return;
    }

    const service = selectedPredefinedService;

    if (editingService) {
      try {
        await updateRecurringService(editingService.id, {
          name: serviceName,
          estimated_amount: amount,
          day_of_month: day,
          category_id: selectedCategoryId,
          icon: editingService.icon,
          color: editingService.color,
          is_active: editingService.is_active,
        });
        showSuccess(`"${serviceName}" actualizado correctamente`);
        setShowAddModal(false);
        resetForm();
        loadRecurringServices();
      } catch (error) {
        showError('Error al actualizar');
      }
    } else {
      const newService = await addRecurringService({
        name: serviceName,
        estimated_amount: amount,
        day_of_month: day,
        category_id: selectedCategoryId,
        icon: service?.icon || 'pricetag',
        color: service?.color || '#607D8B',
        is_active: true,
      });

      if (newService) {
        showSuccess(`"${serviceName}" agregado correctamente`);
        setShowAddModal(false);
        resetForm();
        loadRecurringServices();
      }
    }
  };

  const resetForm = () => {
    setServiceName('');
    setServiceAmount('');
    setServiceDay('15');
    setSelectedCategoryId(undefined);
    setSelectedPredefinedService(null);
    setEditingService(null);
    setCategorySearch('');
    setShowAllCategories(false);
  };

  const handleEditService = (service: RecurringService) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceAmount(formatCurrencyInput(service.estimated_amount.toString()));
    setServiceDay(service.day_of_month.toString());
    setSelectedCategoryId(service.category_id);
    setSelectedPredefinedService(null);
    setShowAddModal(true);
  };

  const handleDeleteService = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Gasto Fijo',
      `¿Estás seguro de que quieres eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteRecurringService(id);
            showSuccess(`"${name}" eliminado`);
            loadRecurringServices();
          }
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.xl,
    },
    searchContainer: {
      marginBottom: spacing.xl,
    },
    searchInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      paddingLeft: 44,
      color: currentTheme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    searchIcon: {
      position: 'absolute',
      left: spacing.lg,
      top: spacing.md,
      zIndex: 1,
    },
    serviceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      ...shadows.sm,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.lg,
    },
    serviceInfo: {
      flex: 1,
    },
    predefinedServiceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    predefinedIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    predefinedInfo: {
      flex: 1,
    },
    emptyState: {
      padding: spacing.xxxl,
      alignItems: 'center',
    },
    categorySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
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
      borderColor: currentTheme.primary,
      borderWidth: 2,
    },
    categoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: currentTheme.surface,
    },
    categoryChipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={currentTheme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar (ej: Alquiler, Netflix, Luz, Gym...)"
            placeholderTextColor={currentTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Gastos Fijos Predefinidos */}
        <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.md }]}>
          {searchQuery ? `Resultados (${filteredServices.length})` : 'Agregar Gasto Fijo'}
        </Text>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={currentTheme.textSecondary} />
            <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
              No se encontraron gastos con "{searchQuery}"
            </Text>
          </View>
        ) : (
          filteredServices.map((service, index) => {
            const isAlreadyAdded = recurringServices.some(s => s.name === service.name);

            return (
              <TouchableOpacity
                key={`${service.name}-${index}`}
                style={[styles.predefinedServiceCard, isAlreadyAdded && { opacity: 0.5 }]}
                onPress={() => !isAlreadyAdded && handleSelectPredefinedService(service)}
                disabled={isAlreadyAdded}
              >
                <View style={[styles.predefinedIconContainer, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={20} color={service.color} />
                </View>
                <View style={styles.predefinedInfo}>
                  <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
                    {service.name}{isAlreadyAdded && ' ✓ Agregado'}
                  </Text>
                  <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                    {service.category}{service.commonAmount && ` • ~${formatCurrencyDisplay(service.commonAmount)}/mes`}
                  </Text>
                </View>
                {!isAlreadyAdded && (
                  <Ionicons name="add-circle-outline" size={24} color={currentTheme.primary} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal para agregar servicio */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
          <View style={common.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView style={common.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.xl }]}>
                  {editingService ? 'Editar Gasto Fijo' : 'Configurar Gasto Fijo'}
                </Text>

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm }]}>Nombre *</Text>
                <TextInput
                  style={common.input}
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder={selectedPredefinedService?.name === 'Agregar Personalizado' || selectedPredefinedService?.name === 'Otros' ? "Ej: Alquiler, Seguro, Suscripción..." : selectedPredefinedService?.name || "Nombre del gasto"}
                  placeholderTextColor={currentTheme.textSecondary}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Monto Estimado *</Text>
                <TextInput
                  style={common.input}
                  value={serviceAmount}
                  onChangeText={(text) => setServiceAmount(formatCurrencyInput(text))}
                  placeholder={selectedPredefinedService?.commonAmount ? formatCurrencyDisplay(selectedPredefinedService.commonAmount) : "0,00"}
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="numeric"
                />

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm, marginTop: spacing.lg }]}>Día del Mes *</Text>
                <TextInput
                  style={common.input}
                  value={serviceDay}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (text === '' || (!isNaN(num) && num >= 1 && num <= 31)) {
                      setServiceDay(text);
                    }
                  }}
                  placeholder={selectedPredefinedService?.commonDay ? selectedPredefinedService.commonDay.toString() : "15"}
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginTop: spacing.lg }]}>Categoría (Opcional)</Text>

                <View style={styles.categorySelector}>
                  {(() => {
                    const filteredCategories = categorySearch
                      ? categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      : categories;
                    const displayedCategories = showAllCategories || categorySearch
                      ? filteredCategories
                      : filteredCategories.slice(0, INITIAL_CATEGORY_COUNT);

                    return (
                      <>
                        {displayedCategories.map(cat => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipSelected]}
                            onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id)}
                          >
                            <Ionicons
                              name={cat.icon as any}
                              size={16}
                              color={selectedCategoryId === cat.id ? '#FFFFFF' : cat.color}
                            />
                            <Text style={[typography.caption, { color: selectedCategoryId === cat.id ? '#FFFFFF' : currentTheme.text, fontWeight: selectedCategoryId === cat.id ? '600' : 'normal' }]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        {!categorySearch && categories.length > INITIAL_CATEGORY_COUNT && (
                          <TouchableOpacity
                            style={styles.categoryChip}
                            onPress={() => setShowAllCategories(!showAllCategories)}
                          >
                            <Ionicons name={showAllCategories ? "chevron-up" : "chevron-down"} size={16} color={currentTheme.textSecondary} />
                            <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
                              {showAllCategories ? 'Menos' : `+${categories.length - INITIAL_CATEGORY_COUNT}`}
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[styles.categoryChip, { borderStyle: 'dashed', borderColor: currentTheme.primary }]}
                          onPress={() => setShowCategoryModal(true)}
                        >
                          <Ionicons name="add" size={16} color={currentTheme.primary} />
                          <Text style={[typography.caption, { color: currentTheme.primary }]}>Nueva</Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </View>

                <View style={[common.rowBetween, { marginTop: spacing.xxl }]}>
                  <TouchableOpacity style={{ padding: spacing.md }} onPress={() => { setShowAddModal(false); resetForm(); }}>
                    <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={common.buttonPrimary} onPress={handleSaveService}>
                    <Text style={common.buttonPrimaryText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal para crear categoría */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowCategoryModal(false)}>
          <View style={common.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={common.modalContent}>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.xl }]}>Nueva Categoría</Text>

                <Text style={[typography.label, { color: currentTheme.text, marginBottom: spacing.sm }]}>Nombre</Text>
                <TextInput
                  style={common.input}
                  placeholder="Ej: Servicios Públicos"
                  placeholderTextColor={currentTheme.textSecondary}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />

                <Text style={[typography.label, { color: currentTheme.text, marginTop: spacing.lg }]}>Icono</Text>
                <View style={styles.grid}>
                  {ICONS.slice(0, 20).map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.selectionItem, newCategoryIcon === icon && styles.selectedItem, { backgroundColor: currentTheme.surface }]}
                      onPress={() => setNewCategoryIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[typography.label, { color: currentTheme.text }]}>Color</Text>
                <View style={styles.grid}>
                  {COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.selectionItem, newCategoryColor === color && styles.selectedItem, { backgroundColor: color }]}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>

                <View style={[common.rowBetween, { marginTop: spacing.xxl }]}>
                  <TouchableOpacity style={{ padding: spacing.md }} onPress={() => setShowCategoryModal(false)}>
                    <Text style={[typography.body, { color: currentTheme.textSecondary }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={common.buttonPrimary}
                    onPress={async () => {
                      if (newCategoryName.trim()) {
                        const newCategory = await addCategory({
                          name: newCategoryName,
                          icon: newCategoryIcon,
                          color: newCategoryColor,
                        });
                        if (newCategory) {
                          setSelectedCategoryId(newCategory.id);
                          showSuccess(`Categoría "${newCategoryName}" creada`);
                          setShowCategoryModal(false);
                          setNewCategoryName('');
                          setNewCategoryIcon('pricetag');
                          setNewCategoryColor('#607D8B');
                        }
                      }
                    }}
                  >
                    <Text style={common.buttonPrimaryText}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
