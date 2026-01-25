import { StateCreator } from 'zustand';
import { Goal } from '../../features/goals/types';

export interface GoalsSlice {
  goals: Goal[];

  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoalProgress: (id: string, amount: number) => Promise<void>;
}

export const createGoalsSlice: StateCreator<GoalsSlice> = (set, get) => ({
  goals: [],

  loadGoals: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) {
        console.error('Error loading goals from Supabase:', error);
        set({ goals: [] });
      } else {
        set({ goals: data || [] });
      }
    } catch (error) {
      console.error('Error in loadGoals:', error);
      set({ goals: [] });
    }
  },

  addGoal: async (goalData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase.from('goals').insert([{
        name: goalData.name,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        deadline: goalData.deadline,
        icon: goalData.icon,
        color: goalData.color,
        user_id: (get() as any).user?.id,
      }]).select();

      if (error) {
        console.error('Error adding goal to Supabase:', error);
        throw error;
      }

      const newGoal: Goal = {
        id: data[0].id,
        ...goalData,
      };
      set((state) => ({ goals: [...state.goals, newGoal] }));
    } catch (error) {
      console.error('Error in addGoal:', error);
    }
  },

  updateGoalProgress: async (id, amount) => {
    const goal = (get() as any).goals?.find((g: Goal) => g.id === id);

    if (!goal) return;

    const newAmount = goal.currentAmount + amount;

    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', id);

      if (error) {
        console.error('Error updating goal in Supabase:', error);
        throw error;
      }

      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, currentAmount: newAmount } : g
        ),
      }));
    } catch (error) {
      console.error('Error in updateGoalProgress:', error);
    }
  },
});
