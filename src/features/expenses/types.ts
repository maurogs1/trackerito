export type FinancialType = 'needs' | 'wants' | 'savings' | 'unclassified';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'crypto'
  | 'other';

export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

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

  // Campos de método de pago
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;

  // Campos de cuotas
  installments?: number; // Número total de cuotas (1 = sin cuotas)
  installmentNumber?: number; // Número de esta cuota (1, 2, 3...)
  parentExpenseId?: string; // ID del gasto padre (si es una cuota)
  totalAmount?: number; // Monto total (solo para gasto padre con cuotas)
  isParent?: boolean; // TRUE si tiene cuotas hijas

  // Campos legacy/específicos (mantener por compatibilidad)
  creditCardId?: string;
  isCreditCardPayment?: boolean; // DEPRECADO: usar paymentMethod === 'credit_card'
  serviceId?: string; // Foreign Key to RecurringService table
  debtId?: string; // Foreign Key to Debts table (for debt payments)
}

export interface ExpenseSummary {
  totalBalance: number;
  previousMonthBalance: number;
  weeklyAverage: number;
  projectedBalance: number;
  // Nuevos campos para proyección mejorada
  totalFixed: number;
  totalVariable: number;
  pendingRecurring: number;
  projectedFixed: number;
  projectedVariables: number;
  changeFromLastMonth: number;
  daysPassed: number;
  daysRemaining: number;
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
