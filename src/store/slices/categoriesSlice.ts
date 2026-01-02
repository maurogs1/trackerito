import { StateCreator } from 'zustand';
import { Category } from '../../features/expenses/types';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface CategoriesSlice {
  categories: Category[];
  
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | undefined>;
  updateCategory: (category: Category) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  resetToMockData: () => void;
  getMostUsedCategories: () => Category[];
  ensureDefaultCategories: () => Promise<void>;
}

// Mock data generator
const getMockCategories = (): Category[] => [
  { id: '1', name: 'Supermercado222', icon: 'cart', color: '#FF5722' },
  { id: '2', name: 'Entretenimiento', icon: 'game-controller', color: '#9C27B0' },
  { id: '3', name: 'Transporte', icon: 'car', color: '#2196F3' },
  { id: '4', name: 'Salud', icon: 'medical', color: '#F44336' },
  { id: '5', name: 'Restaurante', icon: 'restaurant', color: '#FFC107' },
  { id: '6', name: 'Hogar', icon: 'home', color: '#795548' },
  { id: '7', name: 'Café', icon: 'cafe', color: '#795548' },
  { id: '8', name: 'Otros', icon: 'pricetag', color: '#607D8B' },
];

export const createCategoriesSlice: StateCreator<CategoriesSlice> = (set, get) => ({
  categories: [], // Start empty, load based on mode

  loadCategories: async () => {
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (isDemoMode) {
        set({ categories: getMockCategories() });
      } else {
        const { supabase } = await import('../../services/supabase');
        const userId = (get() as any).user?.id;
        
        if (!userId) {
          console.error('No user ID available for categories');
          set({ categories: [] });
          return;
        }

        // SANITY CHECK: Remove any mock data (ids like "1", "2") from state immediately
        // We do this by setting state to empty before loading, or filtering current state.
        // To be safe, let's clear it if we detect any invalid ID.
        const currentCategories = get().categories;
        const hasInvalidIds = currentCategories.some(c => c.id.length < 10);
        
        if (hasInvalidIds) {
          console.log('Purging mock categories from state...');
          set({ categories: [] });
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
          const defaultCategories = getMockCategories();
          
          const categoriesToInsert = defaultCategories.map(cat => ({
            // No id - Supabase generates it
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
            set({ categories: insertedData || [], error: null } as any);
          }
        } else {
          // Ensure we don't accidentally merge with mock data if it wasn't cleared
          // We replace the entire state with the fetched data
          set({ categories: data, error: null } as any);
        }
      }
    } catch (error) {
      logError(error, 'loadCategories');
      const errorMessage = getUserFriendlyMessage(error, 'load');
      if (isDemoMode) {
        set({ categories: getMockCategories(), error: null } as any);
      } else {
        set({ categories: [], error: errorMessage } as any);
      }
    }
  },

  addCategory: async (categoryData) => {
    const isDemoMode = (get() as any).isDemoMode;
    
    if (isDemoMode) {
      // Demo mode - generate ID locally
      const newCategory: Category = {
        ...categoryData,
        id: Math.random().toString(36).substr(2, 9),
        usageCount: 0,
        financialType: 'unclassified',
      };
      set((state) => ({ categories: [...state.categories, newCategory] }));
      return newCategory;
    } else {
      // Real mode - Supabase generates ID
      try {
        const { supabase } = await import('../../services/supabase');
        const userId = (get() as any).user?.id;
        
        if (!userId) {
          console.error('No user ID for adding category');
          return;
        }
        
        const { data, error } = await supabase.from('categories').insert([{
          // No id - Supabase generates it
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
        
        // Use the category returned by Supabase
        const newCategory = data[0];
        set((state) => ({ categories: [...state.categories, newCategory], error: null } as any));
        return newCategory;
      } catch (error) {
        logError(error, 'addCategory');
        const errorMessage = getUserFriendlyMessage(error, 'category');
        set({ error: errorMessage } as any);
      }
    }
  },
  
  updateCategory: async (updatedCategory) => {
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (!isDemoMode) {
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
    const isDemoMode = (get() as any).isDemoMode;
    
    try {
      if (!isDemoMode) {
        const { supabase } = await import('../../services/supabase');
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        
        if (error) {
          logError(error, 'removeCategory');
          throw error;
        }
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

  resetToMockData: () => {
    set({ categories: getMockCategories() });
  },

  getMostUsedCategories: () => {
    const { categories } = get();
    const isDemoMode = (get() as any).isDemoMode;
    
    // Extra safety filter: if not demo mode, hide mock categories
    const filteredCategories = isDemoMode 
      ? categories 
      : categories.filter(c => c.id.length > 10);
      
    return [...filteredCategories].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  },

  ensureDefaultCategories: async () => {
    const isDemoMode = (get() as any).isDemoMode;
    if (isDemoMode) return;

    const { supabase } = await import('../../services/supabase');
    const userId = (get() as any).user?.id;
    
    if (!userId) return;

    try {
      // Check existing categories count
      const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        logError(error, 'ensureDefaultCategories-check');
        return;
      }

      // If less than 3 categories, create defaults
      if (count === null || count < 3) {
        console.log('Less than 3 categories found. Creating defaults...');
        const defaultCategories = getMockCategories();
        
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
