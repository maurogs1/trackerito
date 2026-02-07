import { StateCreator } from 'zustand';
import { Expense, ExpenseSummary } from '../../features/expenses/types';
import { startOfMonth, subMonths, isSameMonth, getDaysInMonth, getDate } from 'date-fns';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

// Helper function to sort expenses by date (newest first)
const sortExpensesByDate = (expenses: Expense[]): Expense[] => {
  return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export interface ExpensesSlice {
  expenses: Expense[];

  loadExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense | null>;
  addExpenseWithInstallments: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  getExpenseInstallments: (parentExpenseId: string) => Expense[];
  getCurrentExpenses: () => Expense[];
  getUpcomingExpenses: () => Expense[];
  getSummary: () => ExpenseSummary;
}

export const createExpensesSlice: StateCreator<
  ExpensesSlice,
  [],
  [],
  ExpensesSlice
> = (set, get) => ({
  expenses: [],

  loadExpenses: async () => {
    set({ isLoading: true, error: null } as any);
    
    try {
        // Load from Supabase
        const { supabase } = await import('../../services/supabase');
        const { data, error } = await supabase
          .from('expenses')
          .select('*, expense_categories(category_id)')
          .order('date', { ascending: false });
        
        if (error) {
          logError(error, 'loadExpenses');
          const errorMessage = getUserFriendlyMessage(error, 'load');
          set({ expenses: [], isLoading: false, error: errorMessage } as any);
        } else {
          const loadedExpenses = (data || []).map((item: any) => ({
            ...item,
            amount: Number(item.amount),
            categoryIds: item.expense_categories
              ? item.expense_categories.map((ec: any) => ec.category_id)
              : [],
            // Mapear nuevos campos desde snake_case a camelCase (con defaults para compatibilidad)
            financialType: item.financial_type || 'unclassified',
            paymentMethod: item.payment_method || 'cash',
            paymentStatus: item.payment_status || 'paid',
            installmentNumber: item.installment_number || 1,
            installments: item.installments || 1,
            parentExpenseId: item.parent_expense_id || undefined,
            totalAmount: item.total_amount ? Number(item.total_amount) : undefined,
            isParent: item.is_parent || false,
            creditCardId: item.credit_card_id,
            isCreditCardPayment: item.is_credit_card_payment,
            serviceId: item.service_id,
            debtId: item.debt_id,
            paymentGroupId: item.payment_group_id,
          }));
          set({ expenses: loadedExpenses, isLoading: false, error: null } as any);
        }
    } catch (error) {
      logError(error, 'loadExpenses');
      const errorMessage = getUserFriendlyMessage(error, 'load');
      set({ expenses: [], isLoading: false, error: errorMessage } as any);
    }
  },

  addExpense: async (expenseData) => {
    set({ isLoading: true, error: null } as any);
    try {
      const { supabase } = await import('../../services/supabase');
        const user = (get() as any).user;
        
        console.log('Current user:', user);
        console.log('User ID:', user?.id);
        
        if (!user || !user.id) {
          const errorMsg = getUserFriendlyMessage(new Error('No user authenticated'), 'expense');
          logError(new Error('No user authenticated'), 'addExpense');
          set({ error: errorMsg, isLoading: false } as any);
          throw new Error(errorMsg);
        }
        
        const expenseToInsert = {
          // No id field - Supabase will generate it
          amount: expenseData.amount,
          description: expenseData.description,
          date: expenseData.date,
          financial_type: expenseData.financialType || 'unclassified',
          user_id: user.id,
          credit_card_id: expenseData.creditCardId,
          is_credit_card_payment: expenseData.isCreditCardPayment,
          service_id: expenseData.serviceId,
          debt_id: expenseData.debtId,
          payment_group_id: expenseData.paymentGroupId,
        };
        
        console.log('Inserting expense:', expenseToInsert);
        
        const { data, error } = await supabase
          .from('expenses')
          .insert([expenseToInsert])
          .select(); // Get the created record back with generated ID
        
        if (error) {
          logError(error, 'addExpense');
          throw error;
        }
        
        const newExpenseId = data[0].id;
        console.log('Expense saved successfully, ID:', newExpenseId);

        // Insert into junction table
        if (expenseData.categoryIds && expenseData.categoryIds.length > 0) {
          // Filter out any invalid category IDs (mock data with short IDs)
          const validCategoryIds = expenseData.categoryIds.filter(catId => {
            // UUID format check
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);
          });

          if (validCategoryIds.length === 0) {
            console.warn('No valid category IDs found, skipping category association');
          } else {
            const junctionData = validCategoryIds.map(catId => ({
              expense_id: newExpenseId,
              category_id: catId
            }));

            const { error: junctionError } = await supabase
              .from('expense_categories')
              .insert(junctionData);

            if (junctionError) {
              logError(junctionError, 'addExpense-categories');
              // We might want to delete the expense if this fails, but for now let's keep it
            }
          }
        }

        // Increment usage count for ALL selected categories
        try {
          // Filter valid category IDs
          const validCategoryIds = expenseData.categoryIds.filter(catId =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId)
          );

          // We do this one by one or we could write a stored procedure.
          // For simplicity/speed in this context, loop is fine for small N.
          for (const catId of validCategoryIds) {
             const { data: catData, error: catError } = await supabase
              .from('categories')
              .select('usage_count')
              .eq('id', catId)
              .single();

            if (!catError && catData) {
              await supabase
                .from('categories')
                .update({ usage_count: (catData.usage_count || 0) + 1 })
                .eq('id', catId);
            }
          }
        } catch (err) {
          logError(err, 'addExpense-usageCount');
          // Non-critical error, continue
        }
        
        // Use the expense returned by Supabase (includes generated ID)
        const savedExpense: Expense = {
          id: data[0].id,
          amount: Number(data[0].amount),
          categoryIds: expenseData.categoryIds,
          description: data[0].description,
          date: data[0].date,
          createdAt: data[0].created_at,
          financialType: data[0].financial_type,
          creditCardId: data[0].credit_card_id,
          isCreditCardPayment: data[0].is_credit_card_payment,
          serviceId: data[0].service_id,
          debtId: data[0].debt_id,
          paymentGroupId: data[0].payment_group_id,
        };

        set((state) => {
          const categories = (state as any).categories || [];
          const updatedCategories = categories.map((c: any) =>
            expenseData.categoryIds.includes(c.id)
              ? { ...c, usageCount: (c.usageCount || 0) + 1 }
              : c
          );

          return {
            expenses: sortExpensesByDate([savedExpense, ...state.expenses]),
            categories: updatedCategories,
            isLoading: false
          } as any;
        });

        return savedExpense;
    } catch (error) {
      logError(error, 'addExpense');
      const errorMessage = getUserFriendlyMessage(error, 'expense');
      set({ error: errorMessage, isLoading: false } as any);
      return null;
    }
  },



  updateExpense: async (id, expenseData) => {
    set({ isLoading: true, error: null } as any);
    try {
      const { supabase } = await import('../../services/supabase');
      const state = get() as any;
      const expense = state.expenses.find((e: Expense) => e.id === id);

      // Determinar si es parte de un grupo de cuotas
      let siblingIds: string[] = [];
      let parentId: string | null = null;

      if (expense?.parentExpenseId) {
        // Es una cuota hija - obtener todas las hermanas y el padre
        parentId = expense.parentExpenseId;
        siblingIds = state.expenses
          .filter((e: Expense) => e.parentExpenseId === parentId)
          .map((e: Expense) => e.id);
      } else if (expense?.isParent) {
        // Es el padre - obtener todas las hijas
        parentId = id;
        siblingIds = state.expenses
          .filter((e: Expense) => e.parentExpenseId === id)
          .map((e: Expense) => e.id);
      }

      // Campos que se propagan a todas las cuotas
      const propagateFields = ['financialType', 'categoryIds'];
      const shouldPropagate = siblingIds.length > 0 &&
        propagateFields.some(field => expenseData[field as keyof typeof expenseData] !== undefined);

      // 1. Update the main expense
      const updateData: any = {};
      if (expenseData.amount !== undefined) updateData.amount = expenseData.amount;
      if (expenseData.description !== undefined) updateData.description = expenseData.description;
      if (expenseData.date !== undefined) updateData.date = expenseData.date;
      if (expenseData.financialType !== undefined) updateData.financial_type = expenseData.financialType;

      const { error: updateError } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Update categories for main expense
      if (expenseData.categoryIds) {
        const { error: deleteError } = await supabase
          .from('expense_categories')
          .delete()
          .eq('expense_id', id);

        if (deleteError) throw deleteError;

        if (expenseData.categoryIds.length > 0) {
          const junctionData = expenseData.categoryIds.map(catId => ({
            expense_id: id,
            category_id: catId
          }));

          const { error: insertError } = await supabase
            .from('expense_categories')
            .insert(junctionData);

          if (insertError) throw insertError;
        }
      }

      // 3. Propagar cambios a cuotas hermanas (categoría y financialType)
      if (shouldPropagate) {
        const idsToUpdate = parentId ? [parentId, ...siblingIds] : siblingIds;
        const otherIds = idsToUpdate.filter(sibId => sibId !== id);

        // Actualizar financialType en todas las cuotas hermanas y el padre (1 sola petición)
        if (expenseData.financialType !== undefined && otherIds.length > 0) {
          const { error: siblingUpdateError } = await supabase
            .from('expenses')
            .update({ financial_type: expenseData.financialType })
            .in('id', otherIds);

          if (siblingUpdateError) {
            logError(siblingUpdateError, 'updateExpense-propagateFinancialType');
          }
        }

        // Actualizar categorías en todas las cuotas hermanas (2 peticiones: 1 DELETE batch + 1 INSERT batch)
        if (expenseData.categoryIds && otherIds.length > 0) {
          // 1. Eliminar todas las categorías existentes de las hermanas (1 petición)
          const { error: deleteError } = await supabase
            .from('expense_categories')
            .delete()
            .in('expense_id', otherIds);

          if (deleteError) {
            logError(deleteError, 'updateExpense-deleteSiblingCategories');
          }

          // 2. Insertar todas las nuevas categorías para todas las hermanas (1 petición)
          if (expenseData.categoryIds.length > 0) {
            const allSiblingCategoryData: { expense_id: string; category_id: string }[] = [];
            for (const sibId of otherIds) {
              for (const catId of expenseData.categoryIds) {
                allSiblingCategoryData.push({ expense_id: sibId, category_id: catId });
              }
            }

            const { error: insertError } = await supabase
              .from('expense_categories')
              .insert(allSiblingCategoryData);

            if (insertError) {
              logError(insertError, 'updateExpense-insertSiblingCategories');
            }
          }
        }
      }

      // 4. Update local state (incluyendo hermanas si corresponde)
      set((state) => {
        let updatedExpenses = state.expenses.map(e => {
          if (e.id === id) {
            return { ...e, ...expenseData };
          }
          // Propagar a hermanas
          if (shouldPropagate && (siblingIds.includes(e.id) || e.id === parentId)) {
            const propagatedData: any = {};
            if (expenseData.financialType !== undefined) {
              propagatedData.financialType = expenseData.financialType;
            }
            if (expenseData.categoryIds !== undefined) {
              propagatedData.categoryIds = expenseData.categoryIds;
            }
            return { ...e, ...propagatedData };
          }
          return e;
        });

        return {
          expenses: expenseData.date ? sortExpensesByDate(updatedExpenses) : updatedExpenses,
          isLoading: false
        } as any;
      });
    } catch (error) {
      logError(error, 'updateExpense');
      const errorMessage = getUserFriendlyMessage(error, 'update');
      set({ error: errorMessage, isLoading: false } as any);
    }
  },

  removeExpense: async (id) => {
    set({ isLoading: true, error: null } as any);
    try {
      const { supabase } = await import('../../services/supabase');
      const state = get() as any;
      const expense = state.expenses.find((e: Expense) => e.id === id);

      if (!expense) {
        throw new Error('Gasto no encontrado');
      }

      let idsToDelete: string[] = [id];
      let parentIdToDelete: string | null = null;

      // Si es una cuota hija, encontrar el padre y todas las hermanas
      if (expense.parentExpenseId) {
        parentIdToDelete = expense.parentExpenseId;
        // Obtener todas las cuotas hermanas (incluyendo la actual)
        const siblings = state.expenses.filter(
          (e: Expense) => e.parentExpenseId === expense.parentExpenseId
        );
        idsToDelete = siblings.map((e: Expense) => e.id);
        idsToDelete.push(expense.parentExpenseId); // Agregar el padre
      }
      // Si es un gasto padre, encontrar todas las hijas
      else if (expense.isParent) {
        const children = state.expenses.filter(
          (e: Expense) => e.parentExpenseId === id
        );
        idsToDelete = [id, ...children.map((e: Expense) => e.id)];
      }

      // Obtener categoryIds del gasto para decrementar usage_count
      const categoryIdsToDecrement = expense.categoryIds || [];

      // Eliminar todos los gastos relacionados de Supabase
      // (Las expense_categories se eliminan por CASCADE en la BD)
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        logError(error, 'removeExpense');
        throw error;
      }

      // Decrementar usage_count de categorías (una vez, igual que al crear)
      try {
        for (const catId of categoryIdsToDecrement) {
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('usage_count')
            .eq('id', catId)
            .single();

          if (!catError && catData && (catData.usage_count || 0) > 0) {
            await supabase
              .from('categories')
              .update({ usage_count: (catData.usage_count || 0) - 1 })
              .eq('id', catId);
          }
        }
      } catch (err) {
        logError(err, 'removeExpense-usageCount');
      }

      // Actualizar estado local
      set((state) => {
        const categories = (state as any).categories || [];
        const updatedCategories = categories.map((c: any) =>
          categoryIdsToDecrement.includes(c.id)
            ? { ...c, usageCount: Math.max(0, (c.usageCount || 0) - 1) }
            : c
        );

        return {
          expenses: state.expenses.filter((e) => !idsToDelete.includes(e.id)),
          categories: updatedCategories,
          isLoading: false,
          error: null,
        } as any;
      });
    } catch (error) {
      logError(error, 'removeExpense');
      const errorMessage = getUserFriendlyMessage(error, 'delete');
      set({ error: errorMessage, isLoading: false } as any);
    }
  },

  addExpenseWithInstallments: async (expenseData) => {
    set({ isLoading: true, error: null } as any);
    try {
      const { supabase } = await import('../../services/supabase');
      const user = (get() as any).user;

      if (!user || !user.id) {
        const errorMsg = getUserFriendlyMessage(new Error('No user authenticated'), 'expense');
        logError(new Error('No user authenticated'), 'addExpenseWithInstallments');
        set({ error: errorMsg, isLoading: false } as any);
        throw new Error(errorMsg);
      }

      const installments = expenseData.installments || 1;
      const totalAmount = expenseData.amount;
      // Redondear a 2 decimales para evitar problemas de precisión
      const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;

      // 1. Crear gasto PADRE (metadata)
      const parentExpenseData = {
        amount: 0, // El padre tiene amount = 0 (es solo metadata)
        description: expenseData.description,
        date: expenseData.date,
        financial_type: expenseData.financialType || 'unclassified',
        user_id: user.id,
        payment_method: expenseData.paymentMethod || 'cash',
        payment_status: 'paid',
        installments: installments,
        installment_number: 1,
        total_amount: totalAmount,
        is_parent: true,
        credit_card_id: expenseData.creditCardId,
        service_id: expenseData.serviceId,
        payment_group_id: expenseData.paymentGroupId,
      };

      const { data: parentData, error: parentError } = await supabase
        .from('expenses')
        .insert([parentExpenseData])
        .select();

      if (parentError) {
        logError(parentError, 'addExpenseWithInstallments-parent');
        throw parentError;
      }

      const parentExpenseId = parentData[0].id;

      // 2. Asociar categorías al gasto padre
      if (expenseData.categoryIds && expenseData.categoryIds.length > 0) {
        // Filter out any invalid category IDs (mock data with short IDs)
        const validCategoryIds = expenseData.categoryIds.filter(catId => {
          // UUID format check
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId);
        });

        if (validCategoryIds.length === 0) {
          console.warn('No valid category IDs found, skipping category association');
        } else {
          const junctionData = validCategoryIds.map((catId) => ({
            expense_id: parentExpenseId,
            category_id: catId,
          }));

          const { error: junctionError } = await supabase
            .from('expense_categories')
            .insert(junctionData);

          if (junctionError) {
            logError(junctionError, 'addExpenseWithInstallments-categories');
          }
        }
      }

      // 3. Incrementar usage_count de categorías
      try {
        // Filter valid category IDs
        const validCategoryIds = expenseData.categoryIds.filter(catId =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId)
        );

        for (const catId of validCategoryIds) {
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('usage_count')
            .eq('id', catId)
            .single();

          if (!catError && catData) {
            await supabase
              .from('categories')
              .update({ usage_count: (catData.usage_count || 0) + 1 })
              .eq('id', catId);
          }
        }
      } catch (err) {
        logError(err, 'addExpenseWithInstallments-usageCount');
      }

      // 4. Crear cuotas hijas
      const baseDate = new Date(expenseData.date);
      const installmentsData = [];

      for (let i = 1; i <= installments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));

        installmentsData.push({
          user_id: user.id,
          amount: installmentAmount,
          description: `${expenseData.description} - Cuota ${i}/${installments}`,
          date: installmentDate.toISOString(),
          financial_type: expenseData.financialType || 'unclassified',
          payment_method: expenseData.paymentMethod || 'cash',
          payment_status: installmentDate <= new Date() ? 'paid' : 'pending',
          installments: installments,
          installment_number: i,
          parent_expense_id: parentExpenseId,
          is_parent: false,
          credit_card_id: expenseData.creditCardId,
          service_id: expenseData.serviceId,
          payment_group_id: expenseData.paymentGroupId,
        });
      }

      const { data: installmentsInserted, error: installmentsError } = await supabase
        .from('expenses')
        .insert(installmentsData)
        .select();

      if (installmentsError) {
        logError(installmentsError, 'addExpenseWithInstallments-installments');
        throw installmentsError;
      }

      // 5. Asociar categorías a cada cuota hija
      if (expenseData.categoryIds && expenseData.categoryIds.length > 0) {
        const validCategoryIds = expenseData.categoryIds.filter(catId =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catId)
        );

        if (validCategoryIds.length > 0 && installmentsInserted && installmentsInserted.length > 0) {
          // Crear asociaciones de categorías para cada cuota hija
          const childCategoryAssociations: { expense_id: string; category_id: string }[] = [];

          for (const installment of installmentsInserted) {
            for (const catId of validCategoryIds) {
              childCategoryAssociations.push({
                expense_id: installment.id,
                category_id: catId,
              });
            }
          }

          const { error: childCategoriesError } = await supabase
            .from('expense_categories')
            .insert(childCategoryAssociations);

          if (childCategoriesError) {
            logError(childCategoriesError, 'addExpenseWithInstallments-childCategories');
            // No throw, continuar aunque falle (las categorías se pueden asociar manualmente)
          }
        }
      }

      // 6. Actualizar estado local
      const parentExpense: Expense = {
        id: parentData[0].id,
        amount: 0,
        categoryIds: expenseData.categoryIds,
        description: parentData[0].description,
        date: parentData[0].date,
        createdAt: parentData[0].created_at,
        financialType: parentData[0].financial_type,
        paymentMethod: parentData[0].payment_method,
        paymentStatus: parentData[0].payment_status,
        installments: parentData[0].installments,
        installmentNumber: parentData[0].installment_number,
        totalAmount: Number(parentData[0].total_amount),
        isParent: parentData[0].is_parent,
        creditCardId: parentData[0].credit_card_id,
        serviceId: parentData[0].service_id,
        paymentGroupId: parentData[0].payment_group_id,
      };

      const childExpenses: Expense[] = installmentsInserted.map((item: any) => ({
        id: item.id,
        amount: Number(item.amount),
        categoryIds: expenseData.categoryIds,
        description: item.description,
        date: item.date,
        createdAt: item.created_at,
        financialType: item.financial_type,
        paymentMethod: item.payment_method,
        paymentStatus: item.payment_status,
        installments: item.installments,
        installmentNumber: item.installment_number,
        parentExpenseId: item.parent_expense_id,
        isParent: item.is_parent,
        creditCardId: item.credit_card_id,
        serviceId: item.service_id,
        paymentGroupId: item.payment_group_id,
      }));

      set((state) => {
        const categories = (state as any).categories || [];
        const updatedCategories = categories.map((c: any) =>
          expenseData.categoryIds.includes(c.id)
            ? { ...c, usageCount: (c.usageCount || 0) + 1 }
            : c
        );

        return {
          expenses: sortExpensesByDate([parentExpense, ...childExpenses, ...state.expenses]),
          categories: updatedCategories,
          isLoading: false,
        } as any;
      });
    } catch (error) {
      logError(error, 'addExpenseWithInstallments');
      const errorMessage = getUserFriendlyMessage(error, 'expense');
      set({ error: errorMessage, isLoading: false } as any);
    }
  },

  getExpenseInstallments: (parentExpenseId: string) => {
    const { expenses } = get();
    return expenses
      .filter((e) => e.parentExpenseId === parentExpenseId)
      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
  },

  getCurrentExpenses: () => {
    const { expenses } = get();
    const now = new Date();

    return expenses.filter((e) => {
      // Excluir gastos padre (son metadata)
      if (e.isParent) {
        return false;
      }

      // Excluir gastos futuros pendientes
      const expenseDate = new Date(e.date);
      if (e.paymentStatus === 'pending' && expenseDate > now) {
        return false;
      }

      return true;
    });
  },

  getUpcomingExpenses: () => {
    const { expenses } = get();
    const now = new Date();

    return expenses.filter((e) => {
      // Excluir gastos padre
      if (e.isParent) {
        return false;
      }

      // Solo gastos futuros pendientes
      const expenseDate = new Date(e.date);
      return e.paymentStatus === 'pending' && expenseDate > now;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getSummary: () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const state = get() as any;

    // Usar getCurrentExpenses para excluir gastos padre y futuros
    const validExpenses = get().getCurrentExpenses();

    const currentMonthExpenses = validExpenses.filter((e) =>
      isSameMonth(new Date(e.date), now)
    );
    const previousMonthExpenses = validExpenses.filter((e) =>
      isSameMonth(new Date(e.date), subMonths(now, 1))
    );

    const totalBalance = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousMonthBalance = previousMonthExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const daysPassed = getDate(now);
    const daysInMonth = getDaysInMonth(now);
    const daysRemaining = daysInMonth - daysPassed;
    const weeksPassed = Math.max(1, daysPassed / 7);
    const weeklyAverage = totalBalance / weeksPassed;

    // Calcular servicios recurrentes pendientes
    const recurringServices = state.recurringServices || [];
    const servicePayments = state.servicePayments || [];

    let pendingRecurring = 0;

    recurringServices.forEach((service: any) => {
      if (!service.is_active) return;

      // Verificar si ya se pagó este mes
      const payment = servicePayments.find(
        (p: any) => p.service_id === service.id &&
                    p.month === currentMonth + 1 &&
                    p.year === currentYear &&
                    p.status === 'paid'
      );

      if (!payment) {
        // Servicio aún no pagado este mes
        pendingRecurring += service.estimated_amount;
      }
    });

    // Separar gastos en fijos (con serviceId) y variables
    const fixedExpenses = currentMonthExpenses.filter((e) => e.serviceId);
    const variableExpenses = currentMonthExpenses.filter((e) => !e.serviceId);

    const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalVariable = variableExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Proyección mejorada:
    // Gastos fijos conocidos (ya pagados + pendientes) + proyección de variables
    const dailyVariableAverage = daysPassed > 0 ? totalVariable / daysPassed : 0;
    const projectedVariables = totalVariable + (dailyVariableAverage * daysRemaining);
    const projectedFixed = totalFixed + pendingRecurring;
    const projectedBalance = projectedFixed + projectedVariables;

    // Comparación con mes anterior
    const changeFromLastMonth = previousMonthBalance > 0
      ? ((totalBalance - previousMonthBalance) / previousMonthBalance) * 100
      : 0;

    return {
      totalBalance,
      previousMonthBalance,
      weeklyAverage,
      projectedBalance,
      // Nuevos campos
      totalFixed,
      totalVariable,
      pendingRecurring,
      projectedFixed,
      projectedVariables,
      changeFromLastMonth,
      daysPassed,
      daysRemaining,
    };
  },
});
