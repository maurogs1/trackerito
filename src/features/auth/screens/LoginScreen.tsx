import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../services/supabase';
import { getUserFriendlyMessage, logError } from '../../../shared/utils/errorHandler';

WebBrowser.maybeCompleteAuthSession();

const loadEssentialData = async () => {
  const state = useStore.getState();
  await Promise.all([
    state.loadExpenses(),
    state.loadCategories(),
  ]);
};

export default function LoginScreen() {
  const { isLoading, preferences, error } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (url.includes('auth/callback')) {
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) {
          logError(new Error(errorCode), 'OAuth-callback');
          const errorMessage = getUserFriendlyMessage(new Error(errorCode), 'auth');
          Alert.alert('Error', errorMessage);
          useStore.setState({ error: errorMessage });
          return;
        }

        if (params.access_token && params.refresh_token) {
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            if (sessionError) throw sessionError;

            useStore.setState({
              isAuthenticated: true,
              user: sessionData.user,
              error: null
            });

            await loadEssentialData();
          } catch (e: unknown) {
            logError(e, 'OAuth-session-set');
            const errorMessage = getUserFriendlyMessage(e, 'auth');
            Alert.alert('Error', errorMessage);
            useStore.setState({ error: errorMessage });
          }
        } else {
          const errorMsg = 'Faltan tokens en la URL de callback';
          logError(new Error(errorMsg), 'OAuth-callback-tokens');
          const errorMessage = getUserFriendlyMessage(new Error(errorMsg), 'auth');
          Alert.alert('Error', errorMessage);
          useStore.setState({ error: errorMessage });
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = makeRedirectUri({
        scheme: 'trackerito',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (result.type === 'success') {
          const { url } = result;
          const { params, errorCode } = QueryParams.getQueryParams(url);

          if (errorCode) throw new Error(errorCode);

          if (params.access_token && params.refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            if (sessionError) throw sessionError;

            useStore.setState({
              isAuthenticated: true,
              user: sessionData.user,
              error: null
            });

            await loadEssentialData();
          } else {
            throw new Error('Faltan tokens de autenticación');
          }
        } else if (result.type === 'cancel') {
          return;
        } else {
          throw new Error('La autenticación no se completó correctamente');
        }
      }
    } catch (e: unknown) {
      logError(e, 'Google-login');
      const errorMessage = getUserFriendlyMessage(e, 'auth');
      Alert.alert('Error', errorMessage);
      useStore.setState({ error: errorMessage });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: currentTheme.background,
    },
    header: {
      alignItems: 'center',
      marginBottom: 60,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.surface,
      padding: spacing.lg + 2,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      ...shadows.md,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={80} color={currentTheme.primary} />
        <Text style={[typography.title, { color: currentTheme.primary, marginTop: spacing.lg, fontSize: 32 }]}>
          Trackerito
        </Text>
        <Text style={[typography.body, { color: currentTheme.textSecondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl }]}>
          Tu compañero financiero inteligente. Inicia sesión para sincronizar tus datos.
        </Text>
      </View>

      {error && (
        <Text style={[typography.body, { color: currentTheme.error, marginBottom: spacing.lg, textAlign: 'center' }]}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={currentTheme.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={24} color={currentTheme.text} />
            <Text style={[typography.button, { color: currentTheme.text, marginLeft: spacing.md }]}>
              Continuar con Google
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
