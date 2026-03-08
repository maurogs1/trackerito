import { StateCreator } from 'zustand';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface IncomeTypeItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface IncomeTypesSlice {
  incomeTypes: IncomeTypeItem[];

  loadIncomeTypes: () => Promise<void>;
  addIncomeType: (item: Omit<IncomeTypeItem, 'id'>) => Promise<IncomeTypeItem | undefined>;
  updateIncomeType: (item: IncomeTypeItem) => Promise<void>;
  removeIncomeType: (id: string) => Promise<void>;
  ensureDefaultIncomeTypes: () => Promise<void>;
}

const DEFAULT_INCOME_TYPES: Omit<IncomeTypeItem, 'id'>[] = [
  { name: 'Sueldo', icon: 'briefcase', color: '#4CAF50' },
  { name: 'Freelance', icon: 'laptop', color: '#2196F3' },
  { name: 'Bono', icon: 'gift', color: '#FF9800' },
  { name: 'Inversiones', icon: 'trending-up', color: '#9C27B0' },
  { name: 'Alquiler', icon: 'home', color: '#795548' },
  { name: 'Otro', icon: 'cash', color: '#607D8B' },
];

export const createIncomeTypesSlice: StateCreator<IncomeTypesSlice> = (set, get) => ({
  incomeTypes: [],

  loadIncomeTypes: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('income_types')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        logError(error, 'loadIncomeTypes');
        return;
      }

      if (!data || data.length === 0) {
        await get().ensureDefaultIncomeTypes();
        return;
      }

      set({
        incomeTypes: data.map((t: any) => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          color: t.color,
        })),
      });
    } catch (error) {
      logError(error, 'loadIncomeTypes');
    }
  },

  addIncomeType: async (itemData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;
      if (!userId) return;

      const activeSpaceId = (get() as any).activeSpaceId;
      const { data, error } = await supabase
        .from('income_types')
        .insert([{ user_id: userId, name: itemData.name, icon: itemData.icon, color: itemData.color, space_id: activeSpaceId || undefined }])
        .select()
        .single();

      if (error) {
        logError(error, 'addIncomeType');
        throw error;
      }

      const newItem: IncomeTypeItem = { id: data.id, name: data.name, icon: data.icon, color: data.color };
      set((state) => ({ incomeTypes: [...state.incomeTypes, newItem] }));
      return newItem;
    } catch (error) {
      logError(error, 'addIncomeType');
      const msg = getUserFriendlyMessage(error, 'income');
      throw new Error(msg);
    }
  },

  updateIncomeType: async (item) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('income_types')
        .update({ name: item.name, icon: item.icon, color: item.color })
        .eq('id', item.id);

      if (error) {
        logError(error, 'updateIncomeType');
        throw error;
      }

      set((state) => ({
        incomeTypes: state.incomeTypes.map((t) => (t.id === item.id ? item : t)),
      }));
    } catch (error) {
      logError(error, 'updateIncomeType');
      const msg = getUserFriendlyMessage(error, 'update');
      throw new Error(msg);
    }
  },

  removeIncomeType: async (id) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase.from('income_types').delete().eq('id', id);

      if (error) {
        logError(error, 'removeIncomeType');
        throw error;
      }

      set((state) => ({ incomeTypes: state.incomeTypes.filter((t) => t.id !== id) }));
    } catch (error) {
      logError(error, 'removeIncomeType');
      const msg = getUserFriendlyMessage(error, 'delete');
      throw new Error(msg);
    }
  },

  ensureDefaultIncomeTypes: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;
      if (!userId) return;

      const activeSpaceId = (get() as any).activeSpaceId;
      const toInsert = DEFAULT_INCOME_TYPES.map((t) => ({ ...t, user_id: userId, space_id: activeSpaceId || undefined }));
      const { data, error } = await supabase.from('income_types').insert(toInsert).select();

      if (error) {
        logError(error, 'ensureDefaultIncomeTypes');
        return;
      }

      set({
        incomeTypes: (data || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          color: t.color,
        })),
      });
    } catch (error) {
      logError(error, 'ensureDefaultIncomeTypes');
    }
  },
});
