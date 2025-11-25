import { StateCreator } from 'zustand';
import { Investment } from '../../features/investments/types';

export interface InvestmentsSlice {
  investments: Investment[];
  
  loadInvestments: () => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>;
  removeInvestment: (id: string) => Promise<void>;
  resetToMockData: () => void;
}

// Mock data generator
const getMockInvestments = (): Investment[] => [
  { id: '1', name: 'Bitcoin', amount: 500000, type: 'crypto', currency: 'ARS', date: new Date().toISOString() },
  { id: '2', name: 'S&P 500', amount: 300000, type: 'stock', currency: 'ARS', date: new Date().toISOString() },
];

export const createInvestmentsSlice: StateCreator<InvestmentsSlice> = (set, get) => ({
  investments: [], // Start empty, load based on mode

  loadInvestments: async () => {
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (isDemoMode) {
        set({ investments: getMockInvestments() });
      } else {
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
      }
    } catch (error) {
      console.error('Error in loadInvestments:', error);
      set({ investments: [] });
    }
  },

  addInvestment: async (investmentData) => {
    const newInvestment: Investment = {
      ...investmentData,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (!isDemoMode) {
        const { supabase } = await import('../../services/supabase');
        const { error } = await supabase.from('investments').insert([{
          id: newInvestment.id,
          name: newInvestment.name,
          amount: newInvestment.amount,
          type: newInvestment.type,
          currency: newInvestment.currency,
          date: newInvestment.date,
          user_id: (get() as any).user?.id,
        }]);
        
        if (error) {
          console.error('Error adding investment to Supabase:', error);
          throw error;
        }
      }
      
      set((state) => ({ investments: [...state.investments, newInvestment] }));
    } catch (error) {
      console.error('Error in addInvestment:', error);
    }
  },

  removeInvestment: async (id) => {
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (!isDemoMode) {
        const { supabase } = await import('../../services/supabase');
        const { error } = await supabase
          .from('investments')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error removing investment from Supabase:', error);
          throw error;
        }
      }
      
      set((state) => ({
        investments: state.investments.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Error in removeInvestment:', error);
    }
  },

  resetToMockData: () => {
    set({ investments: getMockInvestments() });
  },
});
