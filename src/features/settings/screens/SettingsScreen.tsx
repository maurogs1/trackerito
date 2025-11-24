import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme } from '../../../shared/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { preferences, toggleTheme } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    section: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    label: {
      fontSize: 16,
      color: currentTheme.text,
    },
    value: {
      fontSize: 16,
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
          style={[styles.row, { marginTop: 8 }]} 
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.label}>Gestionar Categorías</Text>
          <Text style={{ color: currentTheme.primary }}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
