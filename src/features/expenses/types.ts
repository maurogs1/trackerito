export type FinancialType = 'needs' | 'wants' | 'savings' | 'unclassified';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  usageCount?: number;
  financialType?: FinancialType;
}

export interface Expense {
  id: string;
  amount: number;
  category: string; // Store category ID or Name (using Name for simplicity in this mock)
  description: string;
  date: string; // ISO string
  createdAt: string;
  financialType?: FinancialType;
}

export interface ExpenseSummary {
  totalBalance: number;
  previousMonthBalance: number;
  weeklyAverage: number;
  projectedBalance: number;
}
