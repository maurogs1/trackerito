import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useEffect } from 'react';
import { useToast } from '../../../shared/hooks/useToast';
import { Ionicons } from '@expo/vector-icons';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { preferences, toggleTheme, user, loadUserProfile } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { showError } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    content: {
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    sectionTitle: {
      ...typography.captionBold,
      color: currentTheme.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    section: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: currentTheme.border,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: currentTheme.border,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    rowLabel: {
      ...typography.body,
      color: currentTheme.text,
      flex: 1,
    },
    rowValue: {
      ...typography.body,
      color: currentTheme.textSecondary,
      marginRight: spacing.sm,
    },
  });

  const NavRow = ({
    icon, iconBg, label, value, onPress, isFirst = false,
  }: {
    icon: string; iconBg: string; label: string; value?: string;
    onPress: () => void; isFirst?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, !isFirst && styles.rowDivider]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={currentTheme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Apariencia */}
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#607D8B' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.rowLabel}>Modo Oscuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: currentTheme.primary }}
              thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Finanzas */}
        <Text style={styles.sectionTitle}>Finanzas</Text>
        <View style={styles.section}>
          <NavRow
            icon="pricetag"
            iconBg="#2196F3"
            label="Categorías"
            onPress={() => navigation.navigate('Categories')}
            isFirst
          />
          <NavRow
            icon="flash"
            iconBg="#F44336"
            label="Gastos Fijos"
            onPress={() => navigation.navigate('MonthlyPayments')}
          />
          <NavRow
            icon="stats-chart"
            iconBg="#FF5722"
            label="Estadísticas"
            onPress={() => navigation.navigate('Statistics')}
          />
          <NavRow
            icon="cash"
            iconBg="#4CAF50"
            label="Tipos de Ingreso"
            onPress={() => navigation.navigate('IncomeTypes')}
          />
          <NavRow
            icon="layers"
            iconBg="#795548"
            label="Espacios"
            onPress={() => navigation.navigate('Spaces')}
          />
        </View>

        {/* Herramientas */}
        <Text style={styles.sectionTitle}>Herramientas</Text>
        <View style={styles.section}>
          <NavRow
            icon="logo-whatsapp"
            iconBg="#25D366"
            label="Bot WhatsApp"
            onPress={() => navigation.navigate('WhatsApp')}
            isFirst
          />
          <NavRow
            icon="school"
            iconBg="#9C27B0"
            label="Educación Financiera"
            onPress={() => navigation.navigate('FinancialEducation')}
          />
        </View>

        {/* Cuenta */}
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.section}>
          {user?.email && (
            <View style={[styles.row]}>
              <View style={[styles.iconBox, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.rowLabel}>{user.email}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.row, styles.rowDivider]}
            onPress={async () => {
              try {
                const { signOut } = useStore.getState();
                await signOut();
              } catch {
                showError('Hubo un problema al cerrar sesión');
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: currentTheme.error }]}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.rowLabel, { color: currentTheme.error }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
