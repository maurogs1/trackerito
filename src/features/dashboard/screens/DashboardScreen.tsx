import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyDisplay } from '../../../shared/utils/currency'; // Fixed import
import { BENEFITS, BANKS, formatBenefitDays } from '../../benefits/mockBenefits';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const { width } = Dimensions.get('window');
const GRID_GAP = 16;
const GRID_ITEM_WIDTH = (width - 32 - GRID_GAP) / 2 - 1; // Subtract 1px to avoid rounding issues

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { expenses, loadExpenses, getSummary, preferences, user, goals, categories, getBudgetProgress, userBanks } = useStore();
  const summary = getSummary();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    loadExpenses();
  }, []);

  const topCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    
    expenses.forEach(e => {
      if (new Date(e.date).getMonth() === currentMonth) {
         categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
      }
    });
    
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    
    const categoryId = sorted[0][0];
    const category = categories.find(c => c.id === categoryId);
    
    return { 
      name: category?.name || 'Desconocido', 
      amount: sorted[0][1],
      icon: category?.icon || 'pricetag',
      color: category?.color || currentTheme.text
    };
  }, [expenses, categories]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 8,
    },
    greeting: {
      fontSize: 16,
      color: currentTheme.textSecondary,
    },
    username: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: currentTheme.primary,
    },
    mainCard: {
      backgroundColor: currentTheme.primary,
      padding: 24,
      borderRadius: 24,
      marginBottom: 24,
      alignItems: 'center',
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    balanceLabel: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    gridItem: {
      width: GRID_ITEM_WIDTH,
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    gridLabel: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginTop: 8,
    },
    gridValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    seeAll: {
      color: currentTheme.primary,
      fontWeight: '600',
    },
    expenseItem: {
      backgroundColor: currentTheme.card,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
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
    expenseCategory: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginBottom: 2,
    },
    expenseDescription: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: currentTheme.error,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      backgroundColor: currentTheme.primary,
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    budgetCard: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    budgetName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
    },
    budgetAmount: {
      fontSize: 14,
      color: currentTheme.textSecondary,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: currentTheme.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    card: {
      width: GRID_ITEM_WIDTH,
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginTop: 8,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      textAlign: 'center',
    },
    carouselCard: {
      width: 130,
      height: 120,
      borderRadius: 16,
      padding: 12,
      justifyContent: 'space-between',
      backgroundColor: currentTheme.card,
      borderWidth: 1,
      borderColor: currentTheme.border,
      marginRight: 4,
    },
    carouselIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    carouselTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginTop: 8,
    },
    carouselSubtitle: {
      fontSize: 10,
      color: currentTheme.textSecondary,
    },
    benefitCard: {
      width: 200,
      backgroundColor: currentTheme.card,
      padding: 12,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    benefitBank: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    benefitDiscount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: currentTheme.success,
    },
    benefitDesc: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 4,
    },
    benefitCategory: {
      fontSize: 10,
      color: currentTheme.textSecondary,
      textTransform: 'uppercase',
    },
    emptyBenefits: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: currentTheme.card,
      borderRadius: 12,
    },
    emptyBenefitsText: {
      color: currentTheme.textSecondary,
      marginBottom: 8,
    },
    configureLink: {
      color: currentTheme.primary,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.username}>{user?.email?.split('@')[0] || 'Invitado'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Image 
              source={{ uri: user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}` : 'https://ui-avatars.com/api/?name=Invitado' }} 
              style={styles.avatar} 
            />
          </TouchableOpacity>
        </View>

        {/* Main Balance Card */}
        <View style={styles.mainCard}>
          <Text style={styles.balanceLabel}>Gastado este Mes</Text>
          <Text style={styles.balanceAmount}>${formatCurrencyDisplay(summary.totalBalance)}</Text>
        </View>

        {/* Insights Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Ionicons name="calendar-outline" size={24} color={currentTheme.primary} />
            <Text style={styles.gridLabel}>Promedio Semanal</Text>
            <Text style={styles.gridValue}>${formatCurrencyDisplay(summary.weeklyAverage)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="trending-up-outline" size={24} color={currentTheme.secondary} />
            <Text style={styles.gridLabel}>Proyección Mes</Text>
            <Text style={styles.gridValue}>${formatCurrencyDisplay(summary.projectedBalance)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name="time-outline" size={24} color={currentTheme.error} />
            <Text style={styles.gridLabel}>Mes Anterior</Text>
            <Text style={styles.gridValue}>${formatCurrencyDisplay(summary.previousMonthBalance)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Ionicons name={topCategory?.icon as any || "pricetag-outline"} size={24} color={topCategory?.color || currentTheme.text} />
            <Text style={styles.gridLabel}>Top Categoría</Text>
            <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit>
              {topCategory ? topCategory.name : '-'}
            </Text>
          </View>
        </View>

        {/* Feature Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu Hub Financiero</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingRight: 16, gap: 12 }}
          style={{ marginBottom: 24 }}
        >
          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => navigation.navigate('Budgets')}
          >
            <View style={[styles.carouselIcon, { backgroundColor: '#E91E63' }]}>
              <Ionicons name="wallet" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.carouselTitle}>Presupuestos</Text>
              <Text style={styles.carouselSubtitle}>Controla límites</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => navigation.navigate('Goals')}
          >
            <View style={[styles.carouselIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="flag" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.carouselTitle}>Metas</Text>
              <Text style={styles.carouselSubtitle}>Ahorra para algo</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => navigation.navigate('Investments')}
          >
            <View style={[styles.carouselIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="trending-up" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.carouselTitle}>Inversiones</Text>
              <Text style={styles.carouselSubtitle}>Haz crecer $$</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => navigation.navigate('Benefits')}
          >
            <View style={[styles.carouselIcon, { backgroundColor: '#009688' }]}>
              <Ionicons name="gift" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.carouselTitle}>Beneficios</Text>
              <Text style={styles.carouselSubtitle}>Descuentos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => navigation.navigate('FinancialEducation')}
          >
            <View style={[styles.carouselIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="school" size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.carouselTitle}>Educación</Text>
              <Text style={styles.carouselSubtitle}>Aprende más</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Daily Benefits Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Beneficios de Hoy</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Benefits')}>
            <Text style={styles.seeAll}>Configurar</Text>
          </TouchableOpacity>
        </View>
        
        {(() => {
           const today = new Date().getDay();
           const allDailyBenefits = BENEFITS.filter(b => b.days.includes(today));
           // If user has banks, filter by them. If not, show all.
           const displayedBenefits = userBanks.length > 0 
             ? allDailyBenefits.filter(b => userBanks.some(ub => ub.bankId === b.bankId))
             : allDailyBenefits;

           if (displayedBenefits.length === 0) {
             return (
               <View style={styles.emptyBenefits}>
                 <Text style={styles.emptyBenefitsText}>
                   {userBanks.length > 0 
                     ? "No hay beneficios hoy para tus bancos." 
                     : "No hay beneficios disponibles hoy."}
                 </Text>
                 <TouchableOpacity onPress={() => navigation.navigate('Benefits')}>
                   <Text style={styles.configureLink}>Configurar mis tarjetas</Text>
                 </TouchableOpacity>
               </View>
             );
           }

           return (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
               {displayedBenefits.slice(0, 5).map(benefit => {
                 const bank = BANKS.find(bk => bk.id === benefit.bankId);
                 if (!bank) return null;
                 return (
                   <View key={benefit.id} style={styles.benefitCard}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                       <Text style={[styles.benefitBank, { color: bank.color }]}>{bank.name}</Text>
                       <Text style={styles.benefitDiscount}>{benefit.discountPercentage}% OFF</Text>
                     </View>
                     <Text style={styles.benefitDesc}>{benefit.description}</Text>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                       <Text style={styles.benefitCategory}>{benefit.category}</Text>
                       <Text style={{ fontSize: 10, color: currentTheme.textSecondary }}>{formatBenefitDays(benefit.days)}</Text>
                     </View>
                   </View>
                 );
               })}
             </ScrollView>
           );
        })()}

        {/* Recent Expenses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllExpenses')}>
            <Text style={styles.seeAll}>Ver Todo</Text>
          </TouchableOpacity>
        </View>
        {expenses.slice(0, 5).map((expense) => {
          const category = categories.find(c => c.id === expense.categoryId) || { name: 'Desconocido', icon: 'pricetag', color: currentTheme.textSecondary };
          return (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconContainer, { backgroundColor: (category.color || '#999') + '20' }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <View>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseCategory}>{category.name}</Text>
                </View>
              </View>
              <Text style={styles.expenseAmount}>-${formatCurrencyDisplay(expense.amount)}</Text>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
