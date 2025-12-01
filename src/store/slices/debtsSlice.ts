import { StateCreator } from 'zustand';
import { Debt, DebtItem, ExpenseDebt } from '../../features/expenses/types';
import { supabase } from '../../services/supabase';

export interface DebtsSlice {
    debts: Debt[];
    isLoadingDebts: boolean;
    loadDebts: () => Promise<void>;
    addDebt: (debt: Omit<Debt, 'id' | 'created_at'>) => Promise<Debt | null>;
    updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
    deleteDebt: (id: string) => Promise<void>;
    addDebtItem: (item: Omit<DebtItem, 'id'>) => Promise<DebtItem | null>;
    linkExpenseToDebt: (link: Omit<ExpenseDebt, 'id'>) => Promise<ExpenseDebt | null>;
}

export const createDebtsSlice: StateCreator<DebtsSlice> = (set, get) => ({
    debts: [],
    isLoadingDebts: false,

    loadDebts: async () => {
        set({ isLoadingDebts: true });
        try {
            const { data, error } = await supabase
                .from('debts')
                .select(`
          *,
          items:debt_items(*)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map snake_case to camelCase
            const formattedDebts: Debt[] = (data || []).map((d: any) => ({
                id: d.id,
                name: d.name,
                totalAmount: d.total_amount,
                currentInstallment: d.current_installment,
                totalInstallments: d.total_installments,
                installmentAmount: d.installment_amount,
                startDate: d.start_date,
                status: d.status,
                items: d.items?.map((i: any) => ({
                    id: i.id,
                    debtId: i.debt_id,
                    name: i.name,
                    amount: i.amount
                }))
            }));

            set({ debts: formattedDebts });
        } catch (error) {
            console.error('Error loading debts:', error);
        } finally {
            set({ isLoadingDebts: false });
        }
    },

    addDebt: async (debt) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const { data, error } = await supabase
                .from('debts')
                .insert({
                    user_id: user.id,
                    name: debt.name,
                    total_amount: debt.totalAmount,
                    current_installment: debt.currentInstallment,
                    total_installments: debt.totalInstallments,
                    installment_amount: debt.installmentAmount,
                    start_date: debt.startDate,
                    status: debt.status
                })
                .select()
                .single();

            if (error) throw error;

            const newDebt: Debt = {
                id: data.id,
                name: data.name,
                totalAmount: data.total_amount,
                currentInstallment: data.current_installment,
                totalInstallments: data.total_installments,
                installmentAmount: data.installment_amount,
                startDate: data.start_date,
                status: data.status,
                items: []
            };

            set(state => ({ debts: [newDebt, ...state.debts] }));
            return newDebt;
        } catch (error) {
            console.error('Error adding debt:', error);
            return null;
        }
    },

    updateDebt: async (id, updates) => {
        try {
            const snakeCaseUpdates: any = {};
            if (updates.name !== undefined) snakeCaseUpdates.name = updates.name;
            if (updates.totalAmount !== undefined) snakeCaseUpdates.total_amount = updates.totalAmount;
            if (updates.currentInstallment !== undefined) snakeCaseUpdates.current_installment = updates.currentInstallment;
            if (updates.totalInstallments !== undefined) snakeCaseUpdates.total_installments = updates.totalInstallments;
            if (updates.installmentAmount !== undefined) snakeCaseUpdates.installment_amount = updates.installmentAmount;
            if (updates.startDate !== undefined) snakeCaseUpdates.start_date = updates.startDate;
            if (updates.status !== undefined) snakeCaseUpdates.status = updates.status;

            const { error } = await supabase
                .from('debts')
                .update(snakeCaseUpdates)
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                debts: state.debts.map(d => d.id === id ? { ...d, ...updates } : d)
            }));
        } catch (error) {
            console.error('Error updating debt:', error);
        }
    },

    deleteDebt: async (id) => {
        try {
            const { error } = await supabase
                .from('debts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                debts: state.debts.filter(d => d.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting debt:', error);
        }
    },

    addDebtItem: async (item) => {
        try {
            const { data, error } = await supabase
                .from('debt_items')
                .insert({
                    debt_id: item.debtId,
                    name: item.name,
                    amount: item.amount
                })
                .select()
                .single();

            if (error) throw error;

            const newItem: DebtItem = {
                id: data.id,
                debtId: data.debt_id,
                name: data.name,
                amount: data.amount
            };

            set(state => ({
                debts: state.debts.map(d =>
                    d.id === item.debtId
                        ? { ...d, items: [...(d.items || []), newItem] }
                        : d
                )
            }));

            return newItem;
        } catch (error) {
            console.error('Error adding debt item:', error);
            return null;
        }
    },

    linkExpenseToDebt: async (link) => {
        try {
            const { data, error } = await supabase
                .from('expense_debts')
                .insert({
                    expense_id: link.expenseId,
                    debt_id: link.debtId,
                    amount: link.amount
                })
                .select()
                .single();

            if (error) throw error;

            // Also update the debt's current installment count if needed?
            // For now, just return the link. The user might want to manually update progress.
            // Or we could auto-increment current_installment here.
            // Let's stick to simple linking for now, as requested in "avanzar cuotas" logic might be separate.

            return {
                id: data.id,
                expenseId: data.expense_id,
                debtId: data.debt_id,
                amount: data.amount
            };
        } catch (error) {
            console.error('Error linking expense to debt:', error);
            return null;
        }
    }
});
