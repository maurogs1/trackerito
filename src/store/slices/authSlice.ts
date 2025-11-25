import { StateCreator } from 'zustand';
import { User } from '../../features/auth/types';

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  toggleDemoMode: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isDemoMode: true,

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      // Implementation is handled in LoginScreen component
      // This action is just to set loading state if needed
    } catch (error) {
      set({ error: 'Error al iniciar sesión', isLoading: false });
    }
  },

  signOut: async () => {
    console.log('signOut function called');
    set({ isLoading: true, error: null });
    try {
      console.log('Importing supabase...');
      const { supabase } = await import('../../services/supabase');
      console.log('Calling supabase.auth.signOut()...');
      const result = await supabase.auth.signOut();
      console.log('Supabase signOut result:', result);
      console.log('Updating store state...');
      set({ isAuthenticated: false, user: null, isLoading: false });
      console.log('Store state updated successfully');
    } catch (error) {
      console.error('Error in signOut:', error);
      set({ error: 'Error al cerrar sesión', isLoading: false });
    }
  },

  checkSession: async () => {
    // TODO: Check Supabase session
    // const { data: { session } } = await supabase.auth.getSession();
    // if (session) {
    //   set({ isAuthenticated: true, user: session.user });
    // }
  },

  toggleDemoMode: async () => {
    const currentMode = get().isDemoMode;
    const newMode = !currentMode;
    
    console.log(`Toggling demo mode: ${currentMode} → ${newMode}`);
    
    // Update the mode first
    set({ isDemoMode: newMode });
    
    // Access all the load/reset functions from other slices
    const state = get() as any;
    
    if (newMode) {
      // Switching TO demo mode - load mock data
      console.log('Loading mock data...');
      state.resetToMockData?.(); // expenses
      state.loadGoals?.();
      state.loadCategories?.();
      state.loadBudgets?.();
      state.loadInvestments?.();
    } else {
      // Switching TO real mode - load from Supabase
      console.log('Loading real data from Supabase...');
      await Promise.all([
        state.loadExpenses?.(),
        state.loadGoals?.(),
        state.loadCategories?.(),
        state.loadBudgets?.(),
        state.loadInvestments?.(),
      ]);
    }
    
    console.log('Demo mode toggle complete');
  },
});
