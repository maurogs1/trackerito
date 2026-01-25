import { StateCreator } from 'zustand';
import { Income } from '../../features/income/types';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';
import { startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

export interface IncomeSlice {
  incomes: Income[];
  isLoadingIncomes: boolean;

  loadIncomes: () => Promise<void>;
  addIncome: (income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Omit<Income, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
  getMonthlyIncome: (month?: Date) => number;
  getRecurringIncomes: () => Income[];
  getBalance: () => {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    availableDaily: number;
    grossBalance: number;
    pendingRecurring: number;
    paidRecurring: number;
    totalRecurring: number;
    daysRemaining: number;
  };
}

export const createIncomeSlice: StateCreator<IncomeSlice> = (set, get) => ({
  incomes: [],
  isLoadingIncomes: false,

  loadIncomes: async () => {
    set({ isLoadingIncomes: true });
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;

      if (!userId) {
        console.error('No user ID available for incomes');
        set({ incomes: [], isLoadingIncomes: false });
        return;
      }

      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        logError(error, 'loadIncomes');
        set({ incomes: [], isLoadingIncomes: false });
        return;
      }

      const mappedIncomes: Income[] = (data || []).map((inc: any) => ({
        id: inc.id,
        amount: inc.amount,
        description: inc.description,
        type: inc.type,
        date: inc.date,
        isRecurring: inc.is_recurring,
        recurringDay: inc.recurring_day,
        createdAt: inc.created_at,
        updatedAt: inc.updated_at,
      }));

      set({ incomes: mappedIncomes, isLoadingIncomes: false });
    } catch (error) {
      logError(error, 'loadIncomes');
      set({ incomes: [], isLoadingIncomes: false });
    }
  },

  addIncome: async (incomeData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;

      if (!userId) {
        console.error('No user ID for adding income');
        return;
      }

      const { data, error } = await supabase
        .from('incomes')
        .insert([{
          user_id: userId,
          amount: incomeData.amount,
          description: incomeData.description,
          type: incomeData.type,
          date: incomeData.date,
          is_recurring: incomeData.isRecurring,
          recurring_day: incomeData.recurringDay,
        }])
        .select()
        .single();

      if (error) {
        logError(error, 'addIncome');
        throw error;
      }

      const newIncome: Income = {
        id: data.id,
        amount: data.amount,
        description: data.description,
        type: data.type,
        date: data.date,
        isRecurring: data.is_recurring,
        recurringDay: data.recurring_day,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({ incomes: [newIncome, ...state.incomes] }));
    } catch (error) {
      logError(error, 'addIncome');
      const errorMessage = getUserFriendlyMessage(error, 'income');
      throw new Error(errorMessage);
    }
  },

  updateIncome: async (id, incomeData) => {
    try {
      const { supabase } = await import('../../services/supabase');

      const updateData: any = {};
      if (incomeData.amount !== undefined) updateData.amount = incomeData.amount;
      if (incomeData.description !== undefined) updateData.description = incomeData.description;
      if (incomeData.type !== undefined) updateData.type = incomeData.type;
      if (incomeData.date !== undefined) updateData.date = incomeData.date;
      if (incomeData.isRecurring !== undefined) updateData.is_recurring = incomeData.isRecurring;
      if (incomeData.recurringDay !== undefined) updateData.recurring_day = incomeData.recurringDay;

      const { error } = await supabase
        .from('incomes')
        .update(updateData)
        .eq('id', id);

      if (error) {
        logError(error, 'updateIncome');
        throw error;
      }

      set((state) => ({
        incomes: state.incomes.map((inc) =>
          inc.id === id ? { ...inc, ...incomeData } : inc
        ),
      }));
    } catch (error) {
      logError(error, 'updateIncome');
      const errorMessage = getUserFriendlyMessage(error, 'update');
      throw new Error(errorMessage);
    }
  },

  removeIncome: async (id) => {
    try {
      const { supabase } = await import('../../services/supabase');

      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'removeIncome');
        throw error;
      }

      set((state) => ({
        incomes: state.incomes.filter((inc) => inc.id !== id),
      }));
    } catch (error) {
      logError(error, 'removeIncome');
      const errorMessage = getUserFriendlyMessage(error, 'delete');
      throw new Error(errorMessage);
    }
  },

  getMonthlyIncome: (month = new Date()) => {
    const { incomes } = get();
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    // Ingresos de este mes (no recurrentes o registrados en este mes)
    let total = 0;

    incomes.forEach((inc) => {
      const incomeDate = new Date(inc.date);

      if (inc.isRecurring) {
        // Para ingresos recurrentes, contar si aplica a este mes
        // (asumimos que se cobran todos los meses)
        total += inc.amount;
      } else if (isSameMonth(incomeDate, month)) {
        // Para ingresos únicos, solo si están en el mes
        total += inc.amount;
      }
    });

    return total;
  },

  getRecurringIncomes: () => {
    const { incomes } = get();
    return incomes.filter((inc) => inc.isRecurring);
  },

  getBalance: () => {
    const state = get() as any;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    // Total de ingresos del mes
    const totalIncome = get().getMonthlyIncome(now);

    // Total de gastos del mes (usar getCurrentExpenses si existe)
    const currentExpenses = state.getCurrentExpenses?.() || state.expenses || [];
    const monthlyExpenses = currentExpenses.filter((e: any) => isSameMonth(new Date(e.date), now));
    const totalExpenses = monthlyExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    // Calcular servicios recurrentes pendientes del mes
    const recurringServices = state.recurringServices || [];
    const servicePayments = state.servicePayments || [];

    let pendingRecurring = 0;
    let paidRecurring = 0;

    recurringServices.forEach((service: any) => {
      if (!service.is_active) return;

      // Verificar si ya se pagó este mes
      const payment = servicePayments.find(
        (p: any) => p.service_id === service.id &&
                    p.month === currentMonth + 1 &&
                    p.year === currentYear &&
                    p.status === 'paid'
      );

      if (payment) {
        paidRecurring += payment.amount;
      } else {
        // Servicio pendiente de pagar este mes
        pendingRecurring += service.estimated_amount;
      }
    });

    // Balance bruto (sin considerar pendientes)
    const grossBalance = totalIncome - totalExpenses;

    // Balance real disponible (restando lo que falta pagar)
    const balance = grossBalance - pendingRecurring;

    // Días restantes del mes
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - today + 1;

    // Promedio diario disponible (solo del balance flexible)
    const availableDaily = balance > 0 ? balance / daysRemaining : 0;

    return {
      totalIncome,
      totalExpenses,
      balance,
      availableDaily,
      // Nuevos campos para más detalle
      grossBalance,
      pendingRecurring,
      paidRecurring,
      totalRecurring: pendingRecurring + paidRecurring,
      daysRemaining,
    };
  },
});
