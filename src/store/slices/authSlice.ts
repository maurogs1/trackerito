import { StateCreator } from 'zustand';
import { User } from '../../features/auth/types';
import { getUserFriendlyMessage, logError } from '../../shared/utils/errorHandler';

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      // Implementation is handled in LoginScreen component
      // This action is just to set loading state if needed
    } catch (error) {
      logError(error, 'signInWithGoogle');
      const errorMessage = getUserFriendlyMessage(error, 'auth');
      set({ error: errorMessage, isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { supabase } = await import('../../services/supabase');
      const result = await supabase.auth.signOut();
      
      if (result.error) {
        throw result.error;
      }
      
      set({ isAuthenticated: false, user: null, isLoading: false });
    } catch (error) {
      logError(error, 'signOut');
      const errorMessage = getUserFriendlyMessage(error, 'auth');
      set({ error: errorMessage, isLoading: false });
    }
  },

  checkSession: async () => {
    // TODO: Check Supabase session
    // const { data: { session } } = await supabase.auth.getSession();
    // if (session) {
    //   set({ isAuthenticated: true, user: session.user });
    // }
  },
});
