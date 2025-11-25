import { StateCreator } from 'zustand';
import { Goal } from '../../features/goals/types';

export interface GoalsSlice {
  goals: Goal[];
  
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoalProgress: (id: string, amount: number) => Promise<void>;
  resetToMockData: () => void;
}

// Mock data generator
const getMockGoals = (): Goal[] => [
  { id: '1', name: 'Viaje a Europa', targetAmount: 2000000, currentAmount: 450000, deadline: '2025-12-31', icon: 'airplane', color: '#2196F3' },
  { id: '2', name: 'Nuevo Auto', targetAmount: 5000000, currentAmount: 120000, deadline: '2026-06-30', icon: 'car', color: '#FF9800' },
];

export const createGoalsSlice: StateCreator<GoalsSlice> = (set, get) => ({
  goals: [], // Start empty, load based on mode

  loadGoals: async () => {
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (isDemoMode) {
        set({ goals: getMockGoals() });
      } else {
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
      }
    } catch (error) {
      console.error('Error in loadGoals:', error);
      set({ goals: [] });
    }
  },

  addGoal: async (goalData) => {
    const newGoal: Goal = {
      ...goalData,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (!isDemoMode) {
        const { supabase } = await import('../../services/supabase');
        const { error } = await supabase.from('goals').insert([{
          id: newGoal.id,
          name: newGoal.name,
          target_amount: newGoal.targetAmount,
          current_amount: newGoal.currentAmount,
          deadline: newGoal.deadline,
          icon: newGoal.icon,
          color: newGoal.color,
          user_id: (get() as any).user?.id,
        }]);
        
        if (error) {
          console.error('Error adding goal to Supabase:', error);
          throw error;
        }
      }
      
      set((state) => ({ goals: [...state.goals, newGoal] }));
    } catch (error) {
      console.error('Error in addGoal:', error);
    }
  },

  updateGoalProgress: async (id, amount) => {
    const isDemoMode = (get() as any).isDemoMode;
    const goal = (get() as any).goals?.find((g: Goal) => g.id === id);
    
    if (!goal) return;
    
    const newAmount = goal.currentAmount + amount;
    
    try {
      if (!isDemoMode) {
        const { supabase } = await import('../../services/supabase');
        const { error } = await supabase
          .from('goals')
          .update({ current_amount: newAmount })
          .eq('id', id);
        
        if (error) {
          console.error('Error updating goal in Supabase:', error);
          throw error;
        }
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

  resetToMockData: () => {
    set({ goals: getMockGoals() });
  },
});
