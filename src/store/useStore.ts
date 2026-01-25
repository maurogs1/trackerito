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
import { createDebtsSlice, DebtsSlice } from './slices/debtsSlice';
import { createBanksSlice, BanksSlice } from './slices/banksSlice';
import { createCreditCardsSlice, CreditCardsSlice } from './slices/creditCardsSlice';
import { createRecurringServicesSlice, RecurringServicesSlice } from './slices/recurringServicesSlice';
import { createIncomeSlice, IncomeSlice } from './slices/incomeSlice';

// Combined store type
export type StoreState = AuthSlice &
  PreferencesSlice &
  ExpensesSlice &
  GoalsSlice &
  CategoriesSlice &
  BudgetsSlice &
  BenefitsSlice &
  InvestmentsSlice &
  DebtsSlice &
  BanksSlice &
  CreditCardsSlice &
  RecurringServicesSlice &
  IncomeSlice;

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
      ...createDebtsSlice(...a),
      ...createBanksSlice(...a),
      ...createCreditCardsSlice(...a),
      ...createRecurringServicesSlice(...a),
      ...createIncomeSlice(...a),
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
        debts: state.debts,
        banks: state.banks,
        creditCards: state.creditCards,
        creditCardPurchases: state.creditCardPurchases,
        recurringServices: state.recurringServices,
        servicePayments: state.servicePayments,
        incomes: state.incomes,
        preferences: state.preferences,
      }),
    }
  )
);

// NOTE: Data is loaded lazily when entering each screen
// Only essential data (expenses, categories) is loaded after login
// See LoginScreen.tsx for initial data loading
