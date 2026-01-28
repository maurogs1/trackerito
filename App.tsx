import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator';

// Navigation ref for navigating from outside React components
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

export default function App() {
  const isNavigationReady = useRef(false);
  const pendingAction = useRef<string | null>(null);

  useEffect(() => {
    // Only set up quick actions on native platforms
    if (Platform.OS === 'web') return;

    // Dynamic import for native-only package
    const setupQuickActions = async () => {
      try {
        const QuickActions = await import('expo-quick-actions');

        // Set up quick actions
        QuickActions.setItems([
          {
            id: 'add_expense',
            title: 'Agregar Gasto',
            subtitle: 'Registrar un nuevo gasto',
            icon: Platform.OS === 'android' ? 'add_icon' : 'symbol:plus.circle.fill',
            params: { screen: 'AddExpense' },
          },
        ]);

        // Handle quick action when app is already open
        const subscription = QuickActions.addListener((action: { id?: string } | null) => {
          if (action?.id === 'add_expense') {
            if (isNavigationReady.current && navigationRef.current) {
              navigationRef.current.navigate('AddExpense');
            } else {
              pendingAction.current = 'AddExpense';
            }
          }
        });

        // Check initial action if app was launched from quick action
        if (QuickActions.initial?.id === 'add_expense') {
          pendingAction.current = 'AddExpense';
        }

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.log('Quick actions not available:', error);
      }
    };

    setupQuickActions();
  }, []);

  const onNavigationReady = () => {
    isNavigationReady.current = true;
    // Handle pending action if app was launched from quick action
    if (pendingAction.current && navigationRef.current) {
      navigationRef.current.navigate('AddExpense');
      pendingAction.current = null;
    }
  };

  return (
    <SafeAreaProvider>
      <AppNavigator
        navigationRef={navigationRef}
        onReady={onNavigationReady}
      />
    </SafeAreaProvider>
  );
}
