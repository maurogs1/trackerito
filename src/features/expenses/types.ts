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
  categoryIds: string[]; // Foreign Key to Categories table
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
