import { StateCreator } from 'zustand';
import { Expense, ExpenseSummary } from '../../features/expenses/types';
import { mockApi } from '../../services/mockApi';
import { startOfMonth, subMonths, isSameMonth, getDaysInMonth, getDate } from 'date-fns';

export interface ExpensesSlice {
  expenses: Expense[];
  
  loadExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  resetToMockData: () => void;
  getSummary: () => ExpenseSummary;
}

// Mock data generator
const getMockExpenses = (): Expense[] => [
  { id: '1', amount: 15000, categoryId: '1', description: 'Compra semanal', date: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: '2', amount: 4500, categoryId: '2', description: 'Cine con amigos', date: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
  { id: '3', amount: 3200, categoryId: '3', description: 'Uber al trabajo', date: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date().toISOString() },
  { id: '4', amount: 12000, categoryId: '4', description: 'Farmacia', date: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date().toISOString() },
  { id: '5', amount: 8500, categoryId: '5', description: 'Cena romántica', date: new Date(Date.now() - 345600000).toISOString(), createdAt: new Date().toISOString() },
  { id: '6', amount: 60000, categoryId: '6', description: 'Alquiler', date: startOfMonth(new Date()).toISOString(), createdAt: new Date().toISOString() },
  { id: '7', amount: 2500, categoryId: '7', description: 'Starbucks', date: new Date().toISOString(), createdAt: new Date().toISOString() },
];

export const createExpensesSlice: StateCreator<
  ExpensesSlice,
  [],
  [],
  ExpensesSlice
> = (set, get) => ({
  expenses: [], // Start empty, load based on mode

  loadExpenses: async () => {
    const isDemoMode = (get() as any).isDemoMode;
    set({ isLoading: true } as any);
    
    try {
      if (isDemoMode) {
        // Load mock data
        set({ expenses: getMockExpenses(), isLoading: false } as any);
      } else {
        // Load from Supabase
        const { supabase } = await import('../../services/supabase');
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Error loading expenses from Supabase:', error);
          set({ expenses: [], isLoading: false } as any);
        } else {
          const loadedExpenses = (data || []).map((item: any) => ({
            ...item,
            amount: Number(item.amount),
            categoryId: item.category_id || item.category // Fallback for migration
          }));
          set({ expenses: loadedExpenses, isLoading: false } as any);
        }
      }
    } catch (error) {
      console.error('Error in loadExpenses:', error);
      set({ expenses: [], isLoading: false } as any);
    }
  },

  addExpense: async (expenseData) => {
    set({ isLoading: true, error: null } as any);
    try {
      const isDemoMode = (get() as any).isDemoMode;
      
      if (isDemoMode) {
        // Only generate ID for demo mode
        const newExpense: Expense = {
          ...expenseData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          financialType: expenseData.financialType || 'unclassified',
        };
        await mockApi.addExpense(newExpense);
        
        set((state) => {
          const categories = (state as any).categories || [];
          const updatedCategories = categories.map((c: any) => 
            c.id === expenseData.categoryId 
              ? { ...c, usageCount: (c.usageCount || 0) + 1 } 
              : c
          );

          return { 
            expenses: [newExpense, ...state.expenses],
            categories: updatedCategories,
            isLoading: false 
          } as any;
        });
      } else {
        // Real mode - Supabase generates the ID
        const { supabase } = await import('../../services/supabase');
        const user = (get() as any).user;
        
        console.log('Current user:', user);
        console.log('User ID:', user?.id);
        
        if (!user || !user.id) {
          const errorMsg = 'No user authenticated. Cannot save expense.';
          console.error(errorMsg);
          set({ error: errorMsg, isLoading: false } as any);
          throw new Error(errorMsg);
        }
        
        const expenseToInsert = {
          // No id field - Supabase will generate it
          amount: expenseData.amount,
          category_id: expenseData.categoryId,
          description: expenseData.description,
          date: expenseData.date,
          financial_type: expenseData.financialType || 'unclassified',
          user_id: user.id,
        };
        
        console.log('Inserting expense:', expenseToInsert);
        
        const { data, error } = await supabase
          .from('expenses')
          .insert([expenseToInsert])
          .select(); // Get the created record back with generated ID
        
        if (error) {
          console.error('Error adding expense to Supabase:', error);
          throw error;
        }
        
        console.log('Expense saved successfully:', data);
        
        // Use the expense returned by Supabase (includes generated ID)
        const savedExpense: Expense = {
          id: data[0].id,
          amount: Number(data[0].amount),
          categoryId: data[0].category_id,
          description: data[0].description,
          date: data[0].date,
          createdAt: data[0].created_at,
          financialType: data[0].financial_type,
        };
        
        set((state) => {
          const categories = (state as any).categories || [];
          const updatedCategories = categories.map((c: any) => 
            c.id === expenseData.categoryId 
              ? { ...c, usageCount: (c.usageCount || 0) + 1 } 
              : c
          );

          return { 
            expenses: [savedExpense, ...state.expenses],
            categories: updatedCategories,
            isLoading: false 
          } as any;
        });
      }
    } catch (error) {
      set({ error: 'Failed to add expense', isLoading: false } as any);
    }
  },

  removeExpense: async (id) => {
    set({ isLoading: true, error: null } as any);
    try {
      const isDemoMode = (get() as any).isDemoMode;
      if (isDemoMode) {
        // Remove from mock (just local state)
      } else {
        // Remove from Supabase
        const { supabase } = await import('../../services/supabase');
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error removing expense from Supabase:', error);
          throw error;
        }
      }
      
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        isLoading: false
      } as any));
    } catch (error) {
      set({ error: 'Failed to remove expense', isLoading: false } as any);
    }
  },

  resetToMockData: () => {
    set({ expenses: getMockExpenses() });
  },

  getSummary: () => {
    const { expenses } = get();
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    
    const currentMonthExpenses = expenses.filter(e => isSameMonth(new Date(e.date), now));
    const previousMonthExpenses = expenses.filter(e => isSameMonth(new Date(e.date), subMonths(now, 1)));

    const totalBalance = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousMonthBalance = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const daysPassed = getDate(now);
    const weeksPassed = Math.max(1, daysPassed / 7);
    const weeklyAverage = totalBalance / weeksPassed;

    const daysInMonth = getDaysInMonth(now);
    const projectedBalance = daysPassed > 0 ? (totalBalance / daysPassed) * daysInMonth : 0;

    return {
      totalBalance,
      previousMonthBalance,
      weeklyAverage,
      projectedBalance,
    };
  },
});
