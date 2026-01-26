import { StateCreator } from 'zustand';
import { PaymentGroup } from '../../features/expenses/types';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface PaymentGroupsSlice {
  paymentGroups: PaymentGroup[];
  loadPaymentGroups: () => Promise<void>;
  addPaymentGroup: (group: Omit<PaymentGroup, 'id' | 'createdAt'>) => Promise<PaymentGroup | null>;
  updatePaymentGroup: (id: string, group: Partial<Omit<PaymentGroup, 'id' | 'createdAt'>>) => Promise<void>;
  deletePaymentGroup: (id: string) => Promise<void>;
  getGroupExpenses: (groupId: string, month?: number, year?: number) => any[];
  payGroupSummary: (groupId: string, month: number, year: number) => Promise<void>;
}

export const createPaymentGroupsSlice: StateCreator<
  PaymentGroupsSlice,
  [],
  [],
  PaymentGroupsSlice
> = (set, get) => ({
  paymentGroups: [],

  loadPaymentGroups: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { data, error } = await supabase
        .from('payment_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logError(error, 'loadPaymentGroups');
        return;
      }

      const groups: PaymentGroup[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        icon: item.icon || 'card',
        color: item.color || '#1976D2',
        description: item.description,
        createdAt: item.created_at,
      }));

      set({ paymentGroups: groups });
    } catch (error) {
      logError(error, 'loadPaymentGroups');
    }
  },

  addPaymentGroup: async (groupData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const state = get() as any;
      const user = state.user;

      if (!user || !user.id) {
        logError(new Error('No user authenticated'), 'addPaymentGroup');
        return null;
      }

      const { data, error } = await supabase
        .from('payment_groups')
        .insert([{
          user_id: user.id,
          name: groupData.name,
          icon: groupData.icon || 'card',
          color: groupData.color || '#1976D2',
          description: groupData.description,
        }])
        .select();

      if (error) {
        logError(error, 'addPaymentGroup');
        return null;
      }

      const newGroup: PaymentGroup = {
        id: data[0].id,
        name: data[0].name,
        icon: data[0].icon,
        color: data[0].color,
        description: data[0].description,
        createdAt: data[0].created_at,
      };

      set((state) => ({
        paymentGroups: [...state.paymentGroups, newGroup],
      }));

      return newGroup;
    } catch (error) {
      logError(error, 'addPaymentGroup');
      return null;
    }
  },

  updatePaymentGroup: async (id, groupData) => {
    try {
      const { supabase } = await import('../../services/supabase');

      const updateData: any = {};
      if (groupData.name !== undefined) updateData.name = groupData.name;
      if (groupData.icon !== undefined) updateData.icon = groupData.icon;
      if (groupData.color !== undefined) updateData.color = groupData.color;
      if (groupData.description !== undefined) updateData.description = groupData.description;

      const { error } = await supabase
        .from('payment_groups')
        .update(updateData)
        .eq('id', id);

      if (error) {
        logError(error, 'updatePaymentGroup');
        return;
      }

      set((state) => ({
        paymentGroups: state.paymentGroups.map((g) =>
          g.id === id ? { ...g, ...groupData } : g
        ),
      }));
    } catch (error) {
      logError(error, 'updatePaymentGroup');
    }
  },

  deletePaymentGroup: async (id) => {
    try {
      const { supabase } = await import('../../services/supabase');

      // Primero desvinculamos los gastos del grupo
      await supabase
        .from('expenses')
        .update({ payment_group_id: null })
        .eq('payment_group_id', id);

      // Luego eliminamos el grupo
      const { error } = await supabase
        .from('payment_groups')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'deletePaymentGroup');
        return;
      }

      set((state) => ({
        paymentGroups: state.paymentGroups.filter((g) => g.id !== id),
      }));
    } catch (error) {
      logError(error, 'deletePaymentGroup');
    }
  },

  getGroupExpenses: (groupId: string, month?: number, year?: number) => {
    const state = get() as any;
    const expenses = state.expenses || [];

    return expenses.filter((e: any) => {
      if (e.paymentGroupId !== groupId) return false;
      if (e.isParent) return false; // Excluir gastos padre

      // Si se especifica mes y año, filtrar por fecha
      if (month !== undefined && year !== undefined) {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
      }

      return true;
    });
  },

  payGroupSummary: async (groupId: string, month: number, year: number) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const state = get() as any;
      const user = state.user;

      if (!user || !user.id) {
        logError(new Error('No user authenticated'), 'payGroupSummary');
        return;
      }

      // Obtener gastos del grupo para este mes
      const groupExpenses = (get() as any).getGroupExpenses(groupId, month, year);
      const pendingExpenses = groupExpenses.filter((e: any) => e.paymentStatus === 'pending');

      if (pendingExpenses.length === 0) {
        return; // No hay gastos pendientes
      }

      const expenseIds = pendingExpenses.map((e: any) => e.id);
      const totalAmount = pendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

      // Marcar todos como pagados
      const { error: updateError } = await supabase
        .from('expenses')
        .update({ payment_status: 'paid' })
        .in('id', expenseIds);

      if (updateError) {
        logError(updateError, 'payGroupSummary-update');
        return;
      }

      // Obtener nombre del grupo
      const group = state.paymentGroups.find((g: PaymentGroup) => g.id === groupId);
      const groupName = group?.name || 'Grupo';

      // Crear gasto de pago del resumen
      const paymentExpenseData = {
        amount: totalAmount,
        description: `Pago Resumen ${groupName} ${month + 1}/${year}`,
        date: new Date().toISOString(),
        financial_type: 'needs',
        user_id: user.id,
        payment_method: 'cash',
        payment_status: 'paid',
        payment_group_id: groupId,
      };

      const { data: paymentData, error: paymentError } = await supabase
        .from('expenses')
        .insert([paymentExpenseData])
        .select();

      if (paymentError) {
        logError(paymentError, 'payGroupSummary-payment');
        return;
      }

      // Actualizar estado local
      set((prevState: any) => {
        const updatedExpenses = prevState.expenses.map((e: any) =>
          expenseIds.includes(e.id) ? { ...e, paymentStatus: 'paid' } : e
        );

        const paymentExpense = {
          id: paymentData[0].id,
          amount: Number(paymentData[0].amount),
          categoryIds: [],
          description: paymentData[0].description,
          date: paymentData[0].date,
          createdAt: paymentData[0].created_at,
          financialType: paymentData[0].financial_type,
          paymentMethod: paymentData[0].payment_method,
          paymentStatus: paymentData[0].payment_status,
          paymentGroupId: paymentData[0].payment_group_id,
        };

        return {
          expenses: [paymentExpense, ...updatedExpenses],
        };
      });
    } catch (error) {
      logError(error, 'payGroupSummary');
    }
  },
});
