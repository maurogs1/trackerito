import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius } from '../../../shared/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type BankDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BankDetail'>;
type BankDetailScreenRouteProp = RouteProp<RootStackParamList, 'BankDetail'>;

export default function BankDetailScreen() {
  const navigation = useNavigation<BankDetailScreenNavigationProp>();
  const route = useRoute<BankDetailScreenRouteProp>();
  const { bankId, bankName } = route.params;
  const { preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    navigation.setOptions({ title: bankName });
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
      padding: spacing.xl,
    },
    card: {
      backgroundColor: currentTheme.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xxl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: currentTheme.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={40} color={currentTheme.primary} />
        </View>
        <Text style={[typography.title, { color: currentTheme.text, marginBottom: spacing.sm }]}>{bankName}</Text>
        <Text style={[typography.body, { color: currentTheme.textSecondary, textAlign: 'center' }]}>
          Este banco está vinculado a tu cuenta.
        </Text>
      </View>
    </View>
  );
}
