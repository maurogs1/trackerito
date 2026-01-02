import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabase';
import { CreditCard, CreditCardPurchase, CreditCardSummary, CreditCardSummaryItem } from '../../types/creditCards';
import { StoreState } from '../useStore';

export interface CreditCardsSlice {
  creditCards: CreditCard[];
  creditCardPurchases: CreditCardPurchase[];
  isLoadingCreditCards: boolean;
  loadCreditCards: () => Promise<void>;
  loadCreditCardPurchases: () => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'created_at' | 'user_id'>) => Promise<CreditCard | null>;
  deleteCreditCard: (id: string) => Promise<void>;
  addCreditCardPurchase: (purchase: Omit<CreditCardPurchase, 'id' | 'created_at' | 'user_id'>) => Promise<CreditCardPurchase | null>;
  getMonthlyConsumption: (cardId: string, month: number, year: number) => CreditCardSummary;
  getCreditCardPaymentStatus: (cardId: string, month: number, year: number) => { isPaid: boolean; expenseId?: string } | null;
}

export const createCreditCardsSlice: StateCreator<StoreState, [], [], CreditCardsSlice> = (set, get) => ({
  creditCards: [],
  creditCardPurchases: [],
  isLoadingCreditCards: false,

  loadCreditCards: async () => {
    set({ isLoadingCreditCards: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ creditCards: data || [] });
    } catch (error) {
      console.error('Error loading credit cards:', error);
    } finally {
      set({ isLoadingCreditCards: false });
    }
  },

  loadCreditCardPurchases: async () => {
    try {
      const isDemoMode = (get() as any).isDemoMode;
      if (isDemoMode) {
        set({ creditCardPurchases: [
          { id: 'purchase-1', credit_card_id: 'card-1', description: 'TV Samsung', total_amount: 500000, installments: 12, first_installment_date: new Date().toISOString(), categoryIds: [], user_id: 'demo-user', created_at: new Date().toISOString() },
          { id: 'purchase-2', credit_card_id: 'card-1', description: 'Supermercado', total_amount: 50000, installments: 1, first_installment_date: new Date().toISOString(), categoryIds: [], user_id: 'demo-user', created_at: new Date().toISOString() }
        ] });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Cargar consumos con sus categorías (relación muchos-a-muchos)
        const { data, error } = await supabase
          .from('credit_card_purchases')
          .select('*, credit_card_purchase_categories(category_id)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Mapear los datos incluyendo las categorías
        const purchases = (data || []).map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          credit_card_id: item.credit_card_id,
          description: item.description,
          total_amount: Number(item.total_amount),
          installments: item.installments,
          first_installment_date: item.first_installment_date,
          categoryIds: item.credit_card_purchase_categories 
            ? item.credit_card_purchase_categories.map((cc: any) => cc.category_id)
            : [],
          created_at: item.created_at,
        }));

        set({ creditCardPurchases: purchases });
      }
    } catch (error) {
      console.error('Error loading credit card purchases:', error);
    }
  },

  addCreditCard: async (cardData) => {
    try {
      const isDemoMode = (get() as any).isDemoMode;
      if (isDemoMode) {
        const newCard: CreditCard = {
          ...cardData,
          id: Math.random().toString(36).substr(2, 9),
          user_id: 'demo-user',
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          creditCards: [newCard, ...state.creditCards],
        }));
        return newCard;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user authenticated');

        const newCard = {
          ...cardData,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from('credit_cards')
          .insert(newCard)
          .select()
          .single();

        if (error) throw error;

        set((state) => ({
          creditCards: [data, ...state.creditCards],
        }));

        return data;
      }
    } catch (error) {
      console.error('Error adding credit card:', error);
      return null;
    }
  },

  deleteCreditCard: async (id) => {
    try {
      const isDemoMode = (get() as any).isDemoMode;
      if (isDemoMode) {
        set((state) => ({
          creditCards: state.creditCards.filter((c) => c.id !== id),
        }));
      } else {
        const { error } = await supabase
          .from('credit_cards')
          .delete()
          .eq('id', id);

        if (error) throw error;

        set((state) => ({
          creditCards: state.creditCards.filter((c) => c.id !== id),
        }));
      }
    } catch (error) {
      console.error('Error deleting credit card:', error);
    }
  },

  addCreditCardPurchase: async (purchaseData) => {
    try {
      const isDemoMode = (get() as any).isDemoMode;
      if (isDemoMode) {
        const newPurchase: CreditCardPurchase = {
          ...purchaseData,
          id: Math.random().toString(36).substr(2, 9),
          user_id: 'demo-user',
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          creditCardPurchases: [...state.creditCardPurchases, newPurchase],
        }));
        return newPurchase;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user authenticated');

        // Construir el objeto de inserción
        const insertData: any = {
          credit_card_id: purchaseData.credit_card_id,
          description: purchaseData.description,
          total_amount: purchaseData.total_amount,
          installments: purchaseData.installments,
          first_installment_date: purchaseData.first_installment_date, // Ya viene como YYYY-MM-DD
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from('credit_card_purchases')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        const purchaseId = data.id;

        // Insertar categorías en la tabla de relación (si hay categorías)
        if (purchaseData.categoryIds && purchaseData.categoryIds.length > 0) {
          const junctionData = purchaseData.categoryIds.map((catId: string) => ({
            purchase_id: purchaseId,
            category_id: catId
          }));

          // Verificar que el purchase existe y pertenece al usuario antes de insertar categorías
          const { data: verifyPurchase, error: verifyError } = await supabase
            .from('credit_card_purchases')
            .select('id, user_id')
            .eq('id', purchaseId)
            .eq('user_id', user.id)
            .single();

          if (verifyError || !verifyPurchase) {
            console.error('Error verifying purchase before inserting categories:', verifyError);
            throw new Error('No se pudo verificar el consumo antes de agregar categorías');
          }

          const { error: junctionError } = await supabase
            .from('credit_card_purchase_categories')
            .insert(junctionData);

          if (junctionError) {
            console.error('Error inserting categories for purchase:', junctionError);
            // Si falla, intentar sin categorías (no crítico para el funcionamiento básico)
            console.warn('Purchase created but categories could not be linked');
          }
        }

        // Construir el objeto completo con categorías para el estado
        const newPurchase: any = {
          ...data,
          total_amount: Number(data.total_amount),
          categoryIds: purchaseData.categoryIds || []
        };

        set((state) => ({
          creditCardPurchases: [newPurchase, ...state.creditCardPurchases],
        }));

        return newPurchase;
      }
    } catch (error) {
      console.error('Error adding credit card purchase:', error);
      return null;
    }
  },

  getMonthlyConsumption: (cardId, month, year) => {
    const { creditCardPurchases } = get();
    const targetDate = new Date(year, month, 1);
    const items: CreditCardSummaryItem[] = [];
    let totalAmount = 0;

    creditCardPurchases.forEach((purchase) => {
      if (purchase.credit_card_id !== cardId) return;

      const firstDate = new Date(purchase.first_installment_date);
      // Normalize to start of month to avoid day issues
      const startMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      
      // Calculate month difference
      const monthDiff = (year - startMonth.getFullYear()) * 12 + (month - startMonth.getMonth());

      if (monthDiff >= 0 && monthDiff < purchase.installments) {
        const installmentAmount = purchase.total_amount / purchase.installments;
        totalAmount += installmentAmount;
        items.push({
          purchaseId: purchase.id,
          description: purchase.description,
          installmentNumber: monthDiff + 1,
          totalInstallments: purchase.installments,
          amount: installmentAmount,
        });
      }
    });

    return {
      cardId,
      month,
      year,
      totalAmount,
      items,
    };
  },

  getCreditCardPaymentStatus: (cardId, month, year) => {
    const { expenses } = get();
    // Buscar en los gastos si hay un pago de tarjeta para este mes/año
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    
    const paymentExpense = expenses.find(e => {
      if (!e.isCreditCardPayment || e.creditCardId !== cardId) return false;
      
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    return paymentExpense ? { isPaid: true, expenseId: paymentExpense.id } : null;
  },
});
