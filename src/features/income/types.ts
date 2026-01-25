export type IncomeType = 'salary' | 'freelance' | 'bonus' | 'investment' | 'rental' | 'other';

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: IncomeType;
  date: string;
  isRecurring: boolean;
  recurringDay?: number;
  createdAt?: string;
  updatedAt?: string;
}

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
