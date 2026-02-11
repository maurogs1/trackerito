import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useEffect } from 'react';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const {
    preferences,
    toggleTheme,
    user,
    loadUserProfile,
  } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
    },
    section: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.captionBold,
      color: currentTheme.textSecondary,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    label: {
      ...typography.body,
      color: currentTheme.text,
    },
    value: {
      ...typography.body,
      color: currentTheme.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Modo Oscuro</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: currentTheme.primary }}
            thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Moneda</Text>
          <Text style={styles.value}>{preferences.currency}</Text>
        </View>
        <TouchableOpacity
          style={[styles.row, { marginTop: spacing.sm }]}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.label}>Gestionar Categorías</Text>
          <Text style={{ color: currentTheme.primary }}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        {user?.email && (
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.row, { paddingVertical: spacing.md }]}
          onPress={async () => {
            try {
              const { signOut } = useStore.getState();
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Hubo un problema al cerrar sesión');
            }
          }}
        >
          <Text style={[styles.label, { color: currentTheme.error }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
