import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, ExpenseSummary, Category } from '../features/expenses/types';
import { UserPreferences } from '../features/settings/types';
import { User } from '../features/auth/types';
import { Goal } from '../features/goals/types';
import { Budget } from '../features/budget/types';
import { UserBank } from '../features/benefits/types';
import { mockApi } from '../services/mockApi';
import { startOfMonth, endOfMonth, subMonths, isSameMonth, getDaysInMonth, getDate, differenceInCalendarWeeks } from 'date-fns';

interface State {
  expenses: Expense[];
  goals: Goal[];
  categories: Category[];
  budgets: Budget[];
  userBanks: UserBank[];
  preferences: UserPreferences;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  toggleTheme: () => void;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoalProgress: (id: string, amount: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  setCategoryBudget: (categoryId: string, limitAmount: number) => void;
  toggleUserBank: (bankId: string) => void;
  updateUserBank: (bankId: string, cards: { brand: 'visa' | 'mastercard' | 'amex'; level: 'classic' | 'gold' | 'platinum' | 'black' }[]) => void;
  
  // Selectors
  getSummary: () => ExpenseSummary;
  getBudgetProgress: (categoryId: string) => { spent: number; limit: number; percentage: number } | null;
  getMostUsedCategories: () => Category[];
}

export const useStore = create<State>()(persist((set, get) => ({
  expenses: [
    { id: '1', amount: 15000, category: 'Supermercado', description: 'Compra semanal', date: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: '2', amount: 4500, category: 'Entretenimiento', description: 'Cine con amigos', date: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date().toISOString() },
    { id: '3', amount: 3200, category: 'Transporte', description: 'Uber al trabajo', date: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date().toISOString() },
    { id: '4', amount: 12000, category: 'Salud', description: 'Farmacia', date: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date().toISOString() },
    { id: '5', amount: 8500, category: 'Restaurante', description: 'Cena romántica', date: new Date(Date.now() - 345600000).toISOString(), createdAt: new Date().toISOString() },
    { id: '6', amount: 60000, category: 'Hogar', description: 'Alquiler', date: startOfMonth(new Date()).toISOString(), createdAt: new Date().toISOString() },
    { id: '7', amount: 2500, category: 'Café', description: 'Starbucks', date: new Date().toISOString(), createdAt: new Date().toISOString() },
  ],
  goals: [
    { id: '1', name: 'Viaje a Europa', targetAmount: 2000000, currentAmount: 450000, deadline: '2025-12-31', icon: 'airplane', color: '#2196F3' },
    { id: '2', name: 'Nuevo Auto', targetAmount: 5000000, currentAmount: 120000, deadline: '2026-06-30', icon: 'car', color: '#FF9800' },
  ],
  categories: [
    { id: '1', name: 'Supermercado', icon: 'cart', color: '#FF5722' },
    { id: '2', name: 'Entretenimiento', icon: 'game-controller', color: '#9C27B0' },
    { id: '3', name: 'Transporte', icon: 'car', color: '#2196F3' },
    { id: '4', name: 'Salud', icon: 'medical', color: '#F44336' },
    { id: '5', name: 'Restaurante', icon: 'restaurant', color: '#FFC107' },
    { id: '6', name: 'Hogar', icon: 'home', color: '#795548' },
    { id: '7', name: 'Café', icon: 'cafe', color: '#795548' },
    { id: '8', name: 'Otros', icon: 'pricetag', color: '#607D8B' },
  ],
  budgets: [
    { id: '1', categoryId: '1', limitAmount: 60000, period: 'monthly' }, // Supermercado
    { id: '2', categoryId: '2', limitAmount: 20000, period: 'monthly' }, // Entretenimiento
  ],
  userBanks: [],
  preferences: {
    theme: 'light',
    currency: '$',
  },
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  loadExpenses: async () => {
    // In a real app, we would fetch from API. 
    // Here we just keep the initial state or load from AsyncStorage if we implemented persistence fully.
    // For this mock phase, we'll rely on the initial state defined above to show "alive" data.
    set({ isLoading: false }); 
  },

  addExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense: Expense = {
        ...expenseData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        financialType: expenseData.financialType || 'unclassified',
      };
      
      // Persist to Mock API
      await mockApi.addExpense(newExpense);
      
      set((state) => {
        // Increment usage count for the category
        const updatedCategories = state.categories.map(c => 
          c.name === expenseData.category 
            ? { ...c, usageCount: (c.usageCount || 0) + 1 } 
            : c
        );

        return { 
          expenses: [newExpense, ...state.expenses],
          categories: updatedCategories,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to add expense', isLoading: false });
    }
  },

  removeExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // await mockApi.removeExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to remove expense', isLoading: false });
    }
  },

  toggleTheme: () => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        theme: state.preferences.theme === 'light' ? 'dark' : 'light',
      },
    }));
  },

  login: async (username, pass) => {
    set({ isLoading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (username === 'mauro' && pass === '123456') {
      set({
        isAuthenticated: true,
        user: {
          id: '1',
          username: 'mauro',
          name: 'Mauro',
          avatar: 'https://ui-avatars.com/api/?name=Mauro&background=random',
        },
        isLoading: false,
      });
      return true;
    } else {
      set({ error: 'Credenciales inválidas', isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null });
  },

  addGoal: (goalData) => {
    const newGoal: Goal = {
      ...goalData,
      id: Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({ goals: [...state.goals, newGoal] }));
  },

  updateGoalProgress: (id, amount) => {
    set((state) => ({
      goals: state.goals.map((g) => 
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    }));
  },

  addCategory: (categoryData) => {
    const newCategory: Category = {
      ...categoryData,
      id: Math.random().toString(36).substr(2, 9),
      usageCount: 0,
      financialType: 'unclassified',
    };
    set((state) => ({ categories: [...state.categories, newCategory] }));
  },
  
  updateCategory: (updatedCategory) => {
    set((state) => ({
      categories: state.categories.map((c) => 
        c.id === updatedCategory.id ? updatedCategory : c
      ),
    }));
  },

  removeCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  setCategoryBudget: (categoryId: string, limitAmount: number) => {
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
  },

  toggleUserBank: (bankId: string) => {
    set((state) => {
      const exists = state.userBanks.find(b => b.bankId === bankId);
      if (exists) {
        return { userBanks: state.userBanks.filter(b => b.bankId !== bankId) };
      } else {
        return { 
          userBanks: [...state.userBanks, { bankId, cards: [{ brand: 'visa', level: 'classic' }] }] 
        };
      }
    });
  },

  updateUserBank: (bankId, cards) => {
    set((state) => ({
      userBanks: state.userBanks.map(b => 
        b.bankId === bankId ? { ...b, cards } : b
      )
    }))
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

  getBudgetProgress: (categoryName) => {
    const { budgets, expenses, categories } = get();
    const category = categories.find(c => c.name === categoryName);
    if (!category) return null;

    const budget = budgets.find(b => b.categoryId === category.id);
    if (!budget) return null;

    const now = new Date();
    const spent = expenses
      .filter(e => e.category === categoryName && isSameMonth(new Date(e.date), now))
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      spent,
      limit: budget.limitAmount,
      percentage: Math.min(1, spent / budget.limitAmount),
    };
  },

  getMostUsedCategories: () => {
    const { categories } = get();
    return [...categories].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  },
}), {
  name: 'trackerito-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated,
    expenses: state.expenses,
    categories: state.categories,
    goals: state.goals,
    budgets: state.budgets,
    userBanks: state.userBanks,
    preferences: state.preferences
  }),
}));
