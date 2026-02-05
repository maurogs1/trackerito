import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all slices
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createPreferencesSlice, PreferencesSlice } from './slices/preferencesSlice';
import { createExpensesSlice, ExpensesSlice } from './slices/expensesSlice';
import { createCategoriesSlice, CategoriesSlice } from './slices/categoriesSlice';
import { createBenefitsSlice, BenefitsSlice } from './slices/benefitsSlice';
import { createDebtsSlice, DebtsSlice } from './slices/debtsSlice';
import { createBanksSlice, BanksSlice } from './slices/banksSlice';
import { createRecurringServicesSlice, RecurringServicesSlice } from './slices/recurringServicesSlice';
import { createIncomeSlice, IncomeSlice } from './slices/incomeSlice';
import { createPaymentGroupsSlice, PaymentGroupsSlice } from './slices/paymentGroupsSlice';
import { createUserProfileSlice, UserProfileSlice } from './slices/userProfileSlice';

// Combined store type
export type StoreState = AuthSlice &
  PreferencesSlice &
  ExpensesSlice &
  CategoriesSlice &
  BenefitsSlice &
  DebtsSlice &
  BanksSlice &
  RecurringServicesSlice &
  IncomeSlice &
  PaymentGroupsSlice &
  UserProfileSlice;

// Create the combined store
export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createPreferencesSlice(...a),
      ...createExpensesSlice(...a),
      ...createCategoriesSlice(...a),
      ...createBenefitsSlice(...a),
      ...createDebtsSlice(...a),
      ...createBanksSlice(...a),
      ...createRecurringServicesSlice(...a),
      ...createIncomeSlice(...a),
      ...createPaymentGroupsSlice(...a),
      ...createUserProfileSlice(...a),
    }),
    {
      name: 'trackerito-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        expenses: state.expenses,
        categories: state.categories,
        userBanks: state.userBanks,
        debts: state.debts,
        banks: state.banks,
        recurringServices: state.recurringServices,
        servicePayments: state.servicePayments,
        incomes: state.incomes,
        preferences: state.preferences,
        paymentGroups: state.paymentGroups,
        userProfile: state.userProfile,
      }),
    }
  )
);

// NOTE: Data is loaded lazily when entering each screen
// Only essential data (expenses, categories) is loaded after login
// See LoginScreen.tsx for initial data loading
