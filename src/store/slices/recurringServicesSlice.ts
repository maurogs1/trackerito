import { StateCreator } from 'zustand';
import { RecurringService, ServicePayment } from '../../features/monthlyPayments/types';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface RecurringServicesSlice {
  recurringServices: RecurringService[];
  servicePayments: ServicePayment[];
  isLoadingServices: boolean;
  error: string | null;

  loadRecurringServices: () => Promise<void>;
  loadServicePayments: () => Promise<void>;
  addRecurringService: (service: Omit<RecurringService, 'id' | 'created_at'>) => Promise<RecurringService | null>;
  updateRecurringService: (id: string, updates: Partial<RecurringService>) => Promise<void>;
  deleteRecurringService: (id: string) => Promise<void>;
  markServiceAsPaid: (serviceId: string, month: number, year: number, amount: number, expenseId?: string) => Promise<void>;
  unmarkServicePayment: (serviceId: string, month: number, year: number, deleteExpense?: boolean) => Promise<void>;
  getServicePaymentStatus: (serviceId: string, month: number, year: number) => ServicePayment | null;
  getMonthlyServicesTotal: (month: number, year: number) => number;
}

export const createRecurringServicesSlice: StateCreator<RecurringServicesSlice> = (set, get) => ({
  recurringServices: [],
  servicePayments: [],
  isLoadingServices: false,
  error: null,

  loadRecurringServices: async () => {
    set({ isLoadingServices: true, error: null });
    try {
      const { supabase } = await import('../../services/supabase');
      const user = (get() as any).user;

      if (!user || !user.id) {
        set({ recurringServices: [], isLoadingServices: false });
        return;
      }

      const { data, error } = await supabase
        .from('recurring_services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      const services = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        estimated_amount: Number(item.estimated_amount),
        day_of_month: item.day_of_month,
        category_id: item.category_id,
        icon: item.icon || 'pricetag',
        color: item.color || '#607D8B',
        is_active: item.is_active,
        created_at: item.created_at,
      }));

      set({ recurringServices: services, isLoadingServices: false, error: null });
    } catch (error) {
      logError(error, 'loadRecurringServices');
      const errorMessage = getUserFriendlyMessage(error, 'load');
      set({ recurringServices: [], isLoadingServices: false, error: errorMessage });
    }
  },

  loadServicePayments: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const state = get() as any;
      const user = state.user;

      if (!user || !user.id) return;

      // Usar los servicios ya cargados en el store si existen
      let serviceIds: string[] = [];
      if (state.recurringServices && state.recurringServices.length > 0) {
        serviceIds = state.recurringServices.map((s: any) => s.id);
      } else {
        // Solo si no hay servicios en el store, hacer la query
        const { data: services } = await supabase
          .from('recurring_services')
          .select('id')
          .eq('user_id', user.id);

        if (!services || services.length === 0) {
          set({ servicePayments: [] });
          return;
        }
        serviceIds = services.map(s => s.id);
      }

      if (serviceIds.length === 0) {
        set({ servicePayments: [] });
        return;
      }

      const { data, error } = await supabase
        .from('service_payments')
        .select('*')
        .in('service_id', serviceIds)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      const payments = (data || []).map((item: any) => ({
        id: item.id,
        service_id: item.service_id,
        expense_id: item.expense_id,
        payment_date: item.payment_date,
        amount: Number(item.amount),
        month: item.month,
        year: item.year,
        status: item.status,
        created_at: item.created_at,
      }));

      set({ servicePayments: payments });
    } catch (error) {
      logError(error, 'loadServicePayments');
      // No crítico, continuar
    }
  },

  addRecurringService: async (serviceData) => {
    set({ error: null });
    try {
      const { supabase } = await import('../../services/supabase');
      const user = (get() as any).user;

      if (!user || !user.id) throw new Error('No user authenticated');

      const { data, error } = await supabase
        .from('recurring_services')
        .insert({
          user_id: user.id,
          name: serviceData.name,
          estimated_amount: serviceData.estimated_amount,
          day_of_month: serviceData.day_of_month,
          category_id: serviceData.category_id || null,
          icon: serviceData.icon,
          color: serviceData.color,
          is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
        })
        .select()
        .single();

      if (error) throw error;

      const newService: RecurringService = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        estimated_amount: Number(data.estimated_amount),
        day_of_month: data.day_of_month,
        category_id: data.category_id,
        icon: data.icon,
        color: data.color,
        is_active: data.is_active,
        created_at: data.created_at,
      };

      set((state) => ({
        recurringServices: [...state.recurringServices, newService].sort((a, b) => 
          a.name.localeCompare(b.name)
        ),
        error: null
      }));

      return newService;
    } catch (error) {
      logError(error, 'addRecurringService');
      const errorMessage = getUserFriendlyMessage(error, 'category');
      set({ error: errorMessage });
      return null;
    }
  },

  updateRecurringService: async (id, updates) => {
    set({ error: null });
    try {
      const { supabase } = await import('../../services/supabase');
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.estimated_amount !== undefined) updateData.estimated_amount = updates.estimated_amount;
      if (updates.day_of_month !== undefined) updateData.day_of_month = updates.day_of_month;
      if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { error } = await supabase
        .from('recurring_services')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recurringServices: state.recurringServices.map(s => 
          s.id === id ? { ...s, ...updates } : s
        ).sort((a, b) => a.name.localeCompare(b.name)),
        error: null
      }));
    } catch (error) {
      logError(error, 'updateRecurringService');
      const errorMessage = getUserFriendlyMessage(error, 'update');
      set({ error: errorMessage });
    }
  },

  deleteRecurringService: async (id) => {
    set({ error: null });
    try {
      const { supabase } = await import('../../services/supabase');
      
      // Hard delete - eliminar permanentemente
      const { error } = await supabase
        .from('recurring_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        recurringServices: state.recurringServices.filter(s => s.id !== id),
        error: null
      }));
    } catch (error) {
      logError(error, 'deleteRecurringService');
      const errorMessage = getUserFriendlyMessage(error, 'delete');
      set({ error: errorMessage });
    }
  },

  markServiceAsPaid: async (serviceId, month, year, amount, expenseId) => {
    try {
      const { supabase } = await import('../../services/supabase');
      
      const { data, error } = await supabase
        .from('service_payments')
        .insert({
          service_id: serviceId,
          expense_id: expenseId || null,
          payment_date: new Date(year, month - 1, 1).toISOString().split('T')[0],
          amount,
          month,
          year,
          status: 'paid',
        })
        .select()
        .single();

      if (error) {
        // Si ya existe, actualizar
        if (error.code === '23505') { // Unique constraint violation
          const { error: updateError } = await supabase
            .from('service_payments')
            .update({
              amount,
              expense_id: expenseId || null,
              payment_date: new Date(year, month - 1, 1).toISOString().split('T')[0],
              status: 'paid',
            })
            .eq('service_id', serviceId)
            .eq('month', month)
            .eq('year', year);

          if (updateError) throw updateError;
        } else {
          throw error;
        }
      }

      // Recargar pagos
      await get().loadServicePayments();
    } catch (error) {
      logError(error, 'markServiceAsPaid');
      throw error;
    }
  },

  unmarkServicePayment: async (serviceId, month, year, deleteExpense = true) => {
    try {
      const { supabase } = await import('../../services/supabase');

      // Buscar el pago existente para obtener el expense_id
      const payment = get().getServicePaymentStatus(serviceId, month, year);

      if (!payment) {
        return; // No hay pago que deshacer
      }

      // Si hay un gasto asociado y queremos eliminarlo
      if (deleteExpense && payment.expense_id) {
        const { error: expenseError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', payment.expense_id);

        if (expenseError) {
          logError(expenseError, 'unmarkServicePayment - delete expense');
          // Continuar aunque falle eliminar el gasto
        }
      }

      // Eliminar el registro de pago
      const { error } = await supabase
        .from('service_payments')
        .delete()
        .eq('service_id', serviceId)
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;

      // Actualizar estado local
      set((state) => ({
        servicePayments: state.servicePayments.filter(
          p => !(p.service_id === serviceId && p.month === month && p.year === year)
        )
      }));

      // Recargar gastos si se eliminó uno
      if (deleteExpense && payment.expense_id) {
        const state = get() as any;
        if (state.loadExpenses) {
          await state.loadExpenses();
        }
      }
    } catch (error) {
      logError(error, 'unmarkServicePayment');
      throw error;
    }
  },

  getServicePaymentStatus: (serviceId, month, year) => {
    const { servicePayments } = get();
    return servicePayments.find(
      p => p.service_id === serviceId && p.month === month && p.year === year
    ) || null;
  },

  getMonthlyServicesTotal: (month, year) => {
    const { recurringServices, servicePayments } = get();
    const currentDate = new Date();
    const targetMonth = month + 1; // month es 0-11, pero en DB es 1-12
    const targetYear = year;

    let total = 0;

    recurringServices.forEach(service => {
      const payment = servicePayments.find(
        p => p.service_id === service.id && p.month === targetMonth && p.year === targetYear
      );

      if (payment && payment.status === 'paid') {
        total += payment.amount;
      } else {
        // Si no está pagado, usar el monto estimado
        total += service.estimated_amount;
      }
    });

    return total;
  },
});
