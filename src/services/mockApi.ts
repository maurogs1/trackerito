import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../features/expenses/types';

const STORAGE_KEY = '@trackerito_expenses';
const DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async getExpenses(): Promise<Expense[]> {
    await delay(DELAY_MS);
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  },

  async addExpense(expense: Expense): Promise<Expense> {
    await delay(DELAY_MS);
    const expenses = await this.getExpenses();
    const newExpenses = [expense, ...expenses];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
    return expense;
  },

  async removeExpense(id: string): Promise<void> {
    await delay(DELAY_MS);
    const expenses = await this.getExpenses();
    const newExpenses = expenses.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
  },

  async updateExpense(updatedExpense: Expense): Promise<Expense> {
    await delay(DELAY_MS);
    const expenses = await this.getExpenses();
    const newExpenses = expenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
    return updatedExpense;
  },
};
