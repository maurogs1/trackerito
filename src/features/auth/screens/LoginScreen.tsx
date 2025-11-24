import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login, isLoading, preferences, error } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }
    await login(username, password);
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
      marginBottom: 40,
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
    },
    formContainer: {
      width: '100%',
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 8,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.border,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: currentTheme.text,
      paddingHorizontal: 8, // Added horizontal padding
    },
    loginButton: {
      backgroundColor: currentTheme.primary,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
      shadowColor: currentTheme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    googleButtonText: {
      color: currentTheme.text,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      color: currentTheme.textSecondary,
      fontSize: 14,
    },
    signupText: {
      color: currentTheme.primary,
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 4,
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
        <Ionicons name="wallet" size={64} color={currentTheme.primary} />
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>

      <View style={styles.formContainer}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Usuario</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={currentTheme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor={currentTheme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={currentTheme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={() => Alert.alert('Info', 'Próximamente')}>
          <Ionicons name="logo-google" size={24} color={currentTheme.text} />
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity>
            <Text style={styles.signupText}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
