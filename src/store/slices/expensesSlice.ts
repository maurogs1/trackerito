import { StateCreator } from 'zustand';
import { Expense, ExpenseSummary } from '../../features/expenses/types';
import { mockApi } from '../../services/mockApi';
import { startOfMonth, subMonths, isSameMonth, getDaysInMonth, getDate } from 'date-fns';

export interface ExpensesSlice {
  expenses: Expense[];
  
  loadExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  resetToMockData: () => void;
  getSummary: () => ExpenseSummary;
}

// Mock data generator
const getMockExpenses = (): Expense[] => [
  { id: '1', amount: 15000, categoryIds: ['1'], description: 'Compra semanal', date: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: '2', amount: 4500, categoryIds: ['2'], description: 'Cine con amigos', date: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
  { id: '3', amount: 3200, categoryIds: ['3'], description: 'Uber al trabajo', date: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date().toISOString() },
  { id: '4', amount: 12000, categoryIds: ['4'], description: 'Farmacia', date: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date().toISOString() },
  { id: '5', amount: 8500, categoryIds: ['5'], description: 'Cena romántica', date: new Date(Date.now() - 345600000).toISOString(), createdAt: new Date().toISOString() },
  { id: '6', amount: 60000, categoryIds: ['6'], description: 'Alquiler', date: startOfMonth(new Date()).toISOString(), createdAt: new Date().toISOString() },
  { id: '7', amount: 2500, categoryIds: ['7'], description: 'Starbucks', date: new Date().toISOString(), createdAt: new Date().toISOString() },
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
          .select('*, expense_categories(category_id)')
          .order('date', { ascending: false });
        
        if (error) {
          console.error('Error loading expenses from Supabase:', error);
          set({ expenses: [], isLoading: false } as any);
        } else {
          const loadedExpenses = (data || []).map((item: any) => ({
            ...item,
            amount: Number(item.amount),
            categoryIds: item.expense_categories 
              ? item.expense_categories.map((ec: any) => ec.category_id)
              : [] 
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
            expenseData.categoryIds.includes(c.id)
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
        
        const newExpenseId = data[0].id;
        console.log('Expense saved successfully, ID:', newExpenseId);

        // Insert into junction table
        if (expenseData.categoryIds && expenseData.categoryIds.length > 0) {
          const junctionData = expenseData.categoryIds.map(catId => ({
            expense_id: newExpenseId,
            category_id: catId
          }));

          const { error: junctionError } = await supabase
            .from('expense_categories')
            .insert(junctionData);

          if (junctionError) {
            console.error('Error linking categories:', junctionError);
            // We might want to delete the expense if this fails, but for now let's keep it
          }
        }

        // Increment usage count for ALL selected categories
        try {
          // We do this one by one or we could write a stored procedure. 
          // For simplicity/speed in this context, loop is fine for small N.
          for (const catId of expenseData.categoryIds) {
             const { data: catData, error: catError } = await supabase
              .from('categories')
              .select('usage_count')
              .eq('id', catId)
              .single();

            if (!catError && catData) {
              await supabase
                .from('categories')
                .update({ usage_count: (catData.usage_count || 0) + 1 })
                .eq('id', catId);
            }
          }
        } catch (err) {
          console.error('Error incrementing usage count:', err);
        }
        
        // Use the expense returned by Supabase (includes generated ID)
        const savedExpense: Expense = {
          id: data[0].id,
          amount: Number(data[0].amount),
          categoryIds: expenseData.categoryIds,
          description: data[0].description,
          date: data[0].date,
          createdAt: data[0].created_at,
          financialType: data[0].financial_type,
        };
        
        set((state) => {
          const categories = (state as any).categories || [];
          const updatedCategories = categories.map((c: any) => 
            expenseData.categoryIds.includes(c.id)
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



  updateExpense: async (id, expenseData) => {
    set({ isLoading: true, error: null } as any);
    try {
      const isDemoMode = (get() as any).isDemoMode;
      
      if (isDemoMode) {
        // Update mock data
        set((state) => ({
          expenses: state.expenses.map(e => 
            e.id === id ? { ...e, ...expenseData } : e
          ),
          isLoading: false
        } as any));
      } else {
        const { supabase } = await import('../../services/supabase');
        
        // 1. Update expenses table
        const updateData: any = {};
        if (expenseData.amount !== undefined) updateData.amount = expenseData.amount;
        if (expenseData.description !== undefined) updateData.description = expenseData.description;
        if (expenseData.date !== undefined) updateData.date = expenseData.date;
        if (expenseData.financialType !== undefined) updateData.financial_type = expenseData.financialType;

        const { error: updateError } = await supabase
          .from('expenses')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;

        // 2. Update categories if provided
        if (expenseData.categoryIds) {
          // Delete existing links
          const { error: deleteError } = await supabase
            .from('expense_categories')
            .delete()
            .eq('expense_id', id);
            
          if (deleteError) throw deleteError;

          // Insert new links
          if (expenseData.categoryIds.length > 0) {
             const junctionData = expenseData.categoryIds.map(catId => ({
              expense_id: id,
              category_id: catId
            }));

            const { error: insertError } = await supabase
              .from('expense_categories')
              .insert(junctionData);
              
            if (insertError) throw insertError;
          }
        }

        // 3. Update local state
        set((state) => ({
          expenses: state.expenses.map(e => 
            e.id === id ? { ...e, ...expenseData } : e
          ),
          isLoading: false
        } as any));
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      set({ error: 'Failed to update expense', isLoading: false } as any);
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
