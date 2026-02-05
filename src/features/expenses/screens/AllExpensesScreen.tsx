import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, createCommonStyles } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency';
import { useToast } from '../../../shared/hooks/useToast';
import { ActivityListSkeleton } from '../../../shared/components/Skeleton';
import { SwipeableRow } from '../../../shared/components/SwipeableRow';
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
  const { getCurrentExpenses, categories, preferences, removeExpense, expenses: allExpenses, loadExpenses } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const expenses = getCurrentExpenses();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const common = createCommonStyles(currentTheme);
  const { showSuccess, showError } = useToast();

  const [refreshing, setRefreshing] = useState(false);

  // Load expenses if not already loaded
  useEffect(() => {
    const init = async () => {
      if (allExpenses.length === 0) {
        await loadExpenses();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }, []);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all');
  const [selectedFinancialTypes, setSelectedFinancialTypes] = useState<string[]>([]);
  const [selectedExpenseType, setSelectedExpenseType] = useState<'all' | 'fixed' | 'variable'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const ITEMS_PER_PAGE = 50;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Category filter search and expand
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [showAllCategoryFilters, setShowAllCategoryFilters] = useState(false);
  const INITIAL_CATEGORY_FILTER_COUNT = 8;

  // Custom Date Range State
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Filters Modal
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Filter expenses based on selected filters
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by categories (multiple selection)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(e =>
        e.categoryIds && e.categoryIds.some(catId => selectedCategories.includes(catId))
      );
    }

    // Filter by financial types (multiple selection)
    if (selectedFinancialTypes.length > 0) {
      filtered = filtered.filter(e => selectedFinancialTypes.includes(e.financialType || 'unclassified'));
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

    // Filter by expense type (fixed vs variable)
    if (selectedExpenseType !== 'all') {
      if (selectedExpenseType === 'fixed') {
        // Fixed expenses have serviceId (linked to recurring services)
        filtered = filtered.filter(e => e.serviceId);
      } else {
        // Variable expenses don't have serviceId
        filtered = filtered.filter(e => !e.serviceId);
      }
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedCategories, selectedFinancialTypes, selectedPeriod, searchQuery, customDateRange, categories, selectedExpenseType]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedPeriod !== 'all') count++;
    if (selectedFinancialTypes.length > 0) count += selectedFinancialTypes.length;
    if (selectedExpenseType !== 'all') count++;
    return count;
  }, [selectedCategories, selectedPeriod, selectedFinancialTypes, selectedExpenseType]);

  // Check if any filter is active (to decide pagination behavior)
  const hasActiveFilters = activeFiltersCount > 0 || searchQuery.trim().length > 0;

  // Paginated expenses - show all when filters are active, otherwise paginate
  const displayedExpenses = useMemo(() => {
    if (hasActiveFilters) {
      return filteredExpenses; // Show all when filters are applied
    }
    return filteredExpenses.slice(0, visibleCount);
  }, [filteredExpenses, visibleCount, hasActiveFilters]);

  const hasMoreExpenses = !hasActiveFilters && filteredExpenses.length > visibleCount;

  const loadMoreExpenses = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPeriod('all');
    setSelectedFinancialTypes([]);
    setSelectedExpenseType('all');
    setCustomDateRange({ start: null, end: null });
    setVisibleCount(ITEMS_PER_PAGE);
    setCategoryFilterSearch('');
    setShowAllCategoryFilters(false);
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle financial type selection
  const toggleFinancialType = (type: string) => {
    setSelectedFinancialTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

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

  // Detectar si el gasto a eliminar es parte de un grupo de cuotas
  const getInstallmentInfo = () => {
    if (!expenseToDelete) return null;
    const expense = allExpenses.find(e => e.id === expenseToDelete);
    if (!expense) return null;

    if (expense.parentExpenseId) {
      // Es cuota hija - contar hermanas
      const siblings = allExpenses.filter(e => e.parentExpenseId === expense.parentExpenseId);
      return { isInstallment: true, count: siblings.length, description: expense.description };
    } else if (expense.isParent) {
      // Es padre - contar hijas
      const children = allExpenses.filter(e => e.parentExpenseId === expense.id);
      return { isInstallment: true, count: children.length, description: expense.description };
    }
    return null;
  };

  const installmentInfo = getInstallmentInfo();

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await removeExpense(expenseToDelete);
      showSuccess(installmentInfo
        ? `${installmentInfo.count} cuotas eliminadas correctamente`
        : 'Gasto eliminado correctamente'
      );
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
          <Text style={[typography.sectionTitle, { color: currentTheme.text, textTransform: 'capitalize' }]}>
            {format(calendarMonth, 'MMMM yyyy', { locale: es })}
          </Text>
          <TouchableOpacity onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
            <Ionicons name="chevron-forward" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[typography.bodyBold, { width: 40, textAlign: 'center', color: currentTheme.textSecondary }]}>{day}</Text>
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
                  typography.body,
                  { color: isSelected ? '#FFFFFF' : isCurrentMonth ? currentTheme.text : currentTheme.textSecondary },
                  isSelected && { fontWeight: 'bold' }
                ]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calendarFooter}>
          <TouchableOpacity
            style={{ padding: spacing.sm }}
            onPress={() => {
              setIsCalendarVisible(false);
              if (!customDateRange.start || !customDateRange.end) {
                setSelectedPeriod('all'); // Revert if cancelled without selection
              }
            }}
          >
            <Text style={[typography.bodyBold, { color: currentTheme.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, (!customDateRange.start || !customDateRange.end) && { opacity: 0.5 }]}
            onPress={() => {
              if (customDateRange.start && customDateRange.end) {
                setIsCalendarVisible(false);
              }
            }}
            disabled={!customDateRange.start || !customDateRange.end}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Aplicar</Text>
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
      padding: spacing.lg,
      backgroundColor: currentTheme.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
      paddingBottom: spacing.md,
    },
    filterButtonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.background,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      gap: spacing.sm,
    },
    filterButtonActive: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
    },
    filterBadge: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearFiltersButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.background,
    },
    activeFiltersSummary: {
      marginTop: spacing.md,
      maxHeight: 80,
    },
    activeFiltersSummaryContent: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    activeFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: currentTheme.background,
      borderWidth: 1.5,
      borderColor: currentTheme.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      height: 44,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: currentTheme.background,
      borderWidth: 1.5,
      borderColor: currentTheme.border,
      minHeight: 42,
      justifyContent: 'center',
    },
    filterChipActive: {
      backgroundColor: currentTheme.primary,
      borderColor: currentTheme.primary,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    compactSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: currentTheme.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    listContainer: {
      padding: 2,
      paddingTop: spacing.md,
    },
    expenseItem: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
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
      padding: spacing.md,
      alignItems: 'center',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    expenseDetails: {
      flex: 1,
    },
    rightColumn: {
      alignItems: 'flex-end',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxxl,
    },
    // Calendar Styles
    calendarContainer: {
      width: '90%',
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
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
      marginBottom: spacing.lg,
    },
    weekDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
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
    calendarFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    applyButton: {
      backgroundColor: currentTheme.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: spacing.sm,
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
    },
    deleteModalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
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
    filtersModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      maxHeight: '80%',
      width: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 10,
    },
    filtersModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    filtersModalBody: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    modalFilterSection: {
      marginBottom: spacing.xxl,
    },
    modalFilterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    filtersModalFooter: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
    },
    clearAllFiltersButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      backgroundColor: currentTheme.background,
      alignItems: 'center',
    },
    applyFiltersButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: currentTheme.primary,
      alignItems: 'center',
    },
  });

  const periodFilters: { value: FilterPeriod; label: string }[] = [
    { value: 'all', label: 'Todo' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'custom', label: 'Calendario' },
  ];

  const expenseTypeFilters: { value: 'all' | 'fixed' | 'variable'; label: string; icon: string }[] = [
    { value: 'all', label: 'Todos', icon: 'apps' },
    { value: 'fixed', label: 'Fijos', icon: 'flash' },
    { value: 'variable', label: 'Variables', icon: 'shuffle' },
  ];

  const categoryFilters = [
    { value: 'all', label: 'Todas' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ];

  const financialTypeFilters = [
    { value: 'all', label: 'Todos', icon: 'apps' },
    { value: 'needs', label: 'Necesidades', icon: 'nutrition' },
    { value: 'wants', label: 'Deseos', icon: 'heart' },
    { value: 'savings', label: 'Ahorros', icon: 'wallet' },
    { value: 'unclassified', label: 'Sin clasificar', icon: 'help-circle' },
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
      {/* Header with Search and Filter Button */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={currentTheme.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={[typography.body, { flex: 1, color: currentTheme.text }]}
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

        {/* Filter Button */}
        <View style={styles.filterButtonRow}>
          <TouchableOpacity
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFiltersCount > 0 ? '#FFFFFF' : currentTheme.text}
            />
            <Text style={[typography.bodyBold, { color: activeFiltersCount > 0 ? '#FFFFFF' : currentTheme.text }]}>
              Filtros
            </Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={[typography.small, { color: currentTheme.primary, fontWeight: '700' }]}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {activeFiltersCount > 0 && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
              <Text style={[typography.bodyBold, { color: currentTheme.textSecondary }]}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersSummary}
            contentContainerStyle={styles.activeFiltersSummaryContent}
          >
            {selectedPeriod !== 'all' && (
              <View style={[styles.activeFilterChip, { backgroundColor: currentTheme.primary + '15', borderColor: currentTheme.primary }]}>
                <Ionicons name="calendar-outline" size={14} color={currentTheme.primary} />
                <Text style={[typography.caption, { color: currentTheme.primary, fontWeight: '600' }]}>
                  {periodFilters.find(f => f.value === selectedPeriod)?.label}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedPeriod('all'); setCustomDateRange({ start: null, end: null }); }}>
                  <Ionicons name="close-circle" size={16} color={currentTheme.primary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedExpenseType !== 'all' && (
              <View style={[styles.activeFilterChip, { backgroundColor: '#4CAF50' + '15', borderColor: '#4CAF50' }]}>
                <Ionicons name={selectedExpenseType === 'fixed' ? 'flash' : 'shuffle'} size={14} color="#4CAF50" />
                <Text style={[typography.caption, { color: '#4CAF50', fontWeight: '600' }]}>
                  {selectedExpenseType === 'fixed' ? 'Fijos' : 'Variables'}
                </Text>
                <TouchableOpacity onPress={() => setSelectedExpenseType('all')}>
                  <Ionicons name="close-circle" size={16} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            )}
            {selectedFinancialTypes.map(type => {
              const typeFilter = financialTypeFilters.find(f => f.value === type);
              return (
                <View key={type} style={[styles.activeFilterChip, { backgroundColor: '#FF9800' + '15', borderColor: '#FF9800' }]}>
                  <Ionicons name={typeFilter?.icon as any} size={14} color="#FF9800" />
                  <Text style={[typography.caption, { color: '#FF9800', fontWeight: '600' }]}>
                    {typeFilter?.label}
                  </Text>
                  <TouchableOpacity onPress={() => toggleFinancialType(type)}>
                    <Ionicons name="close-circle" size={16} color="#FF9800" />
                  </TouchableOpacity>
                </View>
              );
            })}
            {selectedCategories.map(catId => {
              const category = categories.find(c => c.id === catId);
              if (!category) return null;
              return (
                <View key={catId} style={[styles.activeFilterChip, { backgroundColor: category.color + '15', borderColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={14} color={category.color} />
                  <Text style={[typography.caption, { color: category.color, fontWeight: '600' }]}>
                    {category.name}
                  </Text>
                  <TouchableOpacity onPress={() => toggleCategory(catId)}>
                    <Ionicons name="close-circle" size={16} color={category.color} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Compact Summary Bar */}
      <View style={styles.compactSummary}>
        <Text style={[typography.body, { color: currentTheme.textSecondary }]}>
          {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto encontrado' : 'gastos encontrados'}
        </Text>
        <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>${formatCurrencyDisplay(totalFiltered)}</Text>
      </View>

      {/* Expense List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          <ActivityListSkeleton isDark={isDark} count={5} />
        </View>
      ) : (
        <FlatList
          data={displayedExpenses}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[currentTheme.primary]}
              tintColor={currentTheme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={currentTheme.textSecondary}
                style={{ marginBottom: spacing.lg, opacity: 0.3 }}
              />
              <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
                {searchQuery ? 'No se encontraron gastos' : 'No hay gastos para mostrar'}
              </Text>
            </View>
          }
          renderItem={({ item: expense }) => {
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
              <SwipeableRow
                onDelete={() => handleDelete(expense.id)}
                backgroundColor={currentTheme.error}
              >
                <View style={styles.expenseItem}>
                  <TouchableOpacity
                    style={styles.expenseItemContent}
                    onPress={() => handleEdit(expense.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: (category.color || '#999') + '20' }]}>
                      <Ionicons name={category.icon as any} size={18} color={category.color} />
                    </View>
                    <View style={styles.expenseDetails}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: 2 }]}>{expense.description}</Text>
                      <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.xs }]} numberOfLines={1}>
                        {categoryNames || category.name}
                      </Text>
                    </View>
                    <View style={styles.rightColumn}>
                      <Text style={[typography.bodyBold, { color: currentTheme.error }]}>-${formatCurrencyDisplay(expense.amount)}</Text>
                      <Text style={[typography.caption, { color: currentTheme.textSecondary, marginTop: spacing.xs }]}>
                        {format(parseISO(expense.date), 'd MMM yyyy', { locale: es })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </SwipeableRow>
            );
          }}
          ListFooterComponent={
            hasMoreExpenses ? (
              <TouchableOpacity
                style={{
                  paddingVertical: spacing.lg,
                  alignItems: 'center',
                  backgroundColor: currentTheme.card,
                  borderRadius: borderRadius.md,
                  marginVertical: spacing.sm,
                  marginHorizontal: spacing.sm,
                }}
                onPress={loadMoreExpenses}
              >
                <Text style={[typography.bodyBold, { color: currentTheme.primary }]}>
                  Cargar más ({filteredExpenses.length - visibleCount} restantes)
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={common.modalOverlay}>
          {renderCalendar()}
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFiltersModal(false)}>
          <View style={[common.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.filtersModalContent}>
                <View style={styles.filtersModalHeader}>
                  <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>Filtros</Text>
                  <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                    <Ionicons name="close" size={24} color={currentTheme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.filtersModalBody}>
                  {/* Period Filter */}
                  <View style={styles.modalFilterSection}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.md }]}>Período</Text>
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
                              typography.bodyBold,
                              { color: selectedPeriod === filter.value ? '#FFFFFF' : currentTheme.text },
                            ]}
                          >
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Expense Type Filter (Fixed vs Variable) */}
                  <View style={styles.modalFilterSection}>
                    <Text style={[typography.bodyBold, { color: currentTheme.text, marginBottom: spacing.md }]}>Tipo</Text>
                    <View style={styles.filterRow}>
                      {expenseTypeFilters.map(filter => {
                        const isSelected = selectedExpenseType === filter.value;
                        return (
                          <TouchableOpacity
                            key={filter.value}
                            style={[
                              styles.filterChip,
                              isSelected && styles.filterChipActive,
                            ]}
                            onPress={() => setSelectedExpenseType(filter.value)}
                          >
                            <View style={[common.row, { gap: spacing.xs }]}>
                              <Ionicons
                                name={filter.icon as any}
                                size={16}
                                color={isSelected ? '#FFFFFF' : currentTheme.text}
                              />
                              <Text
                                style={[
                                  typography.bodyBold,
                                  { color: isSelected ? '#FFFFFF' : currentTheme.text },
                                ]}
                              >
                                {filter.label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Financial Type Filter */}
                  <View style={styles.modalFilterSection}>
                    <View style={styles.modalFilterHeader}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Clasificación</Text>
                      {selectedFinancialTypes.length > 0 && (
                        <Text style={[typography.caption, { color: currentTheme.primary, fontWeight: '600' }]}>
                          {selectedFinancialTypes.length} seleccionado{selectedFinancialTypes.length > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                    <View style={styles.filterRow}>
                      {financialTypeFilters.map(filter => {
                        const isSelected = selectedFinancialTypes.includes(filter.value);
                        return (
                          <TouchableOpacity
                            key={filter.value}
                            style={[
                              styles.filterChip,
                              isSelected && styles.filterChipActive,
                            ]}
                            onPress={() => toggleFinancialType(filter.value)}
                          >
                            <View style={[common.row, { gap: spacing.xs }]}>
                              <Ionicons
                                name={filter.icon as any}
                                size={16}
                                color={isSelected ? '#FFFFFF' : currentTheme.text}
                              />
                              <Text
                                style={[
                                  typography.bodyBold,
                                  { color: isSelected ? '#FFFFFF' : currentTheme.text },
                                ]}
                              >
                                {filter.label}
                              </Text>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Category Filter */}
                  <View style={styles.modalFilterSection}>
                    <View style={styles.modalFilterHeader}>
                      <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Categorías</Text>
                      {selectedCategories.length > 0 && (
                        <Text style={[typography.caption, { color: currentTheme.primary, fontWeight: '600' }]}>
                          {selectedCategories.length} seleccionada{selectedCategories.length > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>

                    {/* Category Search */}
                    {categories.length > INITIAL_CATEGORY_FILTER_COUNT && (
                      <View style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', backgroundColor: currentTheme.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: currentTheme.border, paddingHorizontal: spacing.md }}>
                        <Ionicons name="search" size={18} color={currentTheme.textSecondary} />
                        <TextInput
                          style={[typography.body, { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, color: currentTheme.text }]}
                          placeholder="Buscar categoría..."
                          placeholderTextColor={currentTheme.textSecondary}
                          value={categoryFilterSearch}
                          onChangeText={(text) => {
                            setCategoryFilterSearch(text);
                            if (text) setShowAllCategoryFilters(true);
                          }}
                        />
                        {categoryFilterSearch.length > 0 && (
                          <TouchableOpacity onPress={() => setCategoryFilterSearch('')}>
                            <Ionicons name="close-circle" size={18} color={currentTheme.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    <View style={styles.filterRow}>
                      {(() => {
                        // Sort by usage count (most used first)
                        const sortedCategories = [...categories].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

                        // Filter by search
                        const filteredCats = categoryFilterSearch
                          ? sortedCategories.filter(c => c.name.toLowerCase().includes(categoryFilterSearch.toLowerCase()))
                          : sortedCategories;

                        // Limit displayed
                        const displayedCats = showAllCategoryFilters || categoryFilterSearch
                          ? filteredCats
                          : filteredCats.slice(0, INITIAL_CATEGORY_FILTER_COUNT);

                        return (
                          <>
                            {displayedCats.map(category => {
                              const isSelected = selectedCategories.includes(category.id);
                              return (
                                <TouchableOpacity
                                  key={category.id}
                                  style={[
                                    styles.filterChip,
                                    isSelected && [styles.filterChipActive, { backgroundColor: category.color, borderColor: category.color }],
                                  ]}
                                  onPress={() => toggleCategory(category.id)}
                                >
                                  <View style={[common.row, { gap: spacing.xs }]}>
                                    <Ionicons
                                      name={category.icon as any}
                                      size={16}
                                      color={isSelected ? '#FFFFFF' : category.color}
                                    />
                                    <Text
                                      style={[
                                        typography.bodyBold,
                                        { color: isSelected ? '#FFFFFF' : currentTheme.text },
                                      ]}
                                    >
                                      {category.name}
                                    </Text>
                                    {isSelected && (
                                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}

                            {/* Show more/less button */}
                            {!categoryFilterSearch && categories.length > INITIAL_CATEGORY_FILTER_COUNT && (
                              <TouchableOpacity
                                style={[styles.filterChip, { backgroundColor: currentTheme.background }]}
                                onPress={() => setShowAllCategoryFilters(!showAllCategoryFilters)}
                              >
                                <View style={[common.row, { gap: spacing.xs }]}>
                                  <Ionicons
                                    name={showAllCategoryFilters ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={currentTheme.textSecondary}
                                  />
                                  <Text style={[typography.bodyBold, { color: currentTheme.textSecondary }]}>
                                    {showAllCategoryFilters ? 'Menos' : `+${categories.length - INITIAL_CATEGORY_FILTER_COUNT}`}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            )}

                            {/* No results message */}
                            {categoryFilterSearch && displayedCats.length === 0 && (
                              <Text style={[typography.caption, { color: currentTheme.textSecondary, fontStyle: 'italic' }]}>
                                No se encontraron categorías con "{categoryFilterSearch}"
                              </Text>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.filtersModalFooter}>
                  <TouchableOpacity
                    style={styles.clearAllFiltersButton}
                    onPress={() => {
                      clearAllFilters();
                      setShowFiltersModal(false);
                    }}
                  >
                    <Text style={[typography.bodyBold, { color: currentTheme.textSecondary }]}>Limpiar Todo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyFiltersButton}
                    onPress={() => setShowFiltersModal(false)}
                  >
                    <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
          <View style={common.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.deleteModalContent}>
                <View style={{ marginBottom: spacing.lg }}>
                  <Ionicons name="alert-circle" size={48} color={currentTheme.error} />
                </View>
                <Text style={[typography.sectionTitle, { color: currentTheme.text, marginBottom: spacing.md, textAlign: 'center' }]}>
                  {installmentInfo ? 'Eliminar Cuotas' : 'Eliminar Gasto'}
                </Text>
                <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 20 }]}>
                  {installmentInfo
                    ? `Este gasto tiene ${installmentInfo.count} cuotas. Se eliminarán TODAS las cuotas de "${installmentInfo.description}". Esta acción no se puede deshacer.`
                    : '¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.'
                  }
                </Text>
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteModalButtonCancel]}
                    onPress={() => {
                      setShowDeleteModal(false);
                      setExpenseToDelete(null);
                    }}
                  >
                    <Text style={[typography.bodyBold, { color: currentTheme.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteModalButtonConfirm]}
                    onPress={confirmDelete}
                  >
                    <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
                      {installmentInfo ? `Eliminar ${installmentInfo.count} cuotas` : 'Eliminar'}
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
