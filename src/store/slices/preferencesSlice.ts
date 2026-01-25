import { StateCreator } from 'zustand';
import { UserPreferences } from '../../features/settings/types';

export interface PreferencesSlice {
  preferences: UserPreferences;
  toggleTheme: () => void;
  toggleHideFinancialData: () => void;
}

export const createPreferencesSlice: StateCreator<PreferencesSlice> = (set) => ({
  preferences: {
    theme: 'light',
    currency: '$',
    hideFinancialData: false,
  },

  toggleTheme: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        theme: state.preferences.theme === 'light' ? 'dark' : 'light',
      },
    }));
  },

  toggleHideFinancialData: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        hideFinancialData: !state.preferences.hideFinancialData,
      },
    }));
  },
});
