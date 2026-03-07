export type RecurringFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: string; // UUID of an IncomeTypeItem
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
