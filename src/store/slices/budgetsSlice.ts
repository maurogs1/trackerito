import { StateCreator } from 'zustand';
import { Budget } from '../../features/budget/types';
import { isSameMonth } from 'date-fns';

export interface BudgetsSlice {
  budgets: Budget[];

  loadBudgets: () => Promise<void>;
  setCategoryBudget: (categoryId: string, limitAmount: number) => Promise<void>;
  getBudgetProgress: (categoryId: string) => { spent: number; limit: number; percentage: number } | null;
}

export const createBudgetsSlice: StateCreator<BudgetsSlice> = (set, get) => ({
  budgets: [],

  loadBudgets: async () => {
    try {
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
    } catch (error) {
      console.error('Error in loadBudgets:', error);
      set({ budgets: [] });
    }
  },

  setCategoryBudget: async (categoryId: string, limitAmount: number) => {
    const { budgets } = get();
    const existingBudget = budgets.find(b => b.categoryId === categoryId);

    try {
      const { supabase } = await import('../../services/supabase');

      if (limitAmount === 0 && existingBudget) {
        // Delete budget
        await supabase.from('budgets').delete().eq('id', existingBudget.id);
        set((state) => ({
          budgets: state.budgets.filter(b => b.categoryId !== categoryId)
        }));
      } else if (existingBudget) {
        // Update existing budget
        await supabase
          .from('budgets')
          .update({ limit_amount: limitAmount })
          .eq('id', existingBudget.id);
        set((state) => ({
          budgets: state.budgets.map(b =>
            b.categoryId === categoryId ? { ...b, limitAmount } : b
          )
        }));
      } else if (limitAmount > 0) {
        // Create new budget
        const { data, error } = await supabase
          .from('budgets')
          .insert([{
            category_id: categoryId,
            limit_amount: limitAmount,
            period: 'monthly',
            user_id: (get() as any).user?.id,
          }])
          .select();

        if (error) throw error;

        set((state) => ({
          budgets: [...state.budgets, {
            id: data[0].id,
            categoryId,
            limitAmount,
            period: 'monthly'
          }]
        }));
      }
    } catch (error) {
      console.error('Error syncing budget with Supabase:', error);
    }
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
