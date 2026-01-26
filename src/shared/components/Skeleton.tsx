import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  isDark?: boolean;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  isDark = false
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const currentTheme = isDark ? theme.dark : theme.light;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#3D3D3D' : '#E1E1E1',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton para una tarjeta de gasto
export function ExpenseCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <View style={[
      styles.expenseCard,
      { backgroundColor: isDark ? theme.dark.card : theme.light.card }
    ]}>
      <View style={styles.expenseCardContent}>
        <View style={styles.expenseCardLeft}>
          <Skeleton width={40} height={40} borderRadius={20} isDark={isDark} />
          <View style={styles.expenseCardInfo}>
            <Skeleton width={120} height={16} isDark={isDark} />
            <Skeleton width={80} height={12} isDark={isDark} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={styles.expenseCardRight}>
          <Skeleton width={70} height={18} isDark={isDark} />
          <Skeleton width={50} height={12} isDark={isDark} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

// Skeleton para el Hub Financiero
export function FinancialHubSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <View style={[
      styles.hubCard,
      { backgroundColor: isDark ? theme.dark.card : theme.light.card }
    ]}>
      {/* Balance principal */}
      <View style={styles.hubBalance}>
        <Skeleton width={100} height={14} isDark={isDark} />
        <Skeleton width={150} height={32} isDark={isDark} style={{ marginTop: 8 }} />
      </View>

      {/* Ingresos y Gastos */}
      <View style={styles.hubStats}>
        <View style={styles.hubStatItem}>
          <Skeleton width={60} height={12} isDark={isDark} />
          <Skeleton width={90} height={20} isDark={isDark} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.hubStatItem}>
          <Skeleton width={60} height={12} isDark={isDark} />
          <Skeleton width={90} height={20} isDark={isDark} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

// Skeleton para tarjeta de beneficio
export function BenefitCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <View style={[
      styles.benefitCard,
      { backgroundColor: isDark ? theme.dark.card : theme.light.card }
    ]}>
      <Skeleton width={32} height={32} borderRadius={8} isDark={isDark} />
      <Skeleton width={100} height={14} isDark={isDark} style={{ marginTop: 8 }} />
      <Skeleton width={60} height={12} isDark={isDark} style={{ marginTop: 4 }} />
    </View>
  );
}

// Skeleton para la lista de actividad reciente
export function ActivityListSkeleton({ isDark = false, count = 3 }: { isDark?: boolean; count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ExpenseCardSkeleton key={index} isDark={isDark} />
      ))}
    </View>
  );
}

// Skeleton completo para el Dashboard
export function DashboardSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <View style={styles.dashboardContainer}>
      {/* Sección: Hub Financiero */}
      <View style={styles.section}>
        <Skeleton width={120} height={20} isDark={isDark} style={{ marginBottom: 12 }} />
        <FinancialHubSkeleton isDark={isDark} />
      </View>

      {/* Sección: Beneficios */}
      <View style={styles.section}>
        <Skeleton width={140} height={20} isDark={isDark} style={{ marginBottom: 12 }} />
        <View style={styles.benefitsRow}>
          <BenefitCardSkeleton isDark={isDark} />
          <BenefitCardSkeleton isDark={isDark} />
          <BenefitCardSkeleton isDark={isDark} />
        </View>
      </View>

      {/* Sección: Actividad Reciente */}
      <View style={styles.section}>
        <Skeleton width={130} height={20} isDark={isDark} style={{ marginBottom: 12 }} />
        <ActivityListSkeleton isDark={isDark} count={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  expenseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseCardInfo: {
    marginLeft: 12,
  },
  expenseCardRight: {
    alignItems: 'flex-end',
  },
  hubCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hubBalance: {
    alignItems: 'center',
    marginBottom: 20,
  },
  hubStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  hubStatItem: {
    alignItems: 'center',
  },
  benefitCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: 100,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitsRow: {
    flexDirection: 'row',
  },
  dashboardContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
});

export default Skeleton;
