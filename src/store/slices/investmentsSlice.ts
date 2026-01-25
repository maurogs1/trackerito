import { StateCreator } from 'zustand';
import { Investment } from '../../features/investments/types';

export interface InvestmentsSlice {
  investments: Investment[];

  loadInvestments: () => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>;
  removeInvestment: (id: string) => Promise<void>;
}

export const createInvestmentsSlice: StateCreator<InvestmentsSlice> = (set, get) => ({
  investments: [],

  loadInvestments: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading investments from Supabase:', error);
        set({ investments: [] });
      } else {
        set({ investments: data || [] });
      }
    } catch (error) {
      console.error('Error in loadInvestments:', error);
      set({ investments: [] });
    }
  },

  addInvestment: async (investmentData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase.from('investments').insert([{
        name: investmentData.name,
        amount: investmentData.amount,
        type: investmentData.type,
        currency: investmentData.currency,
        date: investmentData.date,
        user_id: (get() as any).user?.id,
      }]).select();

      if (error) {
        console.error('Error adding investment to Supabase:', error);
        throw error;
      }

      const newInvestment: Investment = {
        id: data[0].id,
        ...investmentData,
      };
      set((state) => ({ investments: [...state.investments, newInvestment] }));
    } catch (error) {
      console.error('Error in addInvestment:', error);
    }
  },

  removeInvestment: async (id) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing investment from Supabase:', error);
        throw error;
      }

      set((state) => ({
        investments: state.investments.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Error in removeInvestment:', error);
    }
  },
});
