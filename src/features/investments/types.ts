export type InvestmentType = 'crypto' | 'stock' | 'fixed_income' | 'real_estate' | 'other';

export interface Investment {
  id: string;
  name: string;
  amount: number; // Current value in main currency
  type: InvestmentType;
  currency: 'USD' | 'ARS';
  originalAmount?: number; // For calculating profit/loss later
  date: string;
}
