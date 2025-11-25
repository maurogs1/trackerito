import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../services/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { isLoading, preferences, error } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  // Handle OAuth callback via deep link
  useEffect(() => {
    console.log('Setting up URL listener for OAuth callback...');
    
    const handleUrl = async ({ url }: { url: string }) => {
      console.log('Received URL:', url);
      
      if (url.includes('auth/callback')) {
        console.log('OAuth callback URL detected');
        const { params, errorCode } = QueryParams.getQueryParams(url);
        console.log('Callback params:', params);
        console.log('Callback error code:', errorCode);

        if (errorCode) {
          console.error('OAuth error:', errorCode);
          Alert.alert('Error', `Error de autenticación: ${errorCode}`);
          return;
        }

        if (params.access_token && params.refresh_token) {
          console.log('Tokens found in callback, setting session...');
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            console.log('Session set from callback:', sessionData);
            if (sessionError) {
              console.error('Session error from callback:', sessionError);
              throw sessionError;
            }


            console.log('Updating store from callback...');
            useStore.setState({
              isAuthenticated: true,
              user: sessionData.user
            });
          } catch (e: any) {
            console.error('Error setting session from callback:', e);
            Alert.alert('Error', e.message || 'Error al completar la autenticación');
          }
        } else {
          console.error('Missing tokens in callback URL');
        }
      }
    };

    // Listen for URL events
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if the app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with URL:', url);
        handleUrl({ url });
      }
    });

    return () => {
      console.log('Cleaning up URL listener');
      subscription.remove();
    };
  }, []);

  const handleGoogleLogin = async () => {
    console.log('Starting Google login...');
    try {
      const redirectUri = makeRedirectUri({
        scheme: 'trackerito',
        path: 'auth/callback',
      });
      console.log('Redirect URI:', redirectUri);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;
      console.log('OAuth data:', data);
      
      if (data.url) {
        console.log('Opening auth session...');
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        console.log('Auth session result:', result);
        
        if (result.type === 'success') {
          const { url } = result;
          console.log('Success URL:', url);
          const { params, errorCode } = QueryParams.getQueryParams(url);
          console.log('Parsed params:', params);
          console.log('Error code:', errorCode);

          if (errorCode) throw new Error(errorCode);
          
          if (params.access_token && params.refresh_token) {
            console.log('Setting session with tokens...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            
            console.log('Session data:', sessionData);
            if (sessionError) {
              console.error('Session error:', sessionError);
              throw sessionError;
            }
            
            // Manually update the store state
            console.log('Session set successfully, updating store...');
            useStore.setState({ 
              isAuthenticated: true, 
              user: sessionData.user 
            });
          } else {
            console.error('Missing tokens in params');
          }
        } else {
          console.log('Auth session was not successful:', result.type);
        }
      }
    } catch (e: any) {
      console.error('Error during Google login:', e);
      Alert.alert('Error', e.message || 'Error al iniciar sesión con Google');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: currentTheme.background,
    },
    header: {
      alignItems: 'center',
      marginBottom: 60,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: currentTheme.primary,
      marginTop: 16,
    },
    subtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.surface,
      padding: 18,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    googleButtonText: {
      color: currentTheme.text,
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 12,
    },
    errorText: {
      color: currentTheme.error,
      marginBottom: 16,
      textAlign: 'center',
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={80} color={currentTheme.primary} />
        <Text style={styles.title}>Trackerito</Text>
        <Text style={styles.subtitle}>Tu compañero financiero inteligente. Inicia sesión para sincronizar tus datos.</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

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
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

