import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useStore } from '../../../store/useStore';
import { theme, typography, spacing, borderRadius, shadows } from '../../../shared/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../../../shared/utils/currency';
import { Ionicons } from '@expo/vector-icons';

type DebtsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Debts'>;

export default function DebtsScreen() {
  const navigation = useNavigation<DebtsScreenNavigationProp>();
  const { debts, loadDebts, isLoadingDebts, preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    loadDebts();
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
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: currentTheme.border,
      ...shadows.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    progressContainer: {
      height: 8,
      backgroundColor: currentTheme.surface,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: currentTheme.primary,
      borderRadius: borderRadius.sm,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    fab: {
      position: 'absolute',
      bottom: spacing.xxl,
      right: spacing.xxl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: currentTheme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
    }
  });

  const renderItem = ({ item }: { item: any }) => {
    const progress = item.totalInstallments > 0 ? item.currentInstallment / item.totalInstallments : 0;

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={[typography.sectionTitle, { color: currentTheme.text }]}>{item.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={[typography.captionBold, { color: '#4CAF50' }]}>
              {item.status === 'active' ? 'ACTIVA' : 'PAGADA'}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.detailsRow}>
          <Text style={[typography.body, { color: currentTheme.textSecondary }]}>
            Cuota {item.currentInstallment}/{item.totalInstallments}
          </Text>
          <Text style={[typography.bodyBold, { color: currentTheme.text }]}>
            {formatCurrency(item.installmentAmount)}/mes
          </Text>
        </View>

        <View style={[styles.detailsRow, { marginTop: spacing.xs }]}>
          <Text style={[typography.body, { color: currentTheme.textSecondary }]}>
            Restante: {formatCurrency(item.totalAmount - (item.installmentAmount * item.currentInstallment))}
          </Text>
          <Text style={[typography.caption, { color: currentTheme.textSecondary }]}>
            Total: {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={debts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoadingDebts} onRefresh={loadDebts} tintColor={currentTheme.primary} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={[typography.body, { color: currentTheme.textSecondary }]}>
              No tienes deudas registradas
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateDebt', {})}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}
