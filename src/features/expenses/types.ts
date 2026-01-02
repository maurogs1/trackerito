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
  creditCardId?: string;
  isCreditCardPayment?: boolean;
  serviceId?: string; // Foreign Key to RecurringService table
}

export interface ExpenseSummary {
  totalBalance: number;
  previousMonthBalance: number;
  weeklyAverage: number;
  projectedBalance: number;
}

export type DebtStatus = 'active' | 'paid' | 'cancelled';

export interface Bank {
  id: string;
  name: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentInstallment: number;
  totalInstallments: number;
  installmentAmount: number;
  startDate: string; // ISO Date
  status: DebtStatus;
  bankId?: string;
  items?: DebtItem[];
}

export interface DebtItem {
  id: string;
  debtId: string;
  name: string;
  amount: number;
}

export interface ExpenseDebt {
  id: string;
  expenseId: string;
  debtId: string;
  amount: number;
}
