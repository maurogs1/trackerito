import React, { RefObject } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { theme } from '../shared/theme';
import TabNavigator from './TabNavigator';
import AddExpenseScreen from '../features/expenses/screens/AddExpenseScreen';
import FinancialEducationScreen from '../features/education/screens/FinancialEducationScreen';
import BenefitsScreen from '../features/benefits/screens/BenefitsScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import CategoriesScreen from '../features/settings/screens/CategoriesScreen';
import CategoryFormScreen from '../features/settings/screens/CategoryFormScreen';
import IncomeTypesScreen from '../features/settings/screens/IncomeTypesScreen';
import IncomeTypeFormScreen from '../features/settings/screens/IncomeTypeFormScreen';
import MonthlyPaymentsScreen from '../features/monthlyPayments/screens/MonthlyPaymentsScreen';
import RecurringServicesScreen from '../features/monthlyPayments/screens/RecurringServicesScreen';
import AddRecurringServiceScreen from '../features/monthlyPayments/screens/AddRecurringServiceScreen';
import PaymentGroupsScreen from '../features/monthlyPayments/screens/PaymentGroupsScreen';
import AddIncomeScreen from '../features/income/screens/AddIncomeScreen';
import WhatsAppScreen from '../features/whatsapp/screens/WhatsAppScreen';
import StatisticsScreen from '../features/statistics/screens/StatisticsScreen';
import { StatusBar } from 'expo-status-bar';
import Toast from '../shared/components/Toast';
import { useToast } from '../shared/hooks/useToast';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  // Tab screens — kept for type compatibility with existing navigation calls
  Dashboard: undefined;
  AllExpenses: undefined;
  Income: undefined;
  Settings: undefined;
  // Stack screens
  AddExpense: { expenseId?: string; amount?: number; description?: string } | undefined;
  Categories: undefined;
  FinancialEducation: undefined;
  Benefits: undefined;
  MonthlyPayments: undefined;
  RecurringServices: undefined;
  AddRecurringService: { serviceId?: string; prefilledName?: string; prefilledIcon?: string; prefilledColor?: string; prefilledAmount?: number; prefilledDay?: number } | undefined;
  PaymentGroups: undefined;
  AddIncome: { incomeId?: string } | undefined;
  WhatsApp: undefined;
  Statistics: undefined;
  CategoryForm: { categoryId?: string } | undefined;
  IncomeTypes: undefined;
  IncomeTypeForm: { incomeTypeId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  navigationRef?: RefObject<NavigationContainerRef<RootStackParamList> | null>;
  onReady?: () => void;
}

export default function AppNavigator({ navigationRef, onReady }: AppNavigatorProps) {
  const { preferences, isAuthenticated } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;
  const { toast, hideToast } = useToast();

  // Set up Supabase auth listener
  React.useEffect(() => {
    const { supabase } = require('../services/supabase');

    console.log('Setting up Supabase auth listener...');

    // Check initial session
    supabase.auth.getSession().then(({ data, error }: { data: { session: { user: unknown } | null }; error: Error | null }) => {
      if (error) {
        console.error('Error checking initial session:', error);
        return;
      }
      
      console.log('Initial session check:', data.session ? 'Session exists' : 'No session');
      if (data.session?.user) {
        console.log('User from initial session:', (data.session.user as { email?: string }).email);
        useStore.setState({
          isAuthenticated: true,
          user: data.session.user as never
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: { user: unknown } | null) => {
        console.log('Auth state change event:', event);
        console.log('Session:', session ? 'Session exists' : 'No session');
        if (session?.user) {
          console.log('User email:', (session.user as { email?: string }).email);
          useStore.setState({
            isAuthenticated: true,
            user: session.user as never
          });
        } else {
          console.log('No session, logging out');
          useStore.setState({
            isAuthenticated: false,
            user: null
          });
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const navigationTheme = isDark ? DarkTheme : DefaultTheme;

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        theme={navigationTheme}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ title: 'Agregar Gasto' }}
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
              name="FinancialEducation"
              component={FinancialEducationScreen}
              options={{ title: 'Educación Financiera' }}
            />
            <Stack.Screen name="MonthlyPayments" component={MonthlyPaymentsScreen} options={{ title: 'Pagos del Mes' }} />
            <Stack.Screen name="RecurringServices" component={RecurringServicesScreen} options={{ title: 'Gastos Fijos' }} />
            <Stack.Screen name="AddRecurringService" component={AddRecurringServiceScreen} options={{ title: 'Agregar Gasto Fijo' }} />
            <Stack.Screen name="PaymentGroups" component={PaymentGroupsScreen} options={{ title: 'Grupos de Pago' }} />
            <Stack.Screen name="AddIncome" component={AddIncomeScreen} options={{ title: 'Agregar Ingreso' }} />
            <Stack.Screen name="WhatsApp" component={WhatsAppScreen} options={{ title: 'WhatsApp Bot' }} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Estadísticas' }} />
            <Stack.Screen name="CategoryForm" component={CategoryFormScreen} options={{ title: 'Nueva Categoría' }} />
            <Stack.Screen name="IncomeTypes" component={IncomeTypesScreen} options={{ title: 'Tipos de Ingreso' }} />
            <Stack.Screen name="IncomeTypeForm" component={IncomeTypeFormScreen} options={{ title: 'Nuevo Tipo' }} />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast toast={toast} onHide={hideToast} isDark={isDark} />
    </>
  );
}
