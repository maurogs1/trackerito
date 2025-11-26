import { StateCreator } from 'zustand';
import { Budget } from '../../features/budget/types';
import { isSameMonth } from 'date-fns';

export interface BudgetsSlice {
  budgets: Budget[];
  
  loadBudgets: () => Promise<void>;
  setCategoryBudget: (categoryId: string, limitAmount: number) => Promise<void>;
  resetToMockData: () => void;
  getBudgetProgress: (categoryId: string) => { spent: number; limit: number; percentage: number } | null;
}

// Mock data generator
const getMockBudgets = (): Budget[] => [
  { id: '1', categoryId: '1', limitAmount: 60000, period: 'monthly' }, // Supermercado
  { id: '2', categoryId: '2', limitAmount: 20000, period: 'monthly' }, // Entretenimiento
];

export const createBudgetsSlice: StateCreator<BudgetsSlice> = (set, get) => ({
  budgets: [], // Start empty, load based on mode

  loadBudgets: async () => {
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (isDemoMode) {
        set({ budgets: getMockBudgets() });
      } else {
        const { supabase } = await import('../../services/supabase');
        const { data, error } = await supabase
          .from('budgets')
          .select('*');
        
        if (error) {
          console.error('Error loading budgets from Supabase:', error);
          set({ budgets: [] });
        } else {
          set({ budgets: data || [] });
        }
      }
    } catch (error) {
      console.error('Error in loadBudgets:', error);
      set({ budgets: [] });
    }
  },

  setCategoryBudget: async (categoryId: string, limitAmount: number) => {
    const isDemoMode = (get() as any).isDemoMode;
    
    set((state) => {
      const existingBudgetIndex = state.budgets.findIndex(b => b.categoryId === categoryId);
      let newBudgets = [...state.budgets];

      if (existingBudgetIndex >= 0) {
        if (limitAmount > 0) {
          newBudgets[existingBudgetIndex] = { ...newBudgets[existingBudgetIndex], limitAmount };
        } else {
          // Remove budget if limit is 0
          newBudgets = newBudgets.filter(b => b.categoryId !== categoryId);
        }
      } else if (limitAmount > 0) {
        newBudgets.push({
          id: Math.random().toString(36).substr(2, 9),
          categoryId,
          limitAmount,
          period: 'monthly'
        });
      }

      return { budgets: newBudgets };
    });

    // Sync with Supabase
    if (!isDemoMode) {
      try {
        const { supabase } = await import('../../services/supabase');
        const { budgets } = get();
        const budget = budgets.find(b => b.categoryId === categoryId);
        
        if (limitAmount === 0 && budget) {
          // Delete budget
          await supabase.from('budgets').delete().eq('id', budget.id);
        } else if (budget) {
          // Update or insert
          const existingBudget = budgets.find(b => b.categoryId === categoryId);
          if (existingBudget) {
            await supabase
              .from('budgets')
              .upsert({
                id: budget.id,
                category_id: categoryId,
                limit_amount: limitAmount,
                period: 'monthly',
                user_id: (get() as any).user?.id,
              });
          }
        }
      } catch (error) {
        console.error('Error syncing budget with Supabase:', error);
      }
    }
  },

  resetToMockData: () => {
    set({ budgets: getMockBudgets() });
  },

  getBudgetProgress: (categoryId) => {
    const { budgets } = get();
    const expenses = (get() as any).expenses || [];
    
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return null;

    const now = new Date();
    const spent = expenses
      .filter((e: any) => e.categoryIds && e.categoryIds.includes(categoryId) && isSameMonth(new Date(e.date), now))
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    return {
      spent,
      limit: budget.limitAmount,
      percentage: Math.min(1, spent / budget.limitAmount),
    };
  },
});
