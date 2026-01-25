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
import InvestmentsScreen from '../features/investments/screens/InvestmentsScreen';
import CategoriesScreen from '../features/settings/screens/CategoriesScreen';
import BanksScreen from '../features/banks/screens/BanksScreen';
import BankDetailScreen from '../features/banks/screens/BankDetailScreen';
import CreditCardScreen from '../features/creditCards/screens/CreditCardScreen';
import AddCreditCardScreen from '../features/creditCards/screens/AddCreditCardScreen';
import AddCreditCardPurchaseScreen from '../features/creditCards/screens/AddCreditCardPurchaseScreen';
import MonthlyPaymentsScreen from '../features/monthlyPayments/screens/MonthlyPaymentsScreen';
import RecurringServicesScreen from '../features/monthlyPayments/screens/RecurringServicesScreen';
import IncomeScreen from '../features/income/screens/IncomeScreen';
import { StatusBar } from 'expo-status-bar';
import Toast from '../shared/components/Toast';
import { useToast } from '../shared/hooks/useToast';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AddExpense: { expenseId?: string; amount?: number; description?: string; isCreditCardPayment?: boolean; creditCardId?: string } | undefined;
  Settings: undefined;
  Goals: undefined;
  Categories: undefined;
  AllExpenses: undefined;
  FinancialEducation: undefined;
  Budgets: undefined;
  Benefits: undefined;
  Investments: undefined;
  Banks: undefined;
  BankDetail: { bankId: string; bankName: string };
  CreditCard: { cardId: string; cardName: string };
  AddCreditCard: { bankId: string };
  AddCreditCardPurchase: { cardId: string };
  MonthlyPayments: undefined;
  RecurringServices: undefined;
  Income: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
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
      <NavigationContainer theme={navigationTheme}>
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
              name="Investments"
              component={InvestmentsScreen}
              options={{ title: 'Inversiones' }}
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
            <Stack.Screen name="Banks" component={BanksScreen} options={{ title: 'Mis Bancos' }} />
            <Stack.Screen name="BankDetail" component={BankDetailScreen} options={{ title: 'Detalle del Banco' }} />
            <Stack.Screen name="CreditCard" component={CreditCardScreen} options={{ title: 'Tarjeta' }} />
            <Stack.Screen name="AddCreditCard" component={AddCreditCardScreen} options={{ title: 'Nueva Tarjeta' }} />
            <Stack.Screen name="AddCreditCardPurchase" component={AddCreditCardPurchaseScreen} options={{ title: 'Nuevo Consumo' }} />
            <Stack.Screen name="MonthlyPayments" component={MonthlyPaymentsScreen} options={{ title: 'Pagos del Mes' }} />
            <Stack.Screen name="RecurringServices" component={RecurringServicesScreen} options={{ title: 'Gastos Fijos' }} />
            <Stack.Screen name="Income" component={IncomeScreen} options={{ title: 'Mis Ingresos' }} />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast toast={toast} onHide={hideToast} isDark={isDark} />
    </>
  );
}
