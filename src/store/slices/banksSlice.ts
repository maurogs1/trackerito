import { StateCreator } from 'zustand';
import { Bank } from '../../features/expenses/types';
import { supabase } from '../../services/supabase';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface BanksSlice {
  banks: Bank[];
  isLoadingBanks: boolean;
  error: string | null;
  loadBanks: () => Promise<void>;
  addBank: (name: string) => Promise<Bank | null>;
  deleteBank: (id: string) => Promise<void>;
}

export const createBanksSlice: StateCreator<BanksSlice> = (set, get) => ({
  banks: [],
  isLoadingBanks: false,
  error: null,

  loadBanks: async () => {
    set({ isLoadingBanks: true, error: null });
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ banks: data || [], error: null });
    } catch (error) {
      logError(error, 'loadBanks');
      const errorMessage = getUserFriendlyMessage(error, 'load');
      set({ error: errorMessage });
    } finally {
      set({ isLoadingBanks: false });
    }
  },

  addBank: async (name) => {
    set({ error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('banks')
        .insert({
          user_id: user.id,
          name
        })
        .select()
        .single();

      if (error) throw error;

      const newBank: Bank = {
        id: data.id,
        name: data.name
      };

      set(state => ({ banks: [...state.banks, newBank], error: null }));
      return newBank;
    } catch (error) {
      logError(error, 'addBank');
      const errorMessage = getUserFriendlyMessage(error, 'bank');
      set({ error: errorMessage });
      return null;
    }
  },

  deleteBank: async (id) => {
    set({ error: null });
    try {
      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        banks: state.banks.filter(b => b.id !== id),
        error: null
      }));
    } catch (error) {
      logError(error, 'deleteBank');
      const errorMessage = getUserFriendlyMessage(error, 'delete');
      set({ error: errorMessage });
    }
  }
});
