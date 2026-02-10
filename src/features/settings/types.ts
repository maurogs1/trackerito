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

export interface WhatsappUsage {
  id: string;
  user_id: string;
  date: string;
  points_used: number;
  audio_count: number;
  text_count: number;
  created_at: string;
  updated_at: string;
}

export const WHATSAPP_USAGE_LIMITS = {
  DAILY_POINTS: 20,
  AUDIO_COST: 2,
  TEXT_COST: 1,
} as const;
