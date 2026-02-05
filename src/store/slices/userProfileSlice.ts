import { StateCreator } from 'zustand';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../features/settings/types';

export interface UserProfileSlice {
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  loadUserProfile: () => Promise<void>;
  updatePhoneNumber: (phoneNumber: string) => Promise<void>;
  toggleWhatsappNotifications: () => Promise<void>;
}

export const createUserProfileSlice: StateCreator<UserProfileSlice> = (set, get) => ({
  userProfile: null,
  userProfileLoading: false,
  userProfileError: null,

  loadUserProfile: async () => {
    set({ userProfileLoading: true, userProfileError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ userProfileLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK for new users
        throw error;
      }

      set({ userProfile: data, userProfileLoading: false });
    } catch (error) {
      console.error('Error loading user profile:', error);
      set({
        userProfileError: error instanceof Error ? error.message : 'Error al cargar perfil',
        userProfileLoading: false
      });
    }
  },

  updatePhoneNumber: async (phoneNumber: string) => {
    set({ userProfileLoading: true, userProfileError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const currentProfile = get().userProfile;

      if (currentProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ phone_number: phoneNumber })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        set({ userProfile: data, userProfileLoading: false });
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            phone_number: phoneNumber,
            whatsapp_notifications_enabled: true,
          })
          .select()
          .single();

        if (error) throw error;
        set({ userProfile: data, userProfileLoading: false });
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      set({
        userProfileError: error instanceof Error ? error.message : 'Error al guardar teléfono',
        userProfileLoading: false
      });
      throw error;
    }
  },

  toggleWhatsappNotifications: async () => {
    set({ userProfileLoading: true, userProfileError: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const currentProfile = get().userProfile;
      const newValue = !currentProfile?.whatsapp_notifications_enabled;

      if (currentProfile) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ whatsapp_notifications_enabled: newValue })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        set({ userProfile: data, userProfileLoading: false });
      } else {
        // Create profile if doesn't exist
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            phone_number: null,
            whatsapp_notifications_enabled: newValue,
          })
          .select()
          .single();

        if (error) throw error;
        set({ userProfile: data, userProfileLoading: false });
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      set({
        userProfileError: error instanceof Error ? error.message : 'Error al cambiar notificaciones',
        userProfileLoading: false
      });
      throw error;
    }
  },
});
