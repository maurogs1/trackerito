import { StateCreator } from 'zustand';
import { UserPreferences } from '../../features/settings/types';

export interface PreferencesSlice {
  preferences: UserPreferences;
  toggleTheme: () => void;
  toggleHideFinancialData: () => void; // DEPRECADO
  toggleHideIncome: () => void;
  toggleHideExpenses: () => void;
}

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (set) => ({
  preferences: {
    theme: 'light',
    currency: '$',
    hideFinancialData: false,
    hideIncome: false,
    hideExpenses: false,
  },

  toggleTheme: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        theme: state.preferences.theme === 'light' ? 'dark' : 'light',
      },
    }));
  },

  // DEPRECADO: mantener por compatibilidad
  toggleHideFinancialData: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        hideFinancialData: !state.preferences.hideFinancialData,
      },
    }));
  },

  toggleHideIncome: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        hideIncome: !state.preferences.hideIncome,
      },
    }));
  },

  toggleHideExpenses: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        hideExpenses: !state.preferences.hideExpenses,
      },
    }));
  },
});
