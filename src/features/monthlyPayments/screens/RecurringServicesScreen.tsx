import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Modal, Alert, TouchableWithoutFeedback, Platform } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPredefinedService, setSelectedPredefinedService] = useState<PredefinedService | null>(null);
  const [editingService, setEditingService] = useState<RecurringService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [serviceDay, setServiceDay] = useState('15');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  
  // Modal de crear categoría
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('pricetag');
  const [newCategoryColor, setNewCategoryColor] = useState('#607D8B');

  // Buscador de categorías
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

    // Si es personalizado, dejar campos vacíos para que el usuario los complete
    if (service.name === 'Agregar Personalizado' || service.name === 'Otros') {
      setServiceName('');
      setServiceAmount('');
      setServiceDay('15');
      setSelectedCategoryId(undefined);
    } else {
      // Para servicios predefinidos, llenar con valores por defecto (pero editables)
      setServiceName(service.name);
      setServiceAmount(service.commonAmount ? formatCurrencyInput(service.commonAmount.toString()) : '');
      setServiceDay((service.commonDay || 15).toString());
      
      // Buscar categoría coincidente
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
      // Actualizar servicio existente
      const updatedService = await updateRecurringService(editingService.id, {
        name: serviceName,
        estimated_amount: amount,
        day_of_month: day,
        category_id: selectedCategoryId,
        icon: editingService.icon,
        color: editingService.color,
        is_active: editingService.is_active,
      });

      if (updatedService) {
        showSuccess(`"${serviceName}" actualizado correctamente`);
        setShowAddModal(false);
        resetForm();
        loadRecurringServices();
      }
    } else {
      // Crear nuevo servicio
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
      padding: 20,
    },
    searchContainer: {
      marginBottom: 20,
    },
    searchInput: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 12,
      paddingLeft: 44,
      color: currentTheme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    searchIcon: {
      position: 'absolute',
      left: 16,
      top: 12,
      zIndex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 12,
      marginTop: 8,
    },
    serviceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    serviceInfo: {
      flex: 1,
    },
    serviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 4,
    },
    serviceDetails: {
      fontSize: 12,
      color: currentTheme.textSecondary,
    },
    predefinedServiceCard: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
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
      marginRight: 12,
    },
    predefinedInfo: {
      flex: 1,
    },
    predefinedName: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
    },
    predefinedCategory: {
      fontSize: 11,
      color: currentTheme.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: currentTheme.textSecondary,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
      width: '100%',
      maxWidth: 500,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 12,
      color: currentTheme.text,
      borderWidth: 1,
      borderColor: currentTheme.border,
      fontSize: 16,
      ...Platform.select({
        web: {
          outlineStyle: 'none',
        }
      }),
    },
    categorySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
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
      borderColor: currentTheme.primary,
      borderWidth: 2,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: currentTheme.surface,
    },
    categoryChipSelected: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    categoryChipText: {
      fontSize: 12,
      color: currentTheme.text,
    },
    categoryChipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      padding: 10,
      borderRadius: 8,
    },
    modalButtonCancel: {
      backgroundColor: 'transparent',
    },
    modalButtonSave: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
    },
    modalButtonTextSave: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={currentTheme.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar (ej: Alquiler, Netflix, Luz, Gym...)"
            placeholderTextColor={currentTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Gastos Fijos Configurados */}
        {recurringServices.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Mis Gastos Fijos</Text>
            {recurringServices.map(service => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleEditService(service)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: service.color }]}>
                  <Ionicons name={service.icon as any} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDetails}>
                    {formatCurrencyDisplay(service.estimated_amount)} - Día {service.day_of_month} de cada mes
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteService(service.id, service.name);
                  }}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={currentTheme.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Gastos Fijos Predefinidos */}
        <Text style={styles.sectionTitle}>
          {searchQuery ? `Resultados (${filteredServices.length})` : 'Agregar Gasto Fijo'}
        </Text>
        
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={currentTheme.textSecondary} />
            <Text style={styles.emptyText}>
              No se encontraron gastos con "{searchQuery}"
            </Text>
          </View>
        ) : (
          filteredServices.map((service, index) => {
            const isAlreadyAdded = recurringServices.some(s => s.name === service.name);
            
            return (
              <TouchableOpacity
                key={`${service.name}-${index}`}
                style={[
                  styles.predefinedServiceCard,
                  isAlreadyAdded && { opacity: 0.5 }
                ]}
                onPress={() => !isAlreadyAdded && handleSelectPredefinedService(service)}
                disabled={isAlreadyAdded}
              >
                <View style={[styles.predefinedIconContainer, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={20} color={service.color} />
                </View>
                <View style={styles.predefinedInfo}>
                  <Text style={styles.predefinedName}>
                    {service.name}
                    {isAlreadyAdded && ' ✓ Agregado'}
                  </Text>
                  <Text style={styles.predefinedCategory}>
                    {service.category}
                    {service.commonAmount && ` • ~${formatCurrencyDisplay(service.commonAmount)}/mes`}
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
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Editar Gasto Fijo' : 'Configurar Gasto Fijo'}
            </Text>

            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={serviceName}
              onChangeText={setServiceName}
              placeholder={selectedPredefinedService?.name === 'Agregar Personalizado' || selectedPredefinedService?.name === 'Otros' ? "Ej: Alquiler, Seguro, Suscripción..." : selectedPredefinedService?.name || "Nombre del gasto"}
              placeholderTextColor={currentTheme.textSecondary}
            />
            {selectedPredefinedService && selectedPredefinedService.name !== 'Agregar Personalizado' && selectedPredefinedService.name !== 'Otros' && (
              <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 4 }}>
                Puedes editar el nombre si lo deseas
              </Text>
            )}

            <Text style={styles.inputLabel}>Monto Estimado *</Text>
            <TextInput
              style={styles.input}
              value={serviceAmount}
              onChangeText={(text) => setServiceAmount(formatCurrencyInput(text))}
              placeholder={selectedPredefinedService?.commonAmount ? formatCurrencyDisplay(selectedPredefinedService.commonAmount) : "0,00"}
              placeholderTextColor={currentTheme.textSecondary}
              keyboardType="numeric"
            />
            {selectedPredefinedService && selectedPredefinedService.commonAmount && selectedPredefinedService.name !== 'Agregar Personalizado' && selectedPredefinedService.name !== 'Otros' && (
              <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 4 }}>
                Monto sugerido: {formatCurrencyDisplay(selectedPredefinedService.commonAmount)}. Puedes cambiarlo según tu caso.
              </Text>
            )}

            <Text style={styles.inputLabel}>Día del Mes *</Text>
            <TextInput
              style={styles.input}
              value={serviceDay}
              onChangeText={(text) => {
                // Solo permitir números del 1 al 31
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
            {selectedPredefinedService && selectedPredefinedService.commonDay && selectedPredefinedService.name !== 'Agregar Personalizado' && selectedPredefinedService.name !== 'Otros' && (
              <Text style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 4 }}>
                Día sugerido: {selectedPredefinedService.commonDay}. Ajusta según tu fecha de vencimiento.
              </Text>
            )}

            <Text style={styles.inputLabel}>Categoría (Opcional)</Text>

            {/* Buscador de categorías */}
            {categories.length > INITIAL_CATEGORY_COUNT && (
              <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: currentTheme.surface, borderRadius: 12, borderWidth: 1, borderColor: currentTheme.border, paddingHorizontal: 12 }}>
                <Ionicons
                  name="search"
                  size={18}
                  color={currentTheme.textSecondary}
                />
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: currentTheme.text, fontSize: 14 }}
                  placeholder="Buscar categoría..."
                  placeholderTextColor={currentTheme.textSecondary}
                  value={categorySearch}
                  onChangeText={(text) => {
                    setCategorySearch(text);
                    if (text) setShowAllCategories(true);
                  }}
                />
                {categorySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCategorySearch('')}>
                    <Ionicons name="close-circle" size={18} color={currentTheme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.categorySelector}>
              {(() => {
                // Filtrar por búsqueda
                const filteredCategories = categorySearch
                  ? categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                  : categories;

                // Limitar cantidad mostrada
                const displayedCategories = showAllCategories || categorySearch
                  ? filteredCategories
                  : filteredCategories.slice(0, INITIAL_CATEGORY_COUNT);

                return (
                  <>
                    {displayedCategories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          selectedCategoryId === cat.id && styles.categoryChipSelected
                        ]}
                        onPress={() => setSelectedCategoryId(
                          selectedCategoryId === cat.id ? undefined : cat.id
                        )}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={16}
                          color={selectedCategoryId === cat.id ? '#FFFFFF' : cat.color}
                        />
                        <Text style={[
                          styles.categoryChipText,
                          selectedCategoryId === cat.id && styles.categoryChipTextSelected
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {/* Botón ver más/menos */}
                    {!categorySearch && categories.length > INITIAL_CATEGORY_COUNT && (
                      <TouchableOpacity
                        style={[styles.categoryChip, { backgroundColor: currentTheme.surface }]}
                        onPress={() => setShowAllCategories(!showAllCategories)}
                      >
                        <Ionicons
                          name={showAllCategories ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={currentTheme.textSecondary}
                        />
                        <Text style={[styles.categoryChipText, { color: currentTheme.textSecondary }]}>
                          {showAllCategories ? 'Menos' : `+${categories.length - INITIAL_CATEGORY_COUNT}`}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Botón nueva categoría */}
                    <TouchableOpacity
                      style={[styles.categoryChip, { borderStyle: 'dashed', borderColor: currentTheme.primary }]}
                      onPress={() => setShowCategoryModal(true)}
                    >
                      <Ionicons name="add" size={16} color={currentTheme.primary} />
                      <Text style={[styles.categoryChipText, { color: currentTheme.primary }]}>
                        Nueva
                      </Text>
                    </TouchableOpacity>

                    {/* Mensaje cuando no hay resultados */}
                    {categorySearch && displayedCategories.length === 0 && (
                      <Text style={{ color: currentTheme.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
                        No se encontraron categorías con "{categorySearch}"
                      </Text>
                    )}
                  </>
                );
              })()}
            </View>

            <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveService}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Guardar
                </Text>
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
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nueva Categoría</Text>

                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Servicios Públicos"
                  placeholderTextColor={currentTheme.textSecondary}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />

                <Text style={styles.inputLabel}>Icono</Text>
                <View style={styles.grid}>
                  {ICONS.slice(0, 20).map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.selectionItem,
                        newCategoryIcon === icon && styles.selectedItem,
                        { backgroundColor: currentTheme.surface }
                      ]}
                      onPress={() => setNewCategoryIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={20} color={currentTheme.text} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.grid}>
                  {COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.selectionItem,
                        newCategoryColor === color && styles.selectedItem,
                        { backgroundColor: color }
                      ]}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowCategoryModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
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
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                      Guardar
                    </Text>
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
