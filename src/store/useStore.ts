import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all slices
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createPreferencesSlice, PreferencesSlice } from './slices/preferencesSlice';
import { createExpensesSlice, ExpensesSlice } from './slices/expensesSlice';
import { createGoalsSlice, GoalsSlice } from './slices/goalsSlice';
import { createCategoriesSlice, CategoriesSlice } from './slices/categoriesSlice';
import { createBudgetsSlice, BudgetsSlice } from './slices/budgetsSlice';
import { createBenefitsSlice, BenefitsSlice } from './slices/benefitsSlice';
import { createInvestmentsSlice, InvestmentsSlice } from './slices/investmentsSlice';

// Combined store type
export type StoreState = AuthSlice & 
  PreferencesSlice & 
  ExpensesSlice & 
  GoalsSlice & 
  CategoriesSlice & 
  BudgetsSlice & 
  BenefitsSlice & 
  InvestmentsSlice;

// Create the combined store
export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createPreferencesSlice(...a),
      ...createExpensesSlice(...a),
      ...createGoalsSlice(...a),
      ...createCategoriesSlice(...a),
      ...createBudgetsSlice(...a),
      ...createBenefitsSlice(...a),
      ...createInvestmentsSlice(...a),
    }),
    {
      name: 'trackerito-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        expenses: state.expenses,
        categories: state.categories,
        goals: state.goals,
        budgets: state.budgets,
        userBanks: state.userBanks,
        investments: state.investments,
        preferences: state.preferences,
        isDemoMode: state.isDemoMode
      }),
    }
  )
);

// Initialize data on store creation
const initializeStore = async () => {
  const state = useStore.getState();
  
  console.log('Initializing store with demo mode:', state.isDemoMode);
  
  // Load data based on current mode
  await Promise.all([
    state.loadExpenses(),
    state.loadGoals(),
    state.loadCategories(),
    state.loadBudgets(),
    state.loadInvestments(),
  ]);
  
  console.log('Store initialized');
};

// Call initialization
initializeStore();
