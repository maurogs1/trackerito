export interface UserPreferences {
  theme: 'light' | 'dark';
  currency: string;
  hideFinancialData?: boolean; // DEPRECADO: usar hideIncome y hideExpenses
  hideIncome: boolean;
  hideExpenses: boolean;
}
