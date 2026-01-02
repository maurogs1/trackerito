export interface RecurringService {
  id: string;
  user_id?: string; // Solo si es personalizado del usuario
  name: string;
  estimated_amount: number;
  day_of_month: number;
  category_id?: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at?: string;
  // Para servicios predefinidos
  is_default?: boolean;
  service_category?: string;
}

export interface ServicePayment {
  id: string;
  service_id: string;
  expense_id?: string;
  payment_date: string;
  amount: number;
  month: number;
  year: number;
  status: 'paid' | 'pending' | 'overdue';
  created_at?: string;
}

export interface PredefinedService {
  name: string;
  icon: string;
  color: string;
  category: string;
  commonAmount?: number; // Monto estimado común en ARS
  commonDay?: number; // Día común de pago
}
