import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { theme } from '../shared/theme';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import AddExpenseScreen from '../features/expenses/screens/AddExpenseScreen';
import AllExpensesScreen from '../features/expenses/screens/AllExpensesScreen';
import FinancialEducationScreen from '../features/education/screens/FinancialEducationScreen';
import BudgetsScreen from '../features/budgets/screens/BudgetsScreen';
import BenefitsScreen from '../features/benefits/screens/BenefitsScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import GoalsScreen from '../features/goals/screens/GoalsScreen';
import CategoriesScreen from '../features/settings/screens/CategoriesScreen';
import { StatusBar } from 'expo-status-bar';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AddExpense: undefined;
  Settings: undefined;
  Goals: undefined;
  Categories: undefined;
  AllExpenses: undefined;
  FinancialEducation: undefined;
  Budgets: undefined;
  Benefits: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { preferences, isAuthenticated } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  const navigator = (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* @ts-ignore - TypeScript incorrectly reports missing children prop */}
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: currentTheme.card,
          },
          headerTintColor: currentTheme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: currentTheme.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AddExpense" 
              component={AddExpenseScreen} 
              options={{ title: 'Agregar Gasto' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ title: 'Configuración' }}
            />
            <Stack.Screen 
              name="Goals" 
              component={GoalsScreen} 
              options={{ title: 'Metas Financieras' }}
            />
            <Stack.Screen 
              name="Budgets" 
              component={BudgetsScreen} 
              options={{ title: 'Presupuestos' }}
            />
            <Stack.Screen 
              name="Benefits" 
              component={BenefitsScreen} 
              options={{ title: 'Beneficios' }}
            />
            <Stack.Screen 
              name="Categories" 
              component={CategoriesScreen} 
              options={{ title: 'Categorías' }}
            />
            <Stack.Screen 
              name="AllExpenses" 
              component={AllExpensesScreen} 
              options={{ title: 'Todos los Gastos' }}
            />
            <Stack.Screen 
              name="FinancialEducation" 
              component={FinancialEducationScreen} 
              options={{ title: 'Educación Financiera' }}
            />
          </>
        )}
      </Stack.Navigator>
    </>
  );

  return (
    // @ts-ignore - TypeScript incorrectly reports missing children prop
    <NavigationContainer theme={navigationTheme}>
      {navigator}
    </NavigationContainer>
  );
}
