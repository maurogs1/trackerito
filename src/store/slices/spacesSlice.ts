import { StateCreator } from 'zustand';
import { logError } from '../../shared/utils/errorHandler';

export interface Space {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface SpacesSlice {
  spaces: Space[];
  activeSpaceId: string | null;

  loadSpaces: () => Promise<void>;
  addSpace: (space: Omit<Space, 'id' | 'isDefault'>) => Promise<Space | undefined>;
  updateSpace: (space: Space) => Promise<void>;
  removeSpace: (id: string) => Promise<void>;
  setActiveSpace: (id: string) => void;
}

const TABLES_WITH_SPACE = ['expenses', 'incomes', 'categories', 'recurring_services', 'income_types'] as const;

export const createSpacesSlice: StateCreator<SpacesSlice> = (set, get) => ({
  spaces: [],
  activeSpaceId: null,

  loadSpaces: async () => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        logError(error, 'loadSpaces');
        return;
      }

      let spaces: Space[];
      let defaultSpaceId: string;

      if (!data || data.length === 0) {
        // First time: create "Personal" space
        const { data: created, error: createError } = await supabase
          .from('spaces')
          .insert([{ user_id: userId, name: 'Personal', icon: 'person', color: '#2196F3', is_default: true }])
          .select()
          .single();

        if (createError || !created) {
          logError(createError, 'loadSpaces-create');
          return;
        }

        spaces = [{ id: created.id, name: created.name, icon: created.icon, color: created.color, isDefault: true }];
        defaultSpaceId = created.id;
      } else {
        spaces = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          color: s.color,
          isDefault: s.is_default,
        }));
        defaultSpaceId = spaces.find(s => s.isDefault)?.id ?? spaces[0].id;
      }

      // One-time migration: assign null space_id records to the default space
      for (const table of TABLES_WITH_SPACE) {
        await supabase
          .from(table)
          .update({ space_id: defaultSpaceId })
          .eq('user_id', userId)
          .is('space_id', null);
      }

      const currentActiveId = get().activeSpaceId;
      const validActive = spaces.find(s => s.id === currentActiveId);

      set({
        spaces,
        activeSpaceId: validActive ? currentActiveId : defaultSpaceId,
      });
    } catch (error) {
      logError(error, 'loadSpaces');
    }
  },

  addSpace: async (spaceData) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const userId = (get() as any).user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('spaces')
        .insert([{ user_id: userId, name: spaceData.name, icon: spaceData.icon, color: spaceData.color, is_default: false }])
        .select()
        .single();

      if (error) {
        logError(error, 'addSpace');
        throw error;
      }

      const newSpace: Space = { id: data.id, name: data.name, icon: data.icon, color: data.color, isDefault: false };
      set((state) => ({ spaces: [...state.spaces, newSpace] }));
      return newSpace;
    } catch (error) {
      logError(error, 'addSpace');
      throw error;
    }
  },

  updateSpace: async (space) => {
    try {
      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase
        .from('spaces')
        .update({ name: space.name, icon: space.icon, color: space.color })
        .eq('id', space.id);

      if (error) {
        logError(error, 'updateSpace');
        throw error;
      }

      set((state) => ({
        spaces: state.spaces.map((s) => (s.id === space.id ? space : s)),
      }));
    } catch (error) {
      logError(error, 'updateSpace');
      throw error;
    }
  },

  removeSpace: async (id) => {
    try {
      const { spaces, activeSpaceId } = get();
      const spaceToRemove = spaces.find(s => s.id === id);
      if (spaceToRemove?.isDefault) throw new Error('No podés eliminar el espacio predeterminado');

      const { supabase } = await import('../../services/supabase');
      const { error } = await supabase.from('spaces').delete().eq('id', id);

      if (error) {
        logError(error, 'removeSpace');
        throw error;
      }

      const remaining = spaces.filter(s => s.id !== id);
      const newActiveId = activeSpaceId === id
        ? (remaining.find(s => s.isDefault)?.id ?? remaining[0]?.id ?? null)
        : activeSpaceId;

      set({ spaces: remaining, activeSpaceId: newActiveId });
    } catch (error) {
      logError(error, 'removeSpace');
      throw error;
    }
  },

  setActiveSpace: (id) => {
    set({ activeSpaceId: id });
  },
});
