import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { theme } from '../shared/theme';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import AllExpensesScreen from '../features/expenses/screens/AllExpensesScreen';
import IncomeScreen from '../features/income/screens/IncomeScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';

export type TabParamList = {
  Dashboard: undefined;
  AllExpenses: undefined;
  Income: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: currentTheme.card,
          borderTopColor: currentTheme.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: currentTheme.primary,
        tabBarInactiveTintColor: currentTheme.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: currentTheme.card },
        headerTintColor: currentTheme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            AllExpenses: ['list', 'list-outline'],
            Income: ['wallet', 'wallet-outline'],
            Settings: ['settings', 'settings-outline'],
          };
          const [active, inactive] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false, tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="AllExpenses"
        component={AllExpensesScreen}
        options={{ title: 'Mis Gastos', tabBarLabel: 'Gastos' }}
      />
      <Tab.Screen
        name="Income"
        component={IncomeScreen}
        options={{ headerShown: false, tabBarLabel: 'Ingresos' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configuración', tabBarLabel: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}
