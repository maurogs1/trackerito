import { StateCreator } from 'zustand';
import { Category } from '../../features/expenses/types';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface CategoriesSlice {
  categories: Category[];
  
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | undefined>;
  updateCategory: (category: Category) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  getMostUsedCategories: () => Category[];
  ensureDefaultCategories: () => Promise<void>;
}

// Default categories for new users
const getDefaultCategories = (): Omit<Category, 'id'>[] => [
  { name: 'Supermercado', icon: 'cart', color: '#FF5722' },
  { name: 'Entretenimiento', icon: 'game-controller', color: '#9C27B0' },
  { name: 'Transporte', icon: 'car', color: '#2196F3' },
  { name: 'Salud', icon: 'medical', color: '#F44336' },
  { name: 'Restaurante', icon: 'restaurant', color: '#FFC107' },
  { name: 'Hogar', icon: 'home', color: '#795548' },
  { name: 'Café', icon: 'cafe', color: '#795548' },
  { name: 'Otros', icon: 'pricetag', color: '#607D8B' },
];

export const createCategoriesSlice: StateCreator<CategoriesSlice> = (set, get) => ({
  categories: [],

  loadCategories: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;

      if (!userId) {
        console.error('No user ID available for categories');
        set({ categories: [] });
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        logError(error, 'loadCategories');
        const errorMessage = getUserFriendlyMessage(error, 'load');
        set({ categories: [], error: errorMessage } as any);
        return;
      }

      // If no categories exist, create default ones in Supabase
      if (!data || data.length === 0) {
        console.log('No categories found, creating default categories in Supabase...');
        const defaultCategories = getDefaultCategories();

        const categoriesToInsert = defaultCategories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          usage_count: 0,
          financial_type: 'unclassified',
          user_id: userId,
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)
          .select();

        if (insertError) {
          logError(insertError, 'loadCategories-defaults');
          const errorMessage = getUserFriendlyMessage(insertError, 'category');
          set({ categories: [], error: errorMessage } as any);
        } else {
          console.log('Default categories created successfully');
          const mappedCategories = (insertedData || []).map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            usageCount: cat.usage_count || 0,
            financialType: cat.financial_type,
          }));
          set({ categories: mappedCategories, error: null } as any);
        }
      } else {
        const mappedCategories = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          usageCount: cat.usage_count || 0,
          financialType: cat.financial_type,
        }));
        set({ categories: mappedCategories, error: null } as any);
      }
    } catch (error) {
      logError(error, 'loadCategories');
      const errorMessage = getUserFriendlyMessage(error, 'load');
      set({ categories: [], error: errorMessage } as any);
    }
  },

  addCategory: async (categoryData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;

      if (!userId) {
        console.error('No user ID for adding category');
        return;
      }

      const { data, error } = await supabase.from('categories').insert([{
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        usage_count: 0,
        financial_type: 'unclassified',
        user_id: userId,
      }]).select();

      if (error) {
        logError(error, 'addCategory');
        throw error;
      }

      const rawCategory = data[0];
      const newCategory: Category = {
        id: rawCategory.id,
        name: rawCategory.name,
        icon: rawCategory.icon,
        color: rawCategory.color,
        usageCount: rawCategory.usage_count || 0,
        financialType: rawCategory.financial_type,
      };
      set((state) => ({ categories: [...state.categories, newCategory], error: null } as any));
      return newCategory;
    } catch (error) {
      logError(error, 'addCategory');
      const errorMessage = getUserFriendlyMessage(error, 'category');
      set({ error: errorMessage } as any);
    }
  },
  
  updateCategory: async (updatedCategory) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('categories')
        .update({
          name: updatedCategory.name,
          icon: updatedCategory.icon,
          color: updatedCategory.color,
          usage_count: updatedCategory.usageCount,
          financial_type: updatedCategory.financialType,
        })
        .eq('id', updatedCategory.id);

      if (error) {
        logError(error, 'updateCategory');
        throw error;
      }

      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === updatedCategory.id ? updatedCategory : c
        ),
        error: null
      } as any));
    } catch (error) {
      logError(error, 'updateCategory');
      const errorMessage = getUserFriendlyMessage(error, 'update');
      set({ error: errorMessage } as any);
    }
  },

  removeCategory: async (id) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'removeCategory');
        throw error;
      }

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        error: null
      } as any));
    } catch (error) {
      logError(error, 'removeCategory');
      const errorMessage = getUserFriendlyMessage(error, 'delete');
      set({ error: errorMessage } as any);
    }
  },

  getMostUsedCategories: () => {
    const { categories } = get();
    return [...categories].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  },

  ensureDefaultCategories: async () => {
    const { supabase } = await import('../../services/supabase');
    const userId = (get() as any).user?.id;

    if (!userId) return;

    try {
      const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        logError(error, 'ensureDefaultCategories-check');
        return;
      }

      if (count === null || count < 3) {
        console.log('Less than 3 categories found. Creating defaults...');
        const defaultCategories = getDefaultCategories();
        
        const categoriesToInsert = defaultCategories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          usage_count: 0,
          financial_type: 'unclassified',
          user_id: userId,
        }));
        
        const { data, error: insertError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)
          .select();
        
        if (insertError) {
          logError(insertError, 'ensureDefaultCategories-create');
        } else if (data) {
          console.log('Default categories created successfully');
          // Reload all categories to ensure consistency and avoid duplicates in state
          await get().loadCategories();
        }
      }
    } catch (error) {
      logError(error, 'ensureDefaultCategories');
    }
  },
});
