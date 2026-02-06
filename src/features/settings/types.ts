export interface UserPreferences {
  theme: 'light' | 'dark';
  currency: string;
  hideFinancialData?: boolean; // DEPRECADO: usar hideIncome y hideExpenses
  hideIncome: boolean;
  hideExpenses: boolean;
  lastClosedMonth?: string;    // "2025-01" formato YYYY-MM
  carryoverAmount?: number;    // Monto arrastrado del mes anterior
}

export interface UserProfile {
  id: string;
  user_id: string;
  phone_number: string | null;
  whatsapp_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}
