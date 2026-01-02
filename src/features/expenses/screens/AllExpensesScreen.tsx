import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { useToast } from '../../../shared/hooks/useToast';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  parseISO, 
  format, 
  addMonths, 
  subMonths, 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  getDay
} from 'date-fns';
import { es } from 'date-fns/locale';

type FilterPeriod = 'all' | 'week' | 'month' | 'custom';

type AllExpensesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllExpenses'>;

export default function AllExpensesScreen() {
  const navigation = useNavigation<AllExpensesScreenNavigationProp>();
  const { expenses, categories, preferences, removeExpense } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showSuccess, showError } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Date Range State
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Filter expenses based on selected filters
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.categoryIds && e.categoryIds.includes(selectedCategory));
    }

    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let interval;
      
      if (selectedPeriod === 'week') {
        interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      } else if (selectedPeriod === 'month') {
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
      } else if (selectedPeriod === 'custom' && customDateRange.start && customDateRange.end) {
        interval = { start: startOfDay(customDateRange.start), end: endOfDay(customDateRange.end) };
      }

      if (interval) {
        filtered = filtered.filter(e => isWithinInterval(parseISO(e.date), interval));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(e => {
        const expenseCategories = categories.filter(c => e.categoryIds?.includes(c.id));
        const categoryNames = expenseCategories.map(c => c.name).join(' ').toLowerCase();
        
        return e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
               categoryNames.includes(searchQuery.toLowerCase());
      });
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedCategory, selectedPeriod, searchQuery, customDateRange]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calendar Logic
  const handleDayPress = (day: Date) => {
    if (!customDateRange.start || (customDateRange.start && customDateRange.end)) {
      setCustomDateRange({ start: day, end: null });
    } else {
      // Ensure start is before end
      if (day < customDateRange.start) {
        setCustomDateRange({ start: day, end: customDateRange.start });
      } else {
        setCustomDateRange({ ...customDateRange, end: day });
      }
    }
  };
  
  const handleDelete = async (id: string) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await removeExpense(expenseToDelete);
      showSuccess('Gasto eliminado correctamente');
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    } catch (error) {
      showError('Error al eliminar el gasto');
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    }
  };

  const handleEdit = (expenseId: string) => {
    navigation.navigate('AddExpense', { expenseId });
  };

  const renderCalendar = () => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: startOfWeek(start, { weekStartsOn: 1 }), end: endOfWeek(end, { weekStartsOn: 1 }) });
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
            <Ionicons name="chevron-back" size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{format(calendarMonth, 'MMMM yyyy', { locale: es })}</Text>
          <TouchableOpacity onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
            <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            const isSelected = (customDateRange.start && isSameDay(day, customDateRange.start)) || 
                               (customDateRange.end && isSameDay(day, customDateRange.end));
            const isInRange = customDateRange.start && customDateRange.end && 
                              isWithinInterval(day, { start: customDateRange.start, end: customDateRange.end });
            const isCurrentMonth = isSameMonth(day, calendarMonth);

            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isInRange && !isSelected && styles.dayCellInRange,
                  !isCurrentMonth && styles.dayCellOutside
                ]}
                onPress={() => handleDayPress(day)}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  !isCurrentMonth && styles.dayTextOutside
                ]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calendarFooter}>
          <TouchableOpacity 
            style={[styles.calendarButton, styles.cancelButton]} 
            onPress={() => {
              setIsCalendarVisible(false);
              if (!customDateRange.start || !customDateRange.end) {
                setSelectedPeriod('all'); // Revert if cancelled without selection
              }
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.calendarButton, styles.applyButton, (!customDateRange.start || !customDateRange.end) && { opacity: 0.5 }]} 
            onPress={() => {
              if (customDateRange.start && customDateRange.end) {
                setIsCalendarVisible(false);
              }
            }}
            disabled={!customDateRange.start || !customDateRange.end}
          >
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      padding: 16,
      backgroundColor: currentTheme.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      paddingBottom: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: currentTheme.text,
      fontSize: 15,
    },
    filterSection: {
      marginBottom: 12,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: currentTheme.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: currentTheme.background,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    filterChipActive: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    filterChipText: {
      fontSize: 13,
      color: currentTheme.text,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    compactSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: currentTheme.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    summaryLabel: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    summaryAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    listContainer: {
      padding: 16,
      paddingTop: 12,
    },
    expenseItem: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
      overflow: 'visible',
      position: 'relative',
    },
    expenseItemContent: {
      flexDirection: 'row',
      padding: 12,
      alignItems: 'center',
    },
    deleteButtonContainer: {
      position: 'absolute',
      top: -4,
      right: 0,
      zIndex: 10,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    expenseDetails: {
      flex: 1,
    },
    expenseDescription: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 2,
    },
    expenseCategory: {
      fontSize: 12,
      color: currentTheme.textSecondary,
    },
    rightColumn: {
      alignItems: 'flex-end',
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: currentTheme.error,
    },
    expenseDate: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 4,
    },
    deleteButton: {
      width: 22,
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyStateIcon: {
      marginBottom: 16,
      opacity: 0.3,
    },
    emptyStateText: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: 'center',
    },
    // Calendar Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    calendarContainer: {
      width: '90%',
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    calendarTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      textTransform: 'capitalize',
    },
    weekDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    weekDayText: {
      width: 40,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.textSecondary,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    dayCell: {
      width: '14.28%', // 100% / 7
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 2,
      borderRadius: 20,
    },
    dayCellSelected: {
      backgroundColor: currentTheme.primary,
    },
    dayCellInRange: {
      backgroundColor: currentTheme.primary + '40', // 40% opacity
      borderRadius: 0,
    },
    dayCellOutside: {
      opacity: 0.3,
    },
    dayText: {
      fontSize: 14,
      color: currentTheme.text,
    },
    dayTextSelected: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    dayTextOutside: {
      color: currentTheme.textSecondary,
    },
    calendarFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      gap: 12,
    },
    calendarButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: 'transparent',
    },
    applyButton: {
      backgroundColor: currentTheme.primary,
    },
    cancelButtonText: {
      color: currentTheme.textSecondary,
      fontWeight: '600',
    },
    applyButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    deleteModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
      alignItems: 'center',
    },
    deleteModalIcon: {
      marginBottom: 16,
    },
    deleteModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    deleteModalMessage: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    deleteModalButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    deleteModalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteModalButtonCancel: {
      backgroundColor: currentTheme.surface,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    deleteModalButtonConfirm: {
      backgroundColor: currentTheme.error,
    },
    deleteModalButtonCancelText: {
      color: currentTheme.text,
      fontWeight: '600',
      fontSize: 16,
    },
    deleteModalButtonConfirmText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  const periodFilters: { value: FilterPeriod; label: string }[] = [
    { value: 'all', label: 'Todo' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'custom', label: 'Calendario' },
  ];

  const categoryFilters = [
    { value: 'all', label: 'Todas' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];

  const handlePeriodSelect = (period: FilterPeriod) => {
    if (period === 'custom') {
      setIsCalendarVisible(true);
    } else {
      setCustomDateRange({ start: null, end: null });
    }
    setSelectedPeriod(period);
  };

  return (
    <View style={styles.container}>
      {/* Header with Filters */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={currentTheme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar gastos..."
            placeholderTextColor={currentTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Period Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Período</Text>
          <View style={styles.filterRow}>
            {periodFilters.map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterChip,
                  selectedPeriod === filter.value && styles.filterChipActive,
                ]}
                onPress={() => handlePeriodSelect(filter.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPeriod === filter.value && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {categoryFilters.map(filter => {
                const category = categories.find(c => c.id === filter.value);
                return (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.filterChip,
                      selectedCategory === filter.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(filter.value)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {category && (
                        <Ionicons
                          name={category.icon as any}
                          size={14}
                          color={selectedCategory === filter.value ? '#FFFFFF' : category.color}
                        />
                      )}
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategory === filter.value && styles.filterChipTextActive,
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Compact Summary Bar */}
      <View style={styles.compactSummary}>
        <Text style={styles.summaryLabel}>
          {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto encontrado' : 'gastos encontrados'}
        </Text>
        <Text style={styles.summaryAmount}>${formatCurrencyDisplay(totalFiltered)}</Text>
      </View>

      {/* Expense List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={currentTheme.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No se encontraron gastos' : 'No hay gastos para mostrar'}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => {
            const primaryCatId = expense.categoryIds?.[0];
            const category = categories.find(c => c.id === primaryCatId) || {
              name: 'Desconocido',
              icon: 'pricetag',
              color: currentTheme.textSecondary,
            };
            
            // Get all category names
            const categoryNames = expense.categoryIds
              ?.map(id => categories.find(c => c.id === id)?.name)
              .filter(Boolean)
              .join(', ');

            return (
              <View key={expense.id} style={styles.expenseItem}>
                <TouchableOpacity 
                  style={styles.expenseItemContent}
                  onPress={() => handleEdit(expense.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: (category.color || '#999') + '20' }]}>
                    <Ionicons name={category.icon as any} size={18} color={category.color} />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={[styles.expenseCategory, { marginTop: 4 }]} numberOfLines={1}>
                      {categoryNames || category.name}
                    </Text>
                  </View>
                  <View style={styles.rightColumn}>
                    <Text style={styles.expenseAmount}>-${formatCurrencyDisplay(expense.amount)}</Text>
                    <Text style={styles.expenseDate}>
                      {format(parseISO(expense.date), 'd MMM yyyy', { locale: es })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.deleteButtonContainer}>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(expense.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color={currentTheme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {renderCalendar()}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setExpenseToDelete(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowDeleteModal(false);
          setExpenseToDelete(null);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.deleteModalContent}>
                <View style={styles.deleteModalIcon}>
                  <Ionicons name="alert-circle" size={48} color={currentTheme.error} />
                </View>
                <Text style={styles.deleteModalTitle}>Eliminar Gasto</Text>
                <Text style={styles.deleteModalMessage}>
                  ¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.
                </Text>
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                    onPress={() => {
                      setShowDeleteModal(false);
                      setExpenseToDelete(null);
                    }}
                  >
                    <Text style={styles.deleteModalButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                    onPress={confirmDelete}
                  >
                    <Text style={styles.deleteModalButtonConfirmText}>Eliminar</Text>
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
