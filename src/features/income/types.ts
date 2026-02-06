export type IncomeType = 'salary' | 'freelance' | 'bonus' | 'investment' | 'rental' | 'other';
export type RecurringFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: IncomeType;
  date: string;
  isRecurring: boolean;
  recurringDay?: number;
  recurringFrequency?: RecurringFrequency;
  createdAt?: string;
  updatedAt?: string;
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  monthly: 'Mensual',
  biweekly: 'Quincenal',
  weekly: 'Semanal',
};

export const FREQUENCY_DESCRIPTIONS: Record<RecurringFrequency, string> = {
  monthly: '1 vez al mes',
  biweekly: '2 veces al mes',
  weekly: '4 veces al mes',
};

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary: 'Sueldo',
  freelance: 'Freelance',
  bonus: 'Bono',
  investment: 'Inversiones',
  rental: 'Alquiler',
  other: 'Otro',
};

export const INCOME_TYPE_ICONS: Record<IncomeType, string> = {
  salary: 'briefcase',
  freelance: 'laptop',
  bonus: 'gift',
  investment: 'trending-up',
  rental: 'home',
  other: 'cash',
};

export const INCOME_TYPE_COLORS: Record<IncomeType, string> = {
  salary: '#4CAF50',
  freelance: '#2196F3',
  bonus: '#FF9800',
  investment: '#9C27B0',
  rental: '#795548',
  other: '#607D8B',
};
